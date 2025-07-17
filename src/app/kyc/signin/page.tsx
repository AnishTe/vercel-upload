"use client"

import { useEffect } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import StepProgress from "@/components/KYC/step-progress"
import SignInForm from "@/components/KYC/signin-form"
import { useSearchParams, useRouter } from "next/navigation"

export default function SignInPage() {
  const { setCurrentStep, handleDigioReturn, updateStepStatus, state } = useKYC()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Set current step
  useEffect(() => {
    setCurrentStep("signin")
  }, [setCurrentStep])

  // Handle return from Digio
  useEffect(() => {
    const status = searchParams.get("status")
    const sessionId = searchParams.get("sessionId")

    if (status && sessionId) {
      handleDigioReturn("signin", status === "success" ? "success" : "failure")

      // Remove query params
      router.replace("/kyc/signin")
    }
  }, [searchParams, handleDigioReturn, router])

  // Check if form data exists when navigating back to this step
  useEffect(() => {
    // If this step is marked as completed but has no data, reset it
    const { steps } = state
    if (steps.signin === "completed") {
      const formData = localStorage.getItem("kyc_signin_form")
      if (!formData) {
        updateStepStatus("signin", "not_started")
      }
    }
  }, [state, updateStepStatus])

  return (
    <>
      <StepProgress />
      <Card className="border-none shadow-md">
        <CardContent className="m-0 p-0 shadow-xl rounded-xl backdrop-blur">
          <SignInForm />
        </CardContent>
      </Card>
    </>
  )
}
