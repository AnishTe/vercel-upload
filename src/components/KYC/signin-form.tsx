"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { Loader2, CheckCircle, AlertCircle, Shield, Mail, Phone, User, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

import { format } from "date-fns"

import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useKYC } from "@/contexts/kyc-context"
import { GenerateOtpKYC, panCheckKYC, SignInUpKYC, VerifyOtpKYC } from "@/lib/auth"
import { setLocalStorage } from "@/utils/localStorage"
import { DatePickerField } from "../Dashboard/UI_Components/datePicker"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  inputClassName?: string
  isVisible?: boolean
  onEnter?: () => void;
}

export function OtpInput({
  value = "",
  onChange,
  onEnter,
  length = 6,
  disabled = false,
  autoFocus = false,
  className,
  inputClassName,
  isVisible = true,
}: OtpInputProps) {
  const [activeInput, setActiveInput] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  useEffect(() => {
    if (autoFocus && isVisible && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, isVisible])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value.replace(/\D/g, "")
    if (!newValue) return

    const singleChar = newValue.slice(-1)
    const otpArray = value.split("")
    otpArray[index] = singleChar
    const newOtp = otpArray.join("")

    onChange(newOtp)

    if (index < length - 1 && singleChar) {
      setActiveInput(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" && onEnter) {
      e.preventDefault()
      onEnter()
      return
    }

    if (e.key === "Backspace") {
      e.preventDefault()

      if (value[index]) {
        const otpArray = value.split("")
        otpArray[index] = ""
        onChange(otpArray.join(""))
        return
      }

      if (index > 0) {
        setActiveInput(index - 1)
        inputRefs.current[index - 1]?.focus()

        const otpArray = value.split("")
        otpArray[index - 1] = ""
        onChange(otpArray.join(""))
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      setActiveInput(index - 1)
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      setActiveInput(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim().replace(/\D/g, "").slice(0, length)

    if (!pastedData) return

    const otpArray = Array(length).fill("")
    for (let i = 0; i < pastedData.length; i++) {
      otpArray[i] = pastedData[i]
    }

    onChange(otpArray.join(""))

    const focusIndex = Math.min(pastedData.length, length - 1)
    setActiveInput(focusIndex)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleFocus = (index: number) => {
    setActiveInput(index)
  }

  if (!isVisible) return null

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array(length)
        .fill("")
        .map((_, index) => {
          const char = value[index] || ""

          return (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              disabled={disabled}
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold p-0 border-2 transition-all duration-200",
                char
                  ? "border-green-500 bg-green-50"
                  : activeInput === index
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed",
                inputClassName,
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
          )
        })}
    </div>
  )
}

interface CountdownTimerProps {
  isActive: boolean
  initialSeconds: number
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ isActive, initialSeconds, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start countdown when isActive becomes true
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setTimeLeft(initialSeconds)
    }
  }, [isActive, initialSeconds, timeLeft])

  // Handle countdown logic
  useEffect(() => {
    if (timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeLeft, onComplete])

  // Reset when not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive])

  const percentage = initialSeconds > 0 ? Math.round((timeLeft / initialSeconds) * 100) : 0

  if (timeLeft <= 0) return null

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">Resend OTP in</div>
      <div className="relative">
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 font-bold px-3 py-1 rounded-full min-w-[3rem] text-center border border-blue-200 text-sm">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
        <div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Enhanced form schemas
const signInFormSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: "Please enter a valid PAN number (e.g., ABCDE1234F).",
  }),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, {
      message: "Please enter a valid 10-digit mobile number starting with 6-9.",
    }),
  otp: z.string().length(6, {
    message: "OTP must be 6 digits.",
  }),
})

const signUpFormSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: "Please enter a valid PAN number (e.g., ABCDE1234F).",
  }),
  clientName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Name must not exceed 50 characters.",
    }),
  dateOfBirth: z
    .date({
      required_error: "Date of birth is required.",
    }),

  mobileNumber: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, {
      message: "Please enter a valid 10-digit mobile number starting with 6-9.",
    }),
  mobileOtp: z.string().length(6, {
    message: "OTP must be 6 digits.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  emailOtp: z.string().length(6, {
    message: "OTP must be 6 digits.",
  }),
})

type SignInFormValues = z.infer<typeof signInFormSchema>
type SignUpFormValues = z.infer<typeof signUpFormSchema>

