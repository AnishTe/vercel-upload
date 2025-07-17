"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { getCompatibleUrl } from "@/utils/url-helpers"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion"
import { Progress } from "@/components/ui/progress"

type StepStatus = "not_started" | "in_progress" | "completed" | "failed" | "cancelled"

interface KYCState {
  steps: {
    signin: StepStatus
    "personal-details": StepStatus
    "nominee-poa": StepStatus
    bank: StepStatus
    exchange: StepStatus
    completion: StepStatus
  }
  currentStep: string
  //kyc mode
  kycMode: "online" | "offline"
  // Remove sessionId from state - now using sessionStorage
  digioSessionId?: string
  digioDocId?: string
  kycId?: string
  // Add a new field to track previously completed steps
  previouslyCompletedSteps?: {
    [key: string]: boolean
  }
}

// Session ID management to context type
interface KYCContextType {
  state: KYCState
  updateStepStatus: (step: keyof KYCState["steps"], status: StepStatus) => void
  setCurrentStep: (step: string) => void
  navigateToStep: (step: string) => void
  navigateToPreviousStep: () => void // New function for back navigation
  canAccessStep: (step: string) => boolean
  setSessionId: (id: string) => void // Add session ID setter
  setDigioSessionId: (id: string) => void
  setDigioDocId: (id: string) => void
  setKycId: (id: string) => void
  handleDigioParams: () => void
  getPreviousStep: (currentStep: string) => string | null
  getNextStep: (currentStep: string) => string | null
  handleDigioReturn: (step: string, status: "success" | "failure" | "cancel") => void
  showBankConfirmation: boolean
  setShowBankConfirmation: (show: boolean) => void
  pendingNavigation: string | null
  setPendingNavigation: (step: string | null) => void
  validateStepStatuses: () => boolean
  trackCompletedStep: (step: string) => void
  fixInconsistentState: () => boolean
  getSessionId: () => string | null
  redirectToCorrectStep: () => void
  clearSession: () => void
  setKYCMode: (mode: "offline" | "online") => void
  isOfflineMode: boolean
  checkTokenValidity: (tokenValidity?: { isValid: boolean; message?: string }) => boolean
  clearAllKYCData: () => void
  isLocalStorageCleared: () => boolean
  isValidatingAccess: boolean
  // New loading state properties
  isNavigating: boolean
  navigationMessage: string
  setNavigationLoading: (loading: boolean, message?: string) => void
  handleStepCompletion: (step: keyof KYCState["steps"], data: any, nextStep?: string) => void
}

const initialState: KYCState = {
  steps: {
    signin: "not_started",
    "personal-details": "not_started",
    "nominee-poa": "not_started",
    bank: "not_started",
    exchange: "not_started",
    completion: "not_started",
  },
  kycMode: "online",
  currentStep: "signin",
  previouslyCompletedSteps: {},
}

const KYCContext = createContext<KYCContextType | undefined>(undefined)

