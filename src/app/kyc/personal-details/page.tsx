"use client"

import { useCallback, useEffect, useRef } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import StepProgress from "@/components/KYC/step-progress"
import { useSearchParams, useRouter } from "next/navigation"
import PersonalDetailsForm from "@/components/KYC/personal-details"
import { useToast } from "@/hooks/use-toast"

export default function PersonalDetailsPage() {
    const { setCurrentStep, handleDigioReturn, updateStepStatus, state, getSessionId, navigateToStep, getNextStep } = useKYC()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()

    const successStatusProcessed = useRef(false)
    const cancelStatusProcessed = useRef(false)
    const isProcessingStatus = useRef(false)

    // Validate session
    // const hasValidSession = useSessionValidation("personal-details")

    // Set current step
    useEffect(() => {
        setCurrentStep("personal-details")
    }, [setCurrentStep])



    // const completeSignIn = useCallback(() => {
    //     updateStepStatus("signin", "completed")

    //     toast({
    //         title: "Sign in successful",
    //         description: "Your information has been verified",
    //         variant: "default",
    //     })

    //     const nextStep = getNextStep("signin") || "personal-details"

    //     setTimeout(() => {
    //         navigateToStep(nextStep)
    //     }, 100)
    // }, [getNextStep, navigateToStep, toast, updateStepStatus])

    // const cancelSignIn = useCallback(() => {
    //     updateStepStatus("signin", "cancelled")

    //     toast({
    //         title: "Error",
    //         description: "KYC process was cancelled.",
    //         variant: "destructive",
    //     })
    // }, [updateStepStatus, toast])

    // // STEP 3 — Handle Digio return
    // useEffect(() => {
    //     const status = searchParams.get("status")
    //     const sessionId = getSessionId()

    //     if (status && sessionId) {
    //         handleDigioReturn("personal-details", status === "success" ? "success" : "failure")

    //         // Clean URL: keep only session_id
    //         const newUrl = new URL(window.location.href)
    //         newUrl.searchParams.delete("status")
    //         newUrl.searchParams.delete("sessionId")
    //         newUrl.searchParams.set("session_id", sessionId)

    //         router.replace(newUrl.pathname + "?" + newUrl.searchParams.toString())
    //     }
    // }, [searchParams, handleDigioReturn, router, getSessionId])

    // // STEP 4 — Process KYC success
    // useEffect(() => {
    //     if (typeof window === "undefined") return

    //     const params = new URLSearchParams(window.location.search)
    //     const status = params.get("status")
    //     const Kid = params.get("kid") || params.get("id")

    //     if (
    //         status === "success" &&
    //         Kid &&
    //         !successStatusProcessed.current &&
    //         !isProcessingStatus.current
    //     ) {
    //         isProcessingStatus.current = true
    //         successStatusProcessed.current = true

    //         // Optional: save data to localStorage if not already
    //         const sessionId = getSessionId()
    //         if (sessionId) {
    //             const saved = localStorage.getItem("kyc_signin_form")
    //             if (!saved) {
    //                 const storedPan = localStorage.getItem("kyc_pan")
    //                 const values = { panNumber: storedPan || "", session_id: sessionId }

    //                 localStorage.setItem("kyc_signin_form", JSON.stringify(values))
    //                 localStorage.setItem(`userToken_${storedPan}`, sessionId)
    //             }
    //         }

    //         completeSignIn()
    //     }
    // }, [completeSignIn, getSessionId])

    // // STEP 5 — Process KYC cancel
    // useEffect(() => {
    //     if (typeof window === "undefined") return

    //     const params = new URLSearchParams(window.location.search)
    //     const status = params.get("status")

    //     if (status === "cancel" && !cancelStatusProcessed.current) {
    //         cancelStatusProcessed.current = true
    //         cancelSignIn()
    //     }
    // }, [cancelSignIn])

    // // Check if form data exists when navigating back to this step
    // useEffect(() => {
    //     // If this step is marked as completed but has no data, reset it
    //     const { steps } = state
    //     if (steps["personal-details"] === "completed") {
    //         const formData = localStorage.getItem("kyc_personal-details_form")
    //         if (!formData) {
    //             updateStepStatus("personal-details", "not_started")
    //         }
    //     }
    // }, [state, updateStepStatus])

    // useEffect(() => {
    //     return () => {
    //         successStatusProcessed.current = false
    //         cancelStatusProcessed.current = false
    //         isProcessingStatus.current = false
    //     }
    // }, [])

    // useEffect(() => {
    //     if (typeof window !== "undefined") {
    //         const params = new URLSearchParams(window.location.search)
    //         const status = params.get("status")

    //         // Reset flags if no status parameter is present
    //         if (!status) {
    //             successStatusProcessed.current = false
    //             cancelStatusProcessed.current = false
    //             isProcessingStatus.current = false
    //         }
    //     }
    // }, [])

    // // Don't render if no valid session
    // if (!hasValidSession) {
    //     return null
    // }

    return (
        <div className="container mx-auto px-0 py-8 max-w-7xl">
            <StepProgress />
            <div className="mt-8">
                <Card className="border-none shadow-md">
                    <CardContent className="m-0 p-0 shadow-xl rounded-xl backdrop-blur sm:p-4">
                        <PersonalDetailsForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