export default function EnhancedSignInForm() {
  // State management
  const [activeTab, setActiveTab] = useState<string>("signin")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileVerified, setMobileVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [panAndDobValid, setPanAndDobValid] = useState(false)
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false)
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false)
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false)
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false)
  const [formInitialized, setFormInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [panName, setPanName] = useState<string | null>(null)
  // Progress tracking
  const [signUpProgress, setSignUpProgress] = useState(0)

  // Add this new state variable after the other state declarations
  const [isAutoTransition, setIsAutoTransition] = useState(false)

  // Updated OTP countdown state - now using boolean flags for active state
  const [mobileOtpCountdownActive, setMobileOtpCountdownActive] = useState(false)
  const [emailOtpCountdownActive, setEmailOtpCountdownActive] = useState(false)

  const { toast } = useToast()

  const { updateStepStatus, navigateToStep, setSessionId } = useKYC()

  // Form default values
  const [signInDefaultValues, setSignInDefaultValues] = useState<Partial<SignInFormValues>>({
    panNumber: "",
    mobileNumber: "",
    otp: "",
  })

  const [signUpDefaultValues, setSignUpDefaultValues] = useState<Partial<SignUpFormValues>>({
    panNumber: "",
    clientName: "",
    mobileNumber: "",
    mobileOtp: "",
    email: "",
    emailOtp: "",
  })

  // Initialize forms
  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: signInDefaultValues,
    mode: "onChange",
  })

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: signUpDefaultValues,
    mode: "onChange",
  })

  // Updated countdown completion handlers
  const handleMobileOtpCountdownComplete = useCallback(() => {
    setMobileOtpCountdownActive(false)
  }, [])

  const handleEmailOtpCountdownComplete = useCallback(() => {
    setEmailOtpCountdownActive(false)
  }, [])

  useEffect(() => {
    const subscription = signUpForm.watch((values) => {
      const panNumber = values.panNumber as string
      const clientName = values.clientName as string
      const dateOfBirth = values.dateOfBirth as Date | undefined

      let progress = 0
      if (panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) progress += 20
      if (clientName && clientName.length >= 2) progress += 20
      if (dateOfBirth) progress += 20
      if (mobileVerified) progress += 20
      if (emailVerified) progress += 20

      setSignUpProgress(progress)
    })

    return () => subscription.unsubscribe()
  }, [signUpForm, mobileVerified, emailVerified])

  const panNumber = useWatch({ control: signUpForm.control, name: "panNumber" });
  const clientName = useWatch({ control: signUpForm.control, name: "clientName" });
  const dateOfBirth = useWatch({ control: signUpForm.control, name: "dateOfBirth" });
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (
      !panNumber ||
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) ||
      !clientName ||
      !dateOfBirth
    ) {
      return; // Don't proceed unless all fields are filled correctly
    }
    if (
      panNumber &&
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) &&
      clientName &&
      dateOfBirth
    ) {
      // Clear previous timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(async () => {
        try {
          const panCheckResponse = await panCheckKYC({
            dob: format(dateOfBirth, "dd/MM/yyyy"),
            name: clientName,
            pan: panNumber,
          });

          const panResData = panCheckResponse.data.data.data;

          if (
            panCheckResponse.status === 200 &&
            panResData.status === "valid" &&
            panResData.aadhaar_seeding_status === "y" &&
            panResData.date_of_birth_match &&
            panResData.name_as_per_pan_match
          ) {
            setPanAndDobValid(true);
            setPanName(panResData.name);
            setSuccessMessage("PAN and Date of Birth are valid");
            setErrorMessage(null); // 🔴 Clear previous error
            signUpForm.clearErrors("panNumber");
            signUpForm.clearErrors("dateOfBirth");
          } else {
            setPanAndDobValid(false);
            setErrorMessage("Failed to PAN Check. Please try again.");
            setSuccessMessage(null); // 🟢 Clear previous success
          }
        } catch (error) {
          console.error("Error in pan-check:", error);
          setErrorMessage("Failed to PAN Check. Please try again.");
          setSuccessMessage(null);
          toast({
            variant: "destructive",
            title: "PAN Check Failed",
          });
        }
      }, 800); // ⏱️ 500ms debounce
    }

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [panNumber, clientName, dateOfBirth, signUpForm, toast]);

  // Load saved form data on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && !formInitialized) {
      try {
        const savedValues = localStorage.getItem("kyc_signin_form")
        if (savedValues) {
          const parsed = JSON.parse(savedValues)
          if (parsed.dateOfBirth) {
            parsed.dateOfBirth = new Date(parsed.dateOfBirth)
            setSignUpDefaultValues((prev) => ({ ...prev, dateOfBirth: parsed.dateOfBirth }))
          }
          if (parsed.panNumber) {
            setSignUpDefaultValues((prev) => ({ ...prev, panNumber: parsed.panNumber }))
          }
          if (parsed.mobileNumber) {
            setSignInDefaultValues((prev) => ({ ...prev, mobileNumber: parsed.mobileNumber }))
            setSignUpDefaultValues((prev) => ({ ...prev, mobileNumber: parsed.mobileNumber }))
          }
          if (parsed.email) {
            setSignUpDefaultValues((prev) => ({ ...prev, email: parsed.email }))
          }
        }
        setFormInitialized(true)
      } catch (error) {
        console.error("Error loading saved form data:", error)
        setFormInitialized(true)
      }
    }
  }, [formInitialized])

  // Reset forms with loaded values
  useEffect(() => {
    if (formInitialized) {
      signInForm.reset(signInDefaultValues as SignInFormValues)
      signUpForm.reset(signUpDefaultValues as SignUpFormValues)
    }
  }, [formInitialized, signInForm, signUpForm, signInDefaultValues, signUpDefaultValues])

  // Replace the existing useEffect that clears messages when tab changes
  useEffect(() => {
    // Skip clearing state if this is an automatic transition
    if (isAutoTransition) {
      console.log("Auto transition detected, skipping state clear")
      return
    }

    console.log("Manual tab switch, clearing states")
    // Only clear these specific states when manually switching tabs
    setErrorMessage(null)
    setSuccessMessage(null)
    setMobileVerified(false)
    setEmailVerified(false)
    setPanAndDobValid(false)
    // Stop countdowns but don't reset the active flags immediately
    setMobileOtpCountdownActive(false)
    setEmailOtpCountdownActive(false)
    setPanName(null)
  }, [activeTab, isAutoTransition])

  // Add a separate useEffect to reset the isAutoTransition flag
  useEffect(() => {
    if (isAutoTransition) {
      // Reset the flag after a short delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        setIsAutoTransition(false)
        console.log("Auto transition flag reset")
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isAutoTransition])

  // Replace the existing panAndDobValid useEffect with:
  useEffect(() => {
    const subscription = signUpForm.watch((value, { name, type }) => {
      const panNumber = value.panNumber as string
      const dateOfBirth = value.dateOfBirth as Date | undefined

      // if (panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) && dateOfBirth && dateOfBirth instanceof Date) {
      //   const today = new Date()
      //   const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

      //   if (dateOfBirth <= eighteenYearsAgo) {
      //     setPanAndDobValid(true)
      //   } else {
      //     setPanAndDobValid(false)
      //   }
      // } else {
      //   setPanAndDobValid(false)
      // }

      // Clear error messages when fields are valid
      if (name === "panNumber" && panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        signUpForm.clearErrors("panNumber")
      }
      if (name === "mobileNumber" && value.mobileNumber && /^[6-9]\d{9}$/.test(value.mobileNumber as string)) {
        signUpForm.clearErrors("mobileNumber")
      }
      if (name === "email" && value.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email as string)) {
        signUpForm.clearErrors("email")
      }

      // Clear OTP errors when values change
      if (name === "mobileOtp" && value.mobileOtp && value.mobileOtp.length === 6) {
        signUpForm.clearErrors("mobileOtp")
      }
      if (name === "emailOtp" && value.emailOtp && value.emailOtp.length === 6) {
        signUpForm.clearErrors("emailOtp")
      }
    })

    return () => subscription.unsubscribe()
  }, [signUpForm])

  // Replace the existing sign-in form watch useEffect with:
  useEffect(() => {
    const subscription = signInForm.watch((value, { name, type }) => {
      const panNumber = value.panNumber as string
      const mobileNumber = value.mobileNumber as string

      console.log("Sign-in form values:", {
        panNumber,
        panValid: panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber),
        mobileNumber,
        mobileValid: mobileNumber && /^[6-9]\d{9}$/.test(mobileNumber),
        mobileLength: mobileNumber?.length,
      })

      if (name === "mobileNumber" && value.mobileNumber && /^[6-9]\d{9}$/.test(value.mobileNumber as string)) {
        signInForm.clearErrors("mobileNumber")
      }
    })

    return () => subscription.unsubscribe()
  }, [signInForm, panName])

  // API handlers with corrected OTP_Type
  const handleSendMobileOtp = async () => {
    console.log("🚀 handleSendMobileOtp called")
    const panNumber = signInForm.getValues("panNumber")
    const mobileNumber = signInForm.getValues("mobileNumber")
    console.log("Values:", { panNumber, mobileNumber })
    setErrorMessage(null)

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      signInForm.setError("panNumber", {
        type: "manual",
        message: "Please enter a valid PAN number.",
      })
      return
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      signInForm.setError("mobileNumber", {
        type: "manual",
        message: "Please enter a valid 10-digit mobile number.",
      })
      return
    }

    setSendingMobileOtp(true)

    try {
      const response = await GenerateOtpKYC({
        LoginType: "SignIn",
        pan: panNumber,
        OTP_Type: "mobile",
        OTP_Validator: mobileNumber,
        BranchCode: "500"
      })
      console.log(response)

      if (response.status === 200) {
        const responseData = response.data
        if (responseData.status === "success") {
          localStorage.setItem("otp_inserted_id", responseData.id.toString())
          localStorage.setItem("otp_pan", panNumber)
          signInForm.setValue("otp", "")
          setSuccessMessage(`OTP has been sent to your registered mobile number`)
          // Start countdown only after successful OTP send
          setMobileOtpCountdownActive(true)
        } else {
          setErrorMessage(responseData.message || "Failed to send OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      setErrorMessage("Failed to send OTP. Please try again.")
    } finally {
      setSendingMobileOtp(false)
    }
  }

  const handleVerifyMobileOtp = async () => {
    const panNumber = signInForm.getValues("panNumber")
    const otp = signInForm.getValues("otp")
    setErrorMessage(null)

    if (!/^\d{6}$/.test(otp)) {
      signInForm.setError("otp", {
        type: "manual",
        message: "Please enter a valid 6-digit OTP.",
      })
      return
    }

    setVerifyingMobileOtp(true)

    try {
      const insertedId = localStorage.getItem("otp_inserted_id")
      const storedPan = localStorage.getItem("otp_pan") || panNumber

      if (!insertedId) {
        throw new Error("OTP session expired. Please request a new OTP.")
      }

      const response = await VerifyOtpKYC({
        id: Number.parseInt(insertedId),
        pan: storedPan,
        OTP_Type: "SignIn",
        OTP: otp,
      })

      if (response.status === 200) {
        const responseData = response.data
        if (responseData.status === "verify") {
          setMobileVerified(true)
          setSuccessMessage("Mobile number verified successfully")
          // localStorage.removeItem("otp_inserted_id")
          localStorage.removeItem("otp_pan")
          localStorage.setItem("kyc_pan", storedPan)
          signInForm.clearErrors("otp")
          // Stop countdown on successful verification
          setMobileOtpCountdownActive(false)
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null)
          }, 3000)
        } else {
          signInForm.setError("otp", {
            type: "manual",
            message: "Invalid OTP. Please try again.",
          })
          setErrorMessage(responseData.message || "Invalid OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to verify OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setErrorMessage(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Failed to verify OTP. Please try again.",
      )
    } finally {
      setVerifyingMobileOtp(false)
    }
  }

  // Sign Up Mobile Send OTP
  const handleSendSignUpMobileOtp = async () => {
    console.log("🚀 handleSendSignUpMobileOtp called")
    console.log("panAndDobValid:", panAndDobValid)
    const panNumber = signUpForm.getValues("panNumber")
    const mobileNumber = signUpForm.getValues("mobileNumber")
    const clientName = signUpForm.getValues("clientName") || ""
    const dateOfBirth = signUpForm.getValues("dateOfBirth")

    const dob = dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : ""
    setErrorMessage(null)

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      signUpForm.setError("mobileNumber", {
        type: "manual",
        message: "Please enter a valid 10-digit mobile number.",
      })
      return
    }

    setSendingMobileOtp(true)

    try {
      const response = await GenerateOtpKYC({
        LoginType: "SignUp",
        dob: dob,
        ClientName: clientName,
        pan: panNumber,
        OTP_Type: "mobile",
        OTP_Validator: mobileNumber,
        BranchCode: "500"
      })
      console.log(response)

      if (response.status === 200) {
        const responseData = response.data
        console.log(responseData)
        if (responseData.status === "success") {
          localStorage.setItem("signup_mobile_otp_id", responseData.id.toString())
          signUpForm.setValue("mobileOtp", "")
          setSuccessMessage(`OTP has been sent to your registered mobile number`)
          // Start countdown only after successful OTP send
          setMobileOtpCountdownActive(true)
        } else if (
          responseData.status === "already_acc" &&
          responseData.message &&
          responseData.message.includes("already")
        ) {
          console.log("User already exists, transferring to sign-in")

          // 1. Set auto transition flag FIRST
          setIsAutoTransition(true)

          // 2. Transfer the OTP session
          const signupOtpId = responseData.id
            ? responseData.id.toString()
            : localStorage.getItem("signup_mobile_otp_id")
          if (signupOtpId) {
            localStorage.setItem("otp_inserted_id", signupOtpId)
            localStorage.setItem("otp_pan", panNumber)
            localStorage.removeItem("signup_mobile_otp_id")
          }

          // 3. Prepare sign-in form data with actual values
          const newSignInValues = {
            panNumber: panNumber,
            mobileNumber: signUpForm.getValues("mobileNumber"),
            otp: "",
          }

          console.log("Transferring data:", newSignInValues)

          // 4. Update default values immediately
          setSignInDefaultValues(newSignInValues)

          // 5. Set states that should persist during transition
          setMobileOtpCountdownActive(true) // Keep countdown active
          setSuccessMessage("!!  OTP has been sent to your registered mobile number. Please enter it to sign in.")
          setErrorMessage(null)

          // 6. Switch tab and reset form with proper data
          setTimeout(() => {
            setActiveTab("signin")
            // Reset form immediately with the new values
            signInForm.reset(newSignInValues)
            console.log("Form reset immediately with:", newSignInValues)

            // Force another reset after a short delay to ensure it sticks
            setTimeout(() => {
              signInForm.reset(newSignInValues)
              console.log("Form reset after tab switch:", signInForm.getValues())
            }, 100)
          }, 100)
        } else {
          setErrorMessage(responseData.message || "Failed to send OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      setErrorMessage("Failed to send OTP. Please try again.")
    } finally {
      setSendingMobileOtp(false)
    }
  }

  //Sign Up Mobile Verify
  const handleVerifySignUpMobileOtp = async () => {
    const panNumber = signUpForm.getValues("panNumber")
    const otp = signUpForm.getValues("mobileOtp")
    setErrorMessage(null)

    if (!/^\d{6}$/.test(otp)) {
      signUpForm.setError("mobileOtp", {
        type: "manual",
        message: "Please enter a valid 6-digit OTP.",
      })
      return
    }

    setVerifyingMobileOtp(true)

    try {
      const insertedId = localStorage.getItem("signup_mobile_otp_id")

      if (!insertedId) {
        throw new Error("OTP session expired. Please request a new OTP.")
      }

      const response = await VerifyOtpKYC({
        id: Number.parseInt(insertedId),
        pan: panNumber,
        OTP_Type: "mobile",
        OTP: otp,
      })

      if (response.status === 200) {
        const responseData = response.data
        console.log(responseData)
        if (responseData.status === "verify") {
          setMobileVerified(true)
          setSuccessMessage("Mobile number verified successfully. Please verify your email.")
          localStorage.removeItem("signup_mobile_otp_id")
          signUpForm.clearErrors("mobileOtp")
          // Stop countdown on successful verification
          setMobileOtpCountdownActive(false)
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null)
          }, 3000)
        } else {
          signUpForm.setError("mobileOtp", {
            type: "manual",
            message: "Invalid OTP. Please try again.",
          })
          setErrorMessage(responseData.message || "Invalid OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to verify OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setErrorMessage(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Failed to verify OTP. Please try again.",
      )
    } finally {
      setVerifyingMobileOtp(false)
    }
  }

  const handleSendEmailOtp = async () => {
    const panNumber = signUpForm.getValues("panNumber")
    const email = signUpForm.getValues("email")
    const clientName = signUpForm.getValues("clientName") || ""
    const dateOfBirth = signUpForm.getValues("dateOfBirth")

    const dob = dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : ""
    setErrorMessage(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      signUpForm.setError("email", {
        type: "manual",
        message: "Please enter a valid email address.",
      })
      return
    }

    setSendingEmailOtp(true)

    try {
      const response = await GenerateOtpKYC({
        LoginType: "SignUp",
        dob: dob,
        ClientName: clientName,
        pan: panNumber,
        OTP_Type: "email",
        OTP_Validator: email,
        BranchCode: "500"
      })
      console.log(response)

      if (response.status === 200) {
        const responseData = response.data
        if (responseData.status === "success") {
          localStorage.setItem("signup_email_otp_id", responseData.id.toString())
          signUpForm.setValue("emailOtp", "")
          setSuccessMessage(`OTP has been sent to your registered email address`)
          // Start countdown only after successful OTP send
          setEmailOtpCountdownActive(true)
        } else {
          setErrorMessage(responseData.message || "Failed to send OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      setErrorMessage("Failed to send OTP. Please try again.")
    } finally {
      setSendingEmailOtp(false)
    }
  }

  const handleVerifyEmailOtp = async () => {
    const panNumber = signUpForm.getValues("panNumber")
    const otp = signUpForm.getValues("emailOtp")
    setErrorMessage(null)

    if (!/^\d{6}$/.test(otp)) {
      signUpForm.setError("emailOtp", {
        type: "manual",
        message: "Please enter a valid 6-digit OTP.",
      })
      return
    }

    setVerifyingEmailOtp(true)

    try {
      const insertedId = localStorage.getItem("signup_email_otp_id")

      if (!insertedId) {
        throw new Error("OTP session expired. Please request a new OTP.")
      }

      const response = await VerifyOtpKYC({
        id: Number.parseInt(insertedId),
        pan: panNumber,
        OTP_Type: "email",
        OTP: otp,
      })

      if (response.status === 200) {
        const responseData = response.data
        if (responseData.status === "verify") {
          setEmailVerified(true)
          setSuccessMessage("Email verified successfully. You can now create your account.")
          // localStorage.removeItem("signup_email_otp_id")
          signUpForm.clearErrors("emailOtp")
          // Stop countdown on successful verification
          setEmailOtpCountdownActive(false)
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null)
          }, 3000)
        } else {
          signUpForm.setError("emailOtp", {
            type: "manual",
            message: "Invalid OTP. Please try again.",
          })
          setErrorMessage(responseData.message || "Failed to verify email OTP. Please try again.")
        }
      } else {
        setErrorMessage("Failed to verify OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error)
      setErrorMessage(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Failed to verify OTP. Please try again.",
      )
    } finally {
      setVerifyingEmailOtp(false)
    }
  }

  const onSignUpSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true)
    // updateStepStatus("signin", "in_progress")

    const insertedId = localStorage.getItem("signup_email_otp_id")
    if (!insertedId) {
      throw new Error("OTP session expired. Please request a new OTP.")
    }

    try {
      // First call SignInUpKYC API
      const signUpResponse = await SignInUpKYC({
        LoginType: "SignUp",
        ID: Number.parseInt(insertedId),
        pan: values.panNumber,
        mobile: values.mobileNumber,
        email: values.email,
        dob: format(values.dateOfBirth, "yyyy-MM-dd"),
        ClientName: values.clientName,
      })

      if (signUpResponse.status !== 200 || signUpResponse.data.status !== "success") {
        throw new Error("Sign up failed")
      }

      // Extract session_id from response
      const sessionId = signUpResponse.data.session_id || signUpResponse.data.sessionId
      const tradingId = signUpResponse.data.TradingId
      const customerId = signUpResponse.data.CustomerId
      const docs_fetched = signUpResponse.data.docs_fetched
      const selfie_fetched = signUpResponse.data.selfie_fetched
      const client_id = signUpResponse.data.client_id

      if (sessionId && tradingId) {
        console.log("Session ID received from SignUp:", sessionId)
        setSessionId(sessionId)
        sessionStorage.setItem("docs_fetched", docs_fetched)
        sessionStorage.setItem("selfie_fetched", selfie_fetched)
        sessionStorage.setItem("TradingId", tradingId)
        sessionStorage.setItem("CustomerId", customerId)
        sessionStorage.setItem("client_id", client_id)
        sessionStorage.setItem("currentPAN", signUpResponse.data.pan)
        sessionStorage.setItem("currentMobile", signUpResponse.data.mobile)
        sessionStorage.setItem("currentEmail", signUpResponse.data.email)
        sessionStorage.setItem("currentDOB", signUpResponse.data.dob)
        sessionStorage.setItem("currentName", signUpResponse.data.client_name)
        setLocalStorage(`kyc_pan`, values.panNumber)
        setLocalStorage(`userToken_${values.panNumber}`, sessionId)
      }

      // Save form data with session_id
      const formDataToSave = {
        ...values,
        session_id: sessionId,
      }
      localStorage.setItem("kyc_signin_form", JSON.stringify(formDataToSave))
      await new Promise((resolve) => setTimeout(resolve, 1500))
      updateStepStatus("signin", "completed")
      navigateToStep("personal-details")

      // const response = await generateKIDKYC({
      //   customer_identifier: values.mobileNumber,
      //   template_name: "FETCH_DOCS",
      //   pan: values.panNumber,
      //   notify_customer: true,
      // })

      // console.log(response)

      // if (response.status !== 200) {
      //   throw new Error("Failed to generate KID")
      // }

      // const responseData = response.data.data
      // console.log(responseData)

      // if (responseData && responseData.data && responseData.status === "success") {
      //   // Save form data with session_id
      //   const kidData = responseData.data
      //   const kid = kidData.id
      //   const accessToken = kidData.access_token
      //   const customerIdentifier = kidData.customer_identifier

      //   console.log("Generated KID:", kid)
      //   console.log("Access Token:", accessToken)

      //   // Store KID in context
      //   setKycId(kid)

      //   // Call Digio with the generated values
      //   if (digioInstanceRef.current) {
      //     try {
      //       updateStepStatus("signin", "completed")
      //       digioInstanceRef.current.init()
      //       digioInstanceRef.current.submit(kid, customerIdentifier, accessToken)
      //     } catch (error) {
      //       console.error("Error calling Digio sign:", error)
      //       updateStepStatus("signin", "failed")
      //       setIsSubmitting(false)
      //       toast({
      //         title: "Error",
      //         description: "Failed to initialize verification process. Please try again.",
      //         variant: "destructive",
      //       })
      //     }
      //   } else {
      //     throw new Error("Digio instance not initialized")
      //   }
      // } else {
      //   throw new Error("Invalid response format from KID generation API")
      // }
    } catch (error) {
      console.error("Error in sign-up process:", error)
      updateStepStatus("signin", "failed")
      toast({
        title: "Error signing up",
        description: "There was an error verifying your information. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const onSignInSubmit = async (values: SignInFormValues) => {
    setIsSubmitting(true)

    const insertedId = localStorage.getItem("otp_inserted_id")
    if (!insertedId) {
      throw new Error("OTP session expired. Please request a new OTP.")
    }

    try {
      // Call SignInUpKYC API for sign in
      const signInResponse = await SignInUpKYC({
        LoginType: "SignIn",
        ID: Number.parseInt(insertedId),
        pan: values.panNumber,
        mobile: values.mobileNumber,
      })

      if (signInResponse.status === 200 && signInResponse.data.status === "success") {
        // Extract session_id from response
        const sessionId = signInResponse.data.session_id || signInResponse.data.sessionId
        const tradingId = signInResponse.data.TradingId
        const docs_fetched = signInResponse.data.docs_fetched
        const selfie_fetched = signInResponse.data.selfie_fetched
        const customerId = signInResponse.data.CustomerId
        const client_id = signInResponse.data.client_id
        if (sessionId && tradingId) {
          console.log("Session ID received from SignIn:", sessionId)
          setSessionId(sessionId)
          sessionStorage.setItem("docs_fetched", docs_fetched)
          sessionStorage.setItem("selfie_fetched", selfie_fetched)
          sessionStorage.setItem("TradingId", tradingId)
          sessionStorage.setItem("CustomerId", customerId)
          sessionStorage.setItem("client_id", client_id)
          sessionStorage.setItem("currentPAN", signInResponse.data.pan)
          sessionStorage.setItem("currentMobile", signInResponse.data.mobile)
          sessionStorage.setItem("currentEmail", signInResponse.data.email)
          sessionStorage.setItem("currentDOB", signInResponse.data.dob)
          sessionStorage.setItem("currentName", signInResponse.data.client_name)
          setLocalStorage(`kyc_pan`, values.panNumber)
          setLocalStorage(`userToken_${values.panNumber}`, sessionId)
        }

        setSuccessMessage("Sign In successful!")
        toast({
          title: "Sign In Successful",
          description: "You have Successfully Signed In.",
        })

        // Save form data with session_id
        const formDataToSave = {
          ...values,
          session_id: sessionId,
        }
        localStorage.setItem("kyc_signin_form", JSON.stringify(formDataToSave))

        // Navigate to next step or update status as needed
        updateStepStatus("signin", "completed")
        navigateToStep("personal-details")
      } else {
        throw new Error(signInResponse.data.message || "Sign in failed")
      }
    } catch (error) {
      console.error("Error in sign-in process:", error)
      setErrorMessage("Failed to sign in. Please try again.")
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "There was an error signing in. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4 ">

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Secure Authentication</h1>
          </div>
          <p className="text-gray-600 text-sm max-w-lg mx-auto">
            Complete your KYC verification with our secure multi-step authentication process
          </p>
        </div>

        {/* Tab Structure */}
        <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white rounded-xl p-0.5 h-auto shadow-sm border ">
            <TabsTrigger
              value="signin"
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-sm",
                activeTab === "signin"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <User className={cn("w-4 h-4", activeTab === "signin" ? "text-white" : "text-gray-600")} />
              <span className={activeTab === "signin" ? "text-white" : "text-gray-600"}>Sign In</span>
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-sm",
                activeTab === "signup"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <CreditCard className={cn("w-4 h-4", activeTab === "signup" ? "text-white" : "text-gray-600")} />
              <span className={activeTab === "signup" ? "text-white" : "text-gray-600"}>Sign Up</span>
            </TabsTrigger>
          </TabsList>

          {/* Status Messages */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 sticky top-0 z-10 shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-sm">Error</AlertTitle>
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 sticky top-0 z-10 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="font-semibold text-green-800 text-sm">Success</AlertTitle>
              <AlertDescription className="text-xs text-green-700">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Sign In Form */}
          <TabsContent value="signin">
            <div className="border-0 shadow-none sm:shadow-xl sm:bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="text-center p-4 pb-2">
                <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-600 text-sm">as if you have already started your application, Please fill in the details complete it..</p>
              </div>
              <div className="p-4 space-y-6">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-6">
                    {/* PAN Verification Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                          1
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">PAN Verification</h3>
                      </div>

                      <FormField
                        control={signInForm.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              PAN Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., ABCDE1234F"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase().trim()
                                  field.onChange(value)
                                  if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                                    signInForm.clearErrors("panNumber")
                                  }
                                }}
                                className="uppercase h-10 border-2 focus:border-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your Permanent Account Number as per income tax records
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Mobile Verification Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                          2
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Mobile Verification</h3>
                      </div>

                      <FormField
                        control={signInForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Mobile Number
                            </FormLabel>
                            <FormControl>
                              <div className="relative flex">
                                <div className="flex items-center justify-center px-3 border-2 border-r-0 rounded-l-lg bg-gray-50 text-gray-700 font-medium text-sm">
                                  +91
                                </div>
                                <Input
                                  placeholder="Enter 10 digit mobile number"
                                  {...field}
                                  maxLength={10}
                                  className={cn(
                                    "rounded-l-none h-10 border-2 focus:border-blue-500 transition-colors",
                                    mobileVerified && "border-green-500 bg-green-50",
                                  )}
                                  disabled={mobileVerified}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                                    field.onChange(value)
                                    if (value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
                                      signInForm.clearErrors("mobileNumber")
                                    }
                                  }}
                                />
                                {mobileVerified && (
                                  <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                                )}
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your active mobile number for verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={mobileVerified ? "outline" : "default"}
                          className={cn(
                            "transition-all rounded-full px-4 h-9 font-medium text-sm",
                            mobileVerified
                              ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                              : mobileOtpCountdownActive
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg",
                          )}
                          onClick={handleSendMobileOtp}
                          disabled={
                            sendingMobileOtp ||
                            mobileVerified ||
                            mobileOtpCountdownActive ||
                            !signInForm.getValues("panNumber") ||
                            !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(signInForm.getValues("panNumber")) ||
                            !signInForm.getValues("mobileNumber") ||
                            signInForm.getValues("mobileNumber").length !== 10
                          }
                        >
                          {sendingMobileOtp ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Sending...
                            </>
                          ) : mobileVerified ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Phone className="h-4 w-4 mr-1" />
                              Send OTP
                            </>
                          )}
                        </Button>
                      </div>

                      {/* OTP Countdown Timer */}
                      {mobileOtpCountdownActive && !mobileVerified && (
                        <CountdownTimer
                          isActive={mobileOtpCountdownActive}
                          initialSeconds={60}
                          className="mt-2"
                          onComplete={handleMobileOtpCountdownComplete}
                        />
                      )}

                      {/* OTP Field - Show if countdown is active OR mobile is verified OR we have stored OTP session */}
                      {(mobileOtpCountdownActive || mobileVerified) && !mobileVerified && (
                        <div className="mt-6 space-y-4">
                          <FormField
                            control={signInForm.control}
                            name="otp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 text-center block">
                                  Enter Mobile OTP
                                </FormLabel>
                                <FormControl>
                                  <OtpInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={mobileVerified}
                                    autoFocus
                                    onEnter={handleVerifyMobileOtp}
                                    className="justify-center"
                                  />
                                </FormControl>
                                <FormDescription className="text-center text-xs text-gray-500">
                                  Enter the 6-digit OTP sent to your mobile number
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant={mobileVerified ? "outline" : "default"}
                              className={cn(
                                "transition-all rounded-full px-6 h-9 font-medium text-sm",
                                mobileVerified
                                  ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg",
                              )}
                              onClick={handleVerifyMobileOtp}
                              disabled={
                                verifyingMobileOtp ||
                                mobileVerified ||
                                !signInForm.getValues("otp") ||
                                signInForm.getValues("otp").length !== 6
                              }
                            >
                              {verifyingMobileOtp ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  Verifying...
                                </>
                              ) : mobileVerified ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verified
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Verify OTP
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Resend OTP button */}
                          {!mobileVerified && !mobileOtpCountdownActive && signInForm.getValues("mobileNumber") && (
                            <div className="flex justify-center mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full font-medium text-xs h-7"
                                onClick={handleSendMobileOtp}
                                disabled={
                                  sendingMobileOtp ||
                                  !signInForm.getValues("panNumber") ||
                                  !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(signInForm.getValues("panNumber")) ||
                                  !signInForm.getValues("mobileNumber") ||
                                  signInForm.getValues("mobileNumber").length !== 10
                                }
                              >
                                Resend OTP
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full sm:w-auto px-8 py-2 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-full transition-all"
                        disabled={isSubmitting || !mobileVerified}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Sign In Securely
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>

          {/* Sign Up Form */}
          <TabsContent value="signup">
            <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="text-center p-4 pb-2">
                <h2 className="text-xl font-bold text-gray-900">Create Your Account</h2>
                <p className="text-gray-600 text-sm">Complete your KYC verification to get started</p>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{signUpProgress}% Complete</span>
                  </div>
                  <Progress value={signUpProgress} className="h-1.5" />
                </div>
              </div>

              <div className="p-4 space-y-6">
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-6">
                    {/* Personal Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                          1
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
                      </div>

                      <FormField
                        control={signUpForm.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              PAN Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., ABCDE1234F"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase().trim()
                                  field.onChange(value)
                                  if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                                    signUpForm.clearErrors("panNumber")
                                  }
                                }}
                                className="uppercase h-10 border-2 focus:border-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your Permanent Account Number as per income tax records
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signUpForm.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full name as per PAN"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value)
                                  if (value.trim().length > 0) {
                                    signUpForm.clearErrors("clientName")
                                  }
                                }}
                                className="h-10 border-2 focus:border-blue-500 transition-colors"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your name as per PAN records
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DatePickerField
                        control={signUpForm.control}
                        name="dateOfBirth"
                        label="Date of Birth"
                        placeholder="Select your date of birth"
                        description="Must be between 18 and 65 years old"
                        required={true}
                        minAge={18} // These are passed for component behavior like year range
                        maxAge={65} // Not for direct validation here
                        startYear={1940}
                      // yearRange={DatePickerConfigs.dateOfBirthEmployment.yearRange}
                      // No customValidation prop needed here as Zod schema handles it
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Mobile Verification Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                          2
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Mobile Verification</h3>
                        {mobileVerified && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <FormField
                        control={signUpForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Mobile Number
                            </FormLabel>
                            <FormControl>
                              <div className="relative flex">
                                <div className="flex items-center justify-center px-3 border-2 border-r-0 rounded-l-lg bg-gray-50 text-gray-700 font-medium text-sm">
                                  +91
                                </div>
                                <Input
                                  placeholder="Enter 10 digit mobile number"
                                  {...field}
                                  maxLength={10}
                                  className={cn(
                                    "rounded-l-none h-10 border-2 focus:border-blue-500 transition-colors",
                                    mobileVerified && "border-green-500 bg-green-50",
                                  )}
                                  disabled={!panAndDobValid || mobileVerified}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                                    field.onChange(value)
                                    if (value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
                                      signUpForm.clearErrors("mobileNumber")
                                    }
                                  }}
                                />
                                {mobileVerified && (
                                  <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                                )}
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your active mobile number for verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={mobileVerified ? "outline" : "default"}
                          className={cn(
                            "transition-all rounded-full px-4 h-9 font-medium text-sm",
                            mobileVerified
                              ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                              : mobileOtpCountdownActive
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg",
                          )}
                          onClick={handleSendSignUpMobileOtp}
                          disabled={
                            !panAndDobValid ||
                            sendingMobileOtp ||
                            mobileVerified ||
                            mobileOtpCountdownActive ||
                            !signUpForm.getValues("mobileNumber") ||
                            signUpForm.getValues("mobileNumber").length !== 10
                          }
                        >
                          {sendingMobileOtp ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Sending...
                            </>
                          ) : mobileVerified ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Phone className="h-4 w-4 mr-1" />
                              Send OTP
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Mobile OTP Countdown Timer */}
                      {mobileOtpCountdownActive && !mobileVerified && (
                        <CountdownTimer
                          isActive={mobileOtpCountdownActive}
                          initialSeconds={60}
                          className="mt-2"
                          onComplete={handleMobileOtpCountdownComplete}
                        />
                      )}

                      {/* Mobile OTP Field */}
                      {(mobileOtpCountdownActive || mobileVerified) && !mobileVerified && (
                        <div className="mt-6 space-y-4">
                          <FormField
                            control={signUpForm.control}
                            name="mobileOtp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 text-center block">
                                  Enter Mobile OTP
                                </FormLabel>
                                <FormControl>
                                  <OtpInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={!panAndDobValid}
                                    onEnter={handleVerifySignUpMobileOtp}
                                    autoFocus
                                    className="justify-center"
                                  />
                                </FormControl>
                                <FormDescription className="text-center text-xs text-gray-500">
                                  Enter the 6-digit OTP sent to your mobile number
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="transition-all rounded-full px-6 h-9 font-medium text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                              onClick={handleVerifySignUpMobileOtp}
                              disabled={
                                !panAndDobValid ||
                                verifyingMobileOtp ||
                                !signUpForm.getValues("mobileOtp") ||
                                signUpForm.getValues("mobileOtp").length !== 6
                              }
                            >
                              {verifyingMobileOtp ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Verify OTP
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Resend Mobile OTP button */}
                          {!mobileOtpCountdownActive && signUpForm.getValues("mobileNumber") && panAndDobValid && (
                            <div className="flex justify-center mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full font-medium text-xs h-7"
                                onClick={handleSendSignUpMobileOtp}
                                disabled={
                                  sendingMobileOtp ||
                                  !signUpForm.getValues("mobileNumber") ||
                                  signUpForm.getValues("mobileNumber").length !== 10
                                }
                              >
                                Resend OTP
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show clean verified state */}
                      {mobileVerified && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium text-sm">Mobile Number Verified</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Email Verification Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-bold">
                          3
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Email Verification</h3>
                        {emailVerified && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <FormField
                        control={signUpForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Enter your email address"
                                  type="email"
                                  {...field}
                                  disabled={!mobileVerified || emailVerified}
                                  className={cn(
                                    "h-10 border-2 focus:border-blue-500 transition-colors",
                                    emailVerified && "border-green-500 bg-green-50",
                                  )}
                                  onChange={(e) => {
                                    const value = e.target.value.trim()
                                    field.onChange(value)
                                    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                      signUpForm.clearErrors("email")
                                    }
                                  }}
                                />
                                {emailVerified && (
                                  <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                                )}
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Your email address for communication and verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={emailVerified ? "outline" : "default"}
                          className={cn(
                            "transition-all rounded-full px-4 h-9 font-medium text-sm",
                            emailVerified
                              ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                              : emailOtpCountdownActive
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg",
                          )}
                          onClick={handleSendEmailOtp}
                          disabled={
                            !mobileVerified ||
                            sendingEmailOtp ||
                            emailVerified ||
                            emailOtpCountdownActive ||
                            !signUpForm.getValues("email") ||
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.getValues("email"))
                          }
                        >
                          {sendingEmailOtp ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Sending...
                            </>
                          ) : emailVerified ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" />
                              Send OTP
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Email OTP Countdown Timer */}
                      {emailOtpCountdownActive && !emailVerified && (
                        <CountdownTimer
                          isActive={emailOtpCountdownActive}
                          initialSeconds={60}
                          className="mt-2"
                          onComplete={handleEmailOtpCountdownComplete}
                        />
                      )}

                      {/* Email OTP Field */}
                      {(emailOtpCountdownActive || emailVerified) && !emailVerified && (
                        <div className="mt-6 space-y-4">
                          <FormField
                            control={signUpForm.control}
                            name="emailOtp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 text-center block">
                                  Enter Email OTP
                                </FormLabel>
                                <FormControl>
                                  <OtpInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={!mobileVerified}
                                    onEnter={handleVerifyEmailOtp}
                                    autoFocus
                                    className="justify-center"
                                  />
                                </FormControl>
                                <FormDescription className="text-center text-xs text-gray-500">
                                  Enter the 6-digit OTP sent to your email address
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="transition-all rounded-full px-6 h-9 font-medium text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                              onClick={handleVerifyEmailOtp}
                              disabled={
                                !mobileVerified ||
                                verifyingEmailOtp ||
                                !signUpForm.getValues("emailOtp") ||
                                signUpForm.getValues("emailOtp").length !== 6
                              }
                            >
                              {verifyingEmailOtp ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Verify OTP
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Resend Email OTP button */}
                          {!emailOtpCountdownActive && signUpForm.getValues("email") && mobileVerified && (
                            <div className="flex justify-center mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full font-medium text-xs h-7"
                                onClick={handleSendEmailOtp}
                                disabled={
                                  sendingEmailOtp ||
                                  !signUpForm.getValues("email") ||
                                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.getValues("email"))
                                }
                              >
                                Resend OTP
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show clean verified state */}
                      {emailVerified && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium text-sm">Email Address Verified</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full sm:w-auto px-8 py-2 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-full transition-all"
                        disabled={isSubmitting || !panAndDobValid || !mobileVerified || !emailVerified}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Create Account
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