export function KYCProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KYCState>(() => {
    // Try to load state from localStorage on client side
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("kyc_state")
        if (savedState) {
          return JSON.parse(savedState)
        }
      } catch (error) {
        console.error("Error loading KYC state from localStorage:", error)
      }
    }
    return initialState
  })

  // Add these new state variables
  const [showBankConfirmation, setShowBankConfirmation] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isValidatingAccess, setIsValidatingAccess] = useState(true)
  const [isTokenExpired, setIsTokenExpired] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(10)

  // New loading state variables
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationMessage, setNavigationMessage] = useState("")

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isInitialMount = useRef(true)
  const hasValidatedSteps = useRef(false)
  const hasValidatedAccess = useRef(false)
  const hasProcessedParams = useRef(false)
  const navigationInProgress = useRef(false)
  const hasFixedInconsistentState = useRef(false)
  const hasRedirectedToCorrectStep = useRef(false)
  const hasHandledSessionInvalidation = useRef(false)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Define the step sequence as per user requirement
  const STEP_SEQUENCE = useMemo(
    () => ["signin", "personal-details", "nominee-poa", "bank", "exchange", "completion"],
    [],
  )

  // New function to handle navigation loading state
  const setNavigationLoading = (loading: boolean, message = "") => {
    setIsNavigating(loading)
    setNavigationMessage(message)
  }

  // New function to handle step completion with loading state
  const handleStepCompletion = (step: keyof KYCState["steps"], data: Record<string, any>, nextStep?: string) => {
    setNavigationLoading(true, `Completing ${step.replace("-", " ")} step...`);

    try {
      localStorage.setItem(`kyc_${step}_form`, JSON.stringify(data));
      updateStepStatus(step, "completed");

      toast({
        title: "Step Completed",
        description: `${step.replace("-", " ")} information saved successfully.`,
      });

      const targetStep = nextStep || getNextStep(step) || step;

      setTimeout(() => {
        setNavigationLoading(true, "Redirecting to next step...");

        // ✅ Ensure currentStep state updates before navigating
        setCurrentStep(targetStep);

        setTimeout(() => {
          navigateToStep(targetStep); // ⛔ watch out if blocked due to flag
          setNavigationLoading(false);
        }, 400); // small delay
      }, 1000);
    } catch (error) {
      console.error(`Error completing ${step} step:`, error);
      setNavigationLoading(false);
      toast({
        title: "Error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkTokenValidity = (tokenValidity?: { isValid: boolean; message?: string }) => {
    if (!tokenValidity || tokenValidity.isValid) return true

    setIsTokenExpired(true)
    setRedirectCountdown(10)

    // Clear previous interval if exists
    if (countdownRef.current) clearInterval(countdownRef.current)

    countdownRef.current = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          setIsTokenExpired(false)
          router.replace("/kyc/signin")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    clearAllKYCData()
    setState(initialState)
    return false
  }

  const redirectDuration = 10_000 // 10 seconds in ms
  const startTime = useRef<number | null>(null)
  const rawProgress = useMotionValue(0)

  // Smooth spring value (optional for ease-in-out)
  const smoothProgress = useSpring(rawProgress, { damping: 20, stiffness: 120 })

  // Percentage for display
  const progressPercent = useTransform(smoothProgress, (value) => Math.min(Math.floor(value * 100), 100))

  useAnimationFrame((time) => {
    if (isTokenExpired) {
      if (startTime.current === null) startTime.current = time

      const elapsed = time - startTime.current
      const progress = Math.min(elapsed / redirectDuration, 1) // from 0 to 1

      rawProgress.set(progress)

      if (progress === 1) {
        setIsTokenExpired(false)
        router.replace("/kyc/signin")
      }
    } else {
      rawProgress.set(0)
      startTime.current = null
    }
  })

  const setKYCMode = (mode: "online" | "offline") => {
    setState((prev) => ({ ...prev, kycMode: mode }))
    localStorage.setItem("kyc_mode", mode)
  }
  const isOfflineMode = state.kycMode === "offline"

  // Session ID management functions
  const setSessionId = (id: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("kyc_session_id", id)
      console.log(`Session ID set in sessionStorage: ${id}`)
    }
  }

  const getSessionId = (): string | null => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("kyc_session_id")
    }
    return null
  }

  const clearSession = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kyc_session_id")
      console.log("Session ID cleared from sessionStorage")
    }
  }

  // Add this function after the clearSession function
  const clearAllKYCData = () => {
    if (typeof window !== "undefined") {
      // Clear session storage
      sessionStorage.removeItem("kyc_session_id")

      // Clear all KYC form data from localStorage
      const keysToRemove = [
        "kyc_state",
        "kyc_signin_form",
        "kyc_personal-details_form",
        "kyc_nominee-poa_form",
        "kyc_bank_form",
        "kyc_exchange_form",
        "kyc_completion_form",
        "kyc_last_navigation",
        "kyc_referrer",
      ]

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
      })

      console.log("All KYC data cleared from storage")
    }
  }

  // Add this function after clearAllKYCData
  const isLocalStorageCleared = (): boolean => {
    if (typeof window === "undefined") return false

    const kycState = localStorage.getItem("kyc_state")
    const hasAnyKYCData = [
      "kyc_signin_form",
      "kyc_personal-details_form",
      "kyc_nominee-poa_form",
      "kyc_bank_form",
      "kyc_exchange_form",
      "kyc_completion_form",
    ].some((key) => localStorage.getItem(key))

    return !kycState && !hasAnyKYCData
  }

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    try {
      localStorage.setItem("kyc_state", JSON.stringify(state))
    } catch (error) {
      console.error("Error saving KYC state to localStorage:", error)
    }
  }, [state])

  // Update current step based on URL when component mounts
  useEffect(() => {
    // Extract step from pathname, handling both normal and .html paths
    let path = pathname.split("/").pop() || ""
    if (path.endsWith(".html")) {
      path = path.replace(".html", "")
    }
    if (path && STEP_SEQUENCE.includes(path)) {
      setState((prev) => {
        if (prev.currentStep !== path) {
          return { ...prev, currentStep: path }
        }
        return prev
      })
    }
  }, [STEP_SEQUENCE, pathname])

  const canAccessStep = useCallback(
    (step: string) => {
      const stepIndex = STEP_SEQUENCE.indexOf(step)

      // First step is always accessible
      if (stepIndex === 0) return true

      // Check if this is a completed step - allow access to completed steps for editing
      const stepStatus = state.steps[step as keyof typeof state.steps]
      if (stepStatus === "completed") {
        return true // Allow revisiting completed steps
      }

      // For personal-details step, check if signin is completed AND has form data
      if (step === "personal-details") {
        const signinForm = localStorage.getItem("kyc_signin_form")
        return state.steps.signin === "completed" && !!signinForm
      }

      // Standard case: Check if all previous steps are completed
      for (let i = 0; i < stepIndex; i++) {
        const prevStep = STEP_SEQUENCE[i] as keyof KYCState["steps"]
        if (state.steps[prevStep] !== "completed") {
          console.log(
            `Previous step ${prevStep} is not completed (${state.steps[prevStep]}), blocking access to ${step}`,
          )
          return false
        }
      }

      return true
    },
    [STEP_SEQUENCE, state],
  )

  const getPreviousStep = useCallback(
    (currentStep: string): string | null => {
      const currentIndex = STEP_SEQUENCE.indexOf(currentStep)

      if (currentIndex > 0) {
        return STEP_SEQUENCE[currentIndex - 1]
      }

      return null
    },
    [STEP_SEQUENCE],
  )

  // New function for back navigation
  const navigateToPreviousStep = useCallback(() => {
    const currentPath = pathname.split("/").pop()?.replace(".html", "") || ""
    const previousStep = getPreviousStep(currentPath)

    if (previousStep) {
      console.log(`Navigating back from ${currentPath} to ${previousStep}`)

      // Track navigation direction
      trackNavigation(currentPath, previousStep)

      // Set navigation in progress flag
      navigationInProgress.current = true

      // Build URL with session_id if available (but not for signin step)
      let targetUrl = getCompatibleUrl(`/kyc/${previousStep}`)
      const currentSessionId = getSessionId()
      if (currentSessionId && previousStep !== "signin") {
        targetUrl += `?session_id=${currentSessionId}`
      }

      // Show navigation message
      toast({
        title: "Going back",
        description: `Returning to ${previousStep.replace("-", " ")} step.`,
        variant: "default",
      })

      // Navigate with a small delay
      setTimeout(() => {
        router.push(targetUrl)
      }, 100)
    } else {
      toast({
        title: "Cannot go back",
        description: "You are already on the first step.",
        variant: "destructive",
      })
    }
  }, [pathname, getPreviousStep, router])

  // Function to find the correct step based on completion status - IMPROVED VERSION
  const findCorrectStep = useCallback((): string => {
    console.log("Finding correct step based on completion status...")
    console.log("Current step statuses:", state.steps)

    const currentPath = pathname.split("/").pop()?.replace(".html", "") || ""

    // ✅ Allow staying on current step if it's valid and accessible
    if (STEP_SEQUENCE.includes(currentPath) && canAccessStep(currentPath)) {
      console.log(`User is allowed on ${currentPath}, no redirection needed`)
      return currentPath
    }

    // Find the furthest accessible step based on completed steps and form data
    let furthestAccessibleStep = STEP_SEQUENCE[0] // Default to first step

    for (let i = 0; i < STEP_SEQUENCE.length; i++) {
      const step = STEP_SEQUENCE[i] as keyof KYCState["steps"]
      const stepStatus = state.steps[step]
      const hasFormData = localStorage.getItem(`kyc_${step}_form`)

      console.log(`Checking step ${step}: status=${stepStatus}, hasFormData=${!!hasFormData}`)

      // If step is completed and has form data, it's accessible
      if (stepStatus === "completed" && hasFormData) {
        furthestAccessibleStep = step
        console.log(`Step ${step} is completed with data, updating furthest accessible`)
      }
      // If step is not completed, check if we can access it based on previous steps
      else if (stepStatus !== "completed") {
        // Check if all previous steps are completed
        let canAccessThisStep = true
        for (let j = 0; j < i; j++) {
          const prevStep = STEP_SEQUENCE[j] as keyof KYCState["steps"]
          const prevStepStatus = state.steps[prevStep]
          const prevStepHasData = localStorage.getItem(`kyc_${prevStep}_form`)

          if (prevStepStatus !== "completed" || !prevStepHasData) {
            canAccessThisStep = false
            break
          }
        }

        if (canAccessThisStep) {
          furthestAccessibleStep = step
          console.log(`Step ${step} is accessible as next step, updating furthest accessible`)
          break // This is the next step to work on
        } else {
          break // Can't access this step, so stop here
        }
      }
    }

    console.log(`Furthest accessible step determined: ${furthestAccessibleStep}`)
    return furthestAccessibleStep
  }, [STEP_SEQUENCE, canAccessStep, pathname, state.steps])

  // Add this new function after the findCorrectStep function
  const validateCurrentStepAccess = useCallback((): boolean => {
    const currentPath = pathname.split("/").pop()?.replace(".html", "") || ""

    // Always allow access to signin
    if (currentPath === "signin") {
      return true
    }

    // Check if localStorage was cleared
    const kycStateExists = localStorage.getItem("kyc_state")
    if (!kycStateExists) {
      console.log("localStorage cleared, access denied")
      return false
    }

    // Check session for non-signin pages
    const sessionIdFromUrl = searchParams.get("session_id")
    const currentSessionId = getSessionId()
    if (!sessionIdFromUrl && !currentSessionId) {
      console.log("No session found, access denied")
      return false
    }

    // Check if user can access this specific step
    if (!canAccessStep(currentPath)) {
      console.log(`Access denied to step: ${currentPath}`)
      return false
    }

    return true
  }, [canAccessStep, pathname, searchParams])

  // Function to redirect to the correct step - IMPROVED VERSION
  const redirectToCorrectStep = useCallback(() => {
    if (!isInitialized || hasRedirectedToCorrectStep.current || navigationInProgress.current) {
      return
    }

    // Don't redirect if we've handled session invalidation
    if (hasHandledSessionInvalidation.current) {
      return
    }

    const currentPath = pathname.split("/").pop()?.replace(".html", "") || ""

    // For non-signin pages, check if we have a valid session before redirecting
    if (currentPath !== "signin") {
      const sessionIdFromUrl = searchParams.get("session_id")
      const currentSessionId = getSessionId()

      if (!sessionIdFromUrl && !currentSessionId) {
        // Let session validation handle this case
        return
      }
    }

    const correctStep = findCorrectStep()

    console.log("Redirect check:", {
      correctStep,
      currentPath,
      shouldRedirect: correctStep !== currentPath,
      isInitialized,
      hasRedirected: hasRedirectedToCorrectStep.current,
      navigationInProgress: navigationInProgress.current,
    })

    // Only redirect if we're not already on the correct step and it's a valid KYC step
    if (correctStep !== currentPath && STEP_SEQUENCE.includes(currentPath)) {
      // Special handling for personal-details - don't auto-redirect if user is actively working on it
      if (currentPath === "personal-details" && canAccessStep(currentPath)) {
        console.log("User is on personal-details and has access, not redirecting")
        return
      }

      console.log(`Redirecting from ${currentPath} to correct step: ${correctStep}`)
      hasRedirectedToCorrectStep.current = true
      navigationInProgress.current = true

      // Build URL with session_id if available and not signin step
      let targetUrl = getCompatibleUrl(`/kyc/${correctStep}`)

      // Only add session_id for non-signin steps
      if (correctStep !== "signin") {
        const currentSessionId = getSessionId()
        if (currentSessionId) {
          targetUrl += `?session_id=${currentSessionId}`
        }
      }

      toast({
        title: "Redirecting to correct step",
        description: `Taking you to the ${correctStep.replace("-", " ")} step based on your progress.`,
        variant: "default",
      })

      setTimeout(() => {
        router.replace(targetUrl)
      }, 100)
    } else {
      console.log("Already on correct step or not a KYC page")
    }
  }, [STEP_SEQUENCE, findCorrectStep, isInitialized, pathname, router, searchParams, canAccessStep])

  // New function to fix inconsistent state
  const fixInconsistentState = useCallback(() => {
    console.log("Checking for inconsistent state...")

    // Check if we have an inconsistent state where later steps are completed
    // but earlier steps are not
    const updatedSteps = { ...state.steps }
    let needsUpdate = false

    // Check for the specific case where signin is in_progress but later steps are completed
    if (
      updatedSteps.signin === "in_progress" &&
      (updatedSteps["personal-details"] === "completed" || updatedSteps.bank === "completed")
    ) {
      console.log("Found inconsistent state: signin is in_progress but later steps are completed")

      // Check if we have signin form data
      const signinData = localStorage.getItem("kyc_signin_form")
      if (signinData) {
        console.log("Found signin form data, marking signin as completed")
        updatedSteps.signin = "completed"
        needsUpdate = true
      }
    }

    // Check for any other inconsistencies in the step order using the correct sequence
    for (let i = 0; i < STEP_SEQUENCE.length - 1; i++) {
      const currentStep = STEP_SEQUENCE[i] as keyof KYCState["steps"]
      const nextStep = STEP_SEQUENCE[i + 1] as keyof KYCState["steps"]

      // If the current step is not completed but the next step is completed or in_progress
      if (
        updatedSteps[currentStep] !== "completed" &&
        (updatedSteps[nextStep] === "completed" || updatedSteps[nextStep] === "in_progress")
      ) {
        console.log(
          `Found inconsistent state: ${currentStep} is ${updatedSteps[currentStep]} but ${nextStep} is ${updatedSteps[nextStep]}`,
        )

        // Check if we have form data for the current step
        const formData = localStorage.getItem(`kyc_${currentStep}_form`)
        if (formData) {
          console.log(`Found form data for ${currentStep}, marking it as completed`)
          updatedSteps[currentStep] = "completed"
          needsUpdate = true
        }
      }
    }

    // Update state if needed
    if (needsUpdate) {
      setState((prev) => ({
        ...prev,
        steps: updatedSteps,
      }))

      // Also update localStorage
      try {
        localStorage.setItem(
          "kyc_state",
          JSON.stringify({
            ...state,
            steps: updatedSteps,
          }),
        )
      } catch (error) {
        console.error("Error saving updated KYC state to localStorage:", error)
      }

      console.log("Fixed inconsistent state:", updatedSteps)
      return true
    }

    return false
  }, [STEP_SEQUENCE, state])

  // Modified handleDigioParams function to handle session_id
  const handleDigioParams = useCallback(() => {
    // Only process if we haven't already processed these params
    if (hasProcessedParams.current) {
      return
    }

    const status = searchParams.get("status")
    const digioDocId = searchParams.get("digio_doc_id")
    const sessionIdFromParams = searchParams.get("session_id")
    const message = searchParams.get("message")

    if (status && digioDocId) {
      console.log("Detected Digio redirect with params:", {
        status,
        digioDocId,
        message,
      })

      sessionStorage.setItem("digioStatus", status)
      sessionStorage.setItem("digioKID", digioDocId)

      // Mark as processed immediately to prevent re-processing
      hasProcessedParams.current = true

      // Get the current step from the URL
      let currentStepFromUrl = pathname.split("/").pop() || ""
      // Remove .html extension if present
      if (currentStepFromUrl.endsWith(".html")) {
        currentStepFromUrl = currentStepFromUrl.replace(".html", "")
      }

      if (currentStepFromUrl && STEP_SEQUENCE.includes(currentStepFromUrl)) {
        // Find the previous step that was just completed (or cancelled)
        const previousStep = getPreviousStep(currentStepFromUrl)

        if (previousStep) {
          console.log(`Processing previous step ${previousStep} with status: ${status}`)

          // Determine the new status based on the Digio status
          let newStatus: StepStatus
          if (status === "success") {
            newStatus = "completed"
            toast({
              title: "Verification Successful",
              description: "Your information has been verified successfully.",
            })
          } else if (status === "cancel") {
            newStatus = "cancelled"
            toast({
              title: "Verification Cancelled",
              description: "KYC verification process was cancelled.",
              variant: "destructive",
            })
          } else {
            newStatus = "failed"
            toast({
              title: "Verification Failed",
              description: message || "There was an issue with your verification.",
              variant: "destructive",
            })
          }

          // Store the Digio document ID
          setDigioDocId(digioDocId)

          // Set navigation in progress flag
          navigationInProgress.current = true

          // Use setTimeout to avoid immediate redirect which could cause render loops
          setTimeout(() => {
            // Clean the URL by removing the query parameters first
            if (window.history && window.history.replaceState) {
              let cleanUrl = window.location.pathname
              // Keep session_id in URL if available and not signin step
              const currentSessionId = getSessionId()
              if (currentSessionId && currentStepFromUrl !== "signin") {
                cleanUrl += `?session_id=${currentSessionId}`
              }
              window.history.replaceState({}, document.title, cleanUrl)
            }

            // Then handle different status cases
            if (status === "success") {
              // If success, we're already on the next step, so just stay here
              // No need to navigate again as we're already on the correct page
              navigationInProgress.current = false
            } else if (status === "cancel" || status === "failure") {
              const allowStaySteps = ["personal-details"] // you can add more here

              if (allowStaySteps.includes(currentStepFromUrl)) {
                console.log(`Staying on step: ${currentStepFromUrl} due to ${status} status.`)
                // Just update the status but don't navigate away
                navigationInProgress.current = false
                return
              }

              let targetUrl = getCompatibleUrl(`/kyc/${previousStep}`)
              const currentSessionId = getSessionId()
              if (currentSessionId && previousStep !== "signin") {
                targetUrl += `?session_id=${currentSessionId}`
              }
              console.log(`Non-success status detected. Navigating back to: ${previousStep}, URL: ${targetUrl}`)
              router.replace(targetUrl)
            }
          }, 100)
        }
      }
    }
  }, [STEP_SEQUENCE, getPreviousStep, pathname, router, searchParams])

  // Update handleDigioReturn function to include session_id in navigation
  const handleDigioReturn = (step: string, status: "success" | "failure" | "cancel") => {
    // Update the step status based on the result
    let newStatus: StepStatus

    if (status === "success") {
      newStatus = "completed"
      toast({
        title: "Verification Successful",
        description: "Your information has been verified successfully.",
      })
    } else if (status === "cancel") {
      newStatus = "cancelled"
      toast({
        title: "Verification Cancelled",
        description: "KYC verification process was cancelled.",
        variant: "destructive",
      })
    } else {
      newStatus = "failed"
      toast({
        title: "Verification Failed",
        description: "There was an issue with your verification.",
        variant: "destructive",
      })
    }

    // Update the current step status
    updateStepStatus(step as keyof KYCState["steps"], newStatus)

    // If this step was successfully completed, check if we need to restore later steps
    if (status === "success") {
      const currentIndex = STEP_SEQUENCE.indexOf(step)

      // Check if there are any later steps that were previously completed
      if (currentIndex < STEP_SEQUENCE.length - 1 && state.previouslyCompletedSteps) {
        const updatedSteps = { ...state.steps }
        let hasRestoredSteps = false

        // Loop through all later steps
        for (let i = currentIndex + 1; i < STEP_SEQUENCE.length; i++) {
          const laterStep = STEP_SEQUENCE[i] as keyof KYCState["steps"]

          // If this step was previously completed and has form data, restore it
          if (state.previouslyCompletedSteps[laterStep] && localStorage.getItem(`kyc_${laterStep}_form`)) {
            updatedSteps[laterStep] = "completed"
            hasRestoredSteps = true
            console.log(`Restoring previously completed step: ${laterStep}`)
          } else {
            // Stop restoring once we hit a step that wasn't previously completed
            break
          }
        }

        // Update state if we restored any steps
        if (hasRestoredSteps) {
          setState((prev) => ({
            ...prev,
            steps: updatedSteps,
          }))

          toast({
            title: "Previous progress restored",
            description: "Your previously completed steps have been restored.",
            variant: "default",
          })
        }
      }
    }

    // Set navigation in progress flag
    navigationInProgress.current = true

    // Handle navigation based on status
    if (status === "success") {
      // If successful, navigate to the next step
      const nextStep = getNextStep(step)
      if (nextStep) {
        console.log(`Success status in handleDigioReturn. Navigating to next step: ${nextStep}`)
        // Use setTimeout to avoid immediate redirect which could cause render loops
        setTimeout(() => {
          let targetUrl = getCompatibleUrl(`/kyc/${nextStep}`)
          const currentSessionId = getSessionId()
          if (currentSessionId && nextStep !== "signin") {
            targetUrl += `?session_id=${currentSessionId}`
          }
          router.push(targetUrl)
          // The flag will be reset when the pathname changes
        }, 100)
      }
    } else {
      // If cancelled or failed, stay on the current step
      console.log(`Non-success status in handleDigioReturn. Staying on current step: ${step}`)
      setTimeout(() => {
        let targetUrl = getCompatibleUrl(`/kyc/${step}`)
        const currentSessionId = getSessionId()
        if (currentSessionId && step !== "signin") {
          targetUrl += `?session_id=${currentSessionId}`
        }
        router.push(targetUrl)
        // The flag will be reset when the pathname changes
      }, 100)
    }
  }

  // Replace the existing initialization useEffect with this updated version
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized && !hasValidatedAccess.current) {
      hasValidatedAccess.current = true // 🔒 prevent re-execution
      const currentPath = pathname.split("/").pop()?.replace(".html", "") || ""

      const hasAccess = validateCurrentStepAccess()

      setTimeout(() => {
        if (!hasAccess) {
          if (currentPath !== "signin") {
            console.log("Access denied, redirecting to signin")
            clearAllKYCData()
            setState(initialState)
            router.replace("/kyc/signin")
            setIsValidatingAccess(false)
            return
          }
        }
      }, 1000)

      const kycStateExists = localStorage.getItem("kyc_state")

      if (!kycStateExists && currentPath !== "signin") {
        console.log("localStorage cleared, redirecting to signin")
        clearAllKYCData()
        setState(initialState)
        router.replace("/kyc/signin")
        setIsValidatingAccess(false)
        return
      }

      if (currentPath === "signin" && !searchParams.get("session_id")) {
        clearSession()
        console.log("On signin page with no explicit session_id, cleared any existing session")
      }

      setTimeout(() => {
        setIsInitialized(true)
        setIsValidatingAccess(false)
        console.log("KYC Context initialized, checking for correct step...")
      }, 100)
    }
  }, [pathname, searchParams, router, isInitialized, validateCurrentStepAccess])

  // Redirect to correct step when initialized
  useEffect(() => {
    if (isInitialized && !hasRedirectedToCorrectStep.current) {
      redirectToCorrectStep()
    }
  }, [isInitialized, pathname, redirectToCorrectStep])

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirectedToCorrectStep.current = false
  }, [pathname])

  // Check for Digio redirect parameters on each page load
  useEffect(() => {
    // Only process params once per page load to prevent infinite loops
    if (!hasProcessedParams.current) {
      const status = searchParams.get("status")
      const digioDocId = searchParams.get("digio_doc_id")

      if (status && digioDocId) {
        handleDigioParams()
        hasProcessedParams.current = true
      }
    }
  }, [handleDigioParams, pathname, searchParams])

  // Reset the params processed flag when the path changes
  useEffect(() => {
    hasProcessedParams.current = false
    navigationInProgress.current = false
  }, [pathname])

  // Fix inconsistent state on initial load
  useEffect(() => {
    if (!hasFixedInconsistentState.current) {
      fixInconsistentState()
      hasFixedInconsistentState.current = true
    }
  }, [fixInconsistentState])

  // Track when a step is completed
  const trackCompletedStep = (step: string) => {
    setState((prev) => ({
      ...prev,
      previouslyCompletedSteps: {
        ...prev.previouslyCompletedSteps,
        [step]: true,
      },
    }))
  }

  const updateStepStatus = (step: keyof KYCState["steps"], status: StepStatus) => {
    setState((prev) => {
      // If we're marking a step as completed, track it
      if (status === "completed" && prev.steps[step] !== "completed") {
        const updatedPreviouslyCompletedSteps = {
          ...prev.previouslyCompletedSteps,
          [step]: true,
        }

        return {
          ...prev,
          steps: {
            ...prev.steps,
            [step]: status,
          },
          previouslyCompletedSteps: updatedPreviouslyCompletedSteps,
        }
      }

      return {
        ...prev,
        steps: {
          ...prev.steps,
          [step]: status,
        },
      }
    })
  }

  const setCurrentStep = (step: string) => {
    setState((prev) => {
      if (prev.currentStep !== step) {
        return { ...prev, currentStep: step }
      }
      return prev
    })
  }

  // Add KYC ID setter function
  const setKycId = (id: string) => {
    setState((prev) => ({ ...prev, kycId: id }))
    console.log(`KYC ID set: ${id}`)
  }

  // Add this function after the canAccessStep function to validate and fix step statuses
  const validateStepStatuses = useCallback(() => {
    if (hasValidatedSteps.current) return false
    hasValidatedSteps.current = true

    let needsUpdate = false
    const updatedSteps = { ...state.steps }

    // First pass: Check for completed steps with missing data
    for (let i = 0; i < STEP_SEQUENCE.length; i++) {
      const step = STEP_SEQUENCE[i] as keyof KYCState["steps"]
      const formKey = `kyc_${step}_form`

      // If a step is marked as completed but has no data, reset it
      if (updatedSteps[step] === "completed" && !localStorage.getItem(formKey)) {
        console.log(`Step ${step} is marked as completed but has no data. Resetting.`)
        updatedSteps[step] = "not_started"
        needsUpdate = true
      }
    }

    // Second pass: Only fix truly inconsistent states
    // We'll be more lenient with in_progress states if later steps are completed
    for (let i = 0; i < STEP_SEQUENCE.length - 1; i++) {
      const currentStep = STEP_SEQUENCE[i] as keyof KYCState["steps"]
      const nextStep = STEP_SEQUENCE[i + 1] as keyof KYCState["steps"]

      // Only reset next step if current step is failed/cancelled or not_started
      // We'll allow in_progress + completed combination
      if (
        (updatedSteps[currentStep] === "failed" ||
          updatedSteps[currentStep] === "cancelled" ||
          updatedSteps[currentStep] === "not_started") &&
        (updatedSteps[nextStep] === "completed" || updatedSteps[nextStep] === "in_progress")
      ) {
        console.log(
          `Inconsistent state: ${currentStep} is ${updatedSteps[currentStep]} but ${nextStep} is ${updatedSteps[nextStep]}. Resetting ${nextStep}.`,
        )
        updatedSteps[nextStep] = "not_started"
        needsUpdate = true
      }
    }

    // Update state if needed
    if (needsUpdate) {
      setState((prev) => ({
        ...prev,
        steps: updatedSteps,
      }))

      // Also update localStorage
      try {
        localStorage.setItem(
          "kyc_state",
          JSON.stringify({
            ...state,
            steps: updatedSteps,
          }),
        )
      } catch (error) {
        console.error("Error saving updated KYC state to localStorage:", error)
      }
    }

    return needsUpdate
  }, [STEP_SEQUENCE, state])

  // Validate step data on initialization
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      validateStepStatuses()
    }
  }, [isInitialized, validateStepStatuses])

  // Validate step data on initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if each "completed" step actually has data in localStorage
      const updatedSteps = { ...state.steps }
      let needsUpdate = false

      // Check signin step
      if (updatedSteps.signin === "completed") {
        const signinData = localStorage.getItem("kyc_signin_form")
        if (!signinData) {
          updatedSteps.signin = "not_started"
          needsUpdate = true
        }
      }

      // Check address step
      if (updatedSteps["personal-details"] === "completed") {
        const addressData = localStorage.getItem("kyc_personal-details_form")
        if (!addressData) {
          updatedSteps["personal-details"] = "not_started"
          needsUpdate = true
        }
      }

      // Check bank step
      if (updatedSteps.bank === "completed") {
        const bankData = localStorage.getItem("kyc_bank_form")
        if (!bankData) {
          updatedSteps.bank = "not_started"
          needsUpdate = true
        }
      }

      // Check exchange step
      if (updatedSteps.exchange === "completed") {
        const exchangeData = localStorage.getItem("kyc_exchange_form")
        if (!exchangeData) {
          updatedSteps.exchange = "not_started"
          needsUpdate = true
        }
      }

      // Check completion step
      if (updatedSteps.completion === "completed") {
        const completionData = localStorage.getItem("kyc_completion_form")
        if (!completionData) {
          updatedSteps.completion = "not_started"
          needsUpdate = true
        }
      }

      // Update state if needed
      if (needsUpdate) {
        setState((prev) => ({
          ...prev,
          steps: updatedSteps,
        }))
      }
    }
  }, [state.steps])

  // Add a function to track navigation direction in the KYC context
  const trackNavigation = (fromStep: string, toStep: string) => {
    if (typeof window !== "undefined") {
      // Store the navigation direction
      sessionStorage.setItem(
        "kyc_last_navigation",
        JSON.stringify({
          from: fromStep,
          to: toStep,
          timestamp: Date.now(),
        }),
      )

      // Store the current step as the referrer for the next navigation
      sessionStorage.setItem("kyc_referrer", fromStep)

      console.log(`Navigation tracked: ${fromStep} -> ${toStep}`)
    }
  }

  const getNextStep = (currentStep: string): string | null => {
    const currentIndex = STEP_SEQUENCE.indexOf(currentStep)

    if (currentIndex < STEP_SEQUENCE.length - 1) {
      return STEP_SEQUENCE[currentIndex + 1]
    }

    return null
  }

  // Modified navigateToStep function to include session_id in URL (except for signin)
  const navigateToStep = (step: string) => {
    // Track navigation direction
    trackNavigation(state.currentStep, step)

    // Prevent navigation if already in progress
    if (navigationInProgress.current) {
      console.log("Navigation already in progress, ignoring request to navigate to", step)
      return
    }

    // Fix any inconsistent state before navigation
    const stateWasFixed = fixInconsistentState()
    if (stateWasFixed) {
      console.log("State was fixed, delaying navigation slightly")
      setTimeout(() => {
        navigateToStep(step)
      }, 100)
      return
    }

    // If we're on the bank page and trying to navigate away, show confirmation first
    if (state.currentStep === "bank" && step !== "bank" && !state.steps.bank.includes("completed")) {
      // Only show confirmation if we're not already showing it
      if (!showBankConfirmation) {
        setShowBankConfirmation(true)
        setPendingNavigation(step)
        return
      }
    }

    // Validate that previous steps have data before navigating
    const targetIndex = STEP_SEQUENCE.indexOf(step)

    // Check if we're trying to navigate to a step beyond the first one
    if (targetIndex > 0) {
      // Verify all previous steps have data
      for (let i = 0; i < targetIndex; i++) {
        const prevStep = STEP_SEQUENCE[i] as keyof KYCState["steps"]
        const formKey = `kyc_${prevStep}_form`

        // If a previous step is marked as completed but has no data, reset it
        if (state.steps[prevStep] === "completed" && !localStorage.getItem(formKey)) {
          updateStepStatus(prevStep, "not_started")
          router.push(getCompatibleUrl(`/kyc/${prevStep}`))
          return
        }
      }
    }

    // Reset any pending navigation state
    if (showBankConfirmation) {
      setShowBankConfirmation(false)
    }
    if (pendingNavigation) {
      setPendingNavigation(null)
    }

    // Set navigation in progress flag
    navigationInProgress.current = true
    console.log(`Navigating to step: ${step}`)

    // Build URL with session_id if available (but not for signin step)
    let targetUrl = getCompatibleUrl(`/kyc/${step}`)
    const currentSessionId = getSessionId()
    if (currentSessionId && step !== "signin") {
      targetUrl += `?session_id=${currentSessionId}`
    }

    // Use a small delay to ensure all state updates are complete
    setTimeout(() => {
      router.push(targetUrl)
      navigationInProgress.current = false
      // The flag will be reset when the pathname changes
    }, 100)
  }

  const setDigioSessionId = (id: string) => {
    setState((prev) => ({ ...prev, digioSessionId: id }))
  }

  const setDigioDocId = (id: string) => {
    setState((prev) => ({ ...prev, digioDocId: id }))
  }

  return (
    <KYCContext.Provider
      value={{
        state,
        updateStepStatus,
        setCurrentStep,
        navigateToStep,
        navigateToPreviousStep, // Add the new back navigation function
        canAccessStep,
        setSessionId, // Add session ID setter to context
        setDigioSessionId,
        setDigioDocId,
        setKycId,
        handleDigioParams,
        getPreviousStep,
        getNextStep,
        handleDigioReturn,
        showBankConfirmation,
        setShowBankConfirmation,
        pendingNavigation,
        setPendingNavigation,
        validateStepStatuses,
        trackCompletedStep,
        fixInconsistentState,
        getSessionId, // Add session ID getter to context
        redirectToCorrectStep, // Add redirect function to context
        clearSession, // Add session clear function to context
        checkTokenValidity,
        clearAllKYCData,
        isLocalStorageCleared, // Add this new function
        isValidatingAccess, // Add this to the provider value
        // Add missing properties for context type
        isNavigating,
        navigationMessage,
        setNavigationLoading,
        handleStepCompletion,

        //kyc mode
        setKYCMode,
        isOfflineMode,
      }}
    >
      {children}

      {/* handling the tokenValidity of each API for KYC */}
      <AnimatePresence>
        {isTokenExpired && (
          <AlertDialog open={true} onOpenChange={() => { }}>
            <AlertDialogContent className="max-w-lg w-full text-center px-6 py-8 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800">
              <AlertDialogHeader className="space-y-3 ">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center"
                >
                  <div className="bg-red-100 dark:bg-red-900 p-4 rounded-full shadow-inner">
                    <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-300" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex flex-col items-center justify-center mx-auto">
                    <AlertDialogTitle className="text-3xl font-medium text-red-600 dark:text-red-300 mt-6">
                      Your KYC Session Has Expired
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-md text-zinc-700 dark:text-zinc-300 py-1">
                      <p className="text-center">For your security, your session has timed out.</p>
                      <p className="text-center">
                        You'll be redirected to the sign-in page in{" "}
                        <span className="text-red-600 dark:text-red-400 font-semibold">{redirectCountdown}</span>{" "}
                        seconds.
                      </p>
                    </AlertDialogDescription>
                  </div>
                </motion.div>
              </AlertDialogHeader>

              {/* Progress Bar Section */}
              {/* Animated Progress with percentage */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="w-full mt-4 space-y-2"
              >
                {/* Animated smooth progress bar using motion value */}
                <Progress value={progressPercent.get()} className="h-3 transition-none bg-zinc-200 dark:bg-zinc-800" />

                {/* Live % display */}
                <motion.p className="text-sm text-muted-foreground text-center">
                  Redirecting... <motion.span className="font-medium">{progressPercent}</motion.span>%
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25, delay: 0.4 }}
              >
                <Button
                  variant="destructive"
                  size="lg"
                  className="mt-6  font-medium tracking-wide rounded-md w-[50%]"
                  onClick={() => {
                    if (countdownRef.current) clearInterval(countdownRef.current)
                    setIsTokenExpired(false)
                    router.replace("/kyc/signin")
                  }}
                >
                  Redirect Now
                </Button>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
    </KYCContext.Provider>
  )
}

export function useKYC() {
  const context = useContext(KYCContext)
  if (context === undefined) {
    throw new Error("useKYC must be used within a KYCProvider")
  }
  return context
}
