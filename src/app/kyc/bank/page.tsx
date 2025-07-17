"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { redirect } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useKYC } from "@/contexts/kyc-context"
import StepProgress from "@/components/KYC/step-progress"
import BankForm from "@/components/KYC/bank-form"
import { Button } from "@/components/ui/button"
import { getCompatibleUrl } from "@/utils/url-helpers"

export default function BankPage() {
  const {
    setCurrentStep,
    canAccessStep,
    handleDigioReturn,
    updateStepStatus,
    state,
    showBankConfirmation,
    setShowBankConfirmation,
    pendingNavigation,
    setPendingNavigation,
    validateStepStatuses
  } = useKYC()
  const [formSubmitted, setFormSubmitted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if this step is accessible
  // useEffect(() => {
  //   // Validate step statuses when the page loads
  //   validateStepStatuses()


  //   if (!canAccessStep("bank")) {
  //     redirect("/kyc/nominee-poa")
  //   }
  // }, [canAccessStep, validateStepStatuses])

  // Set current step
  useEffect(() => {
    setCurrentStep("bank")
  }, [setCurrentStep])

  // Handle return from Digio
  // useEffect(() => {
  //   const status = searchParams.get("status")
  //   const sessionId = searchParams.get("sessionId")

  //   if (status && sessionId) {
  //     handleDigioReturn("bank", status === "success" ? "success" : "failure")

  //     // Remove query params
  //     router.replace(getCompatibleUrl("/kyc/bank"))
  //   }
  // }, [searchParams, handleDigioReturn, router])

  // Redirect to next step if bank is already completed
  // useEffect(() => {
  //   if (state.steps.bank === "completed" && !formSubmitted) {
  //     // Check if there is actually form data
  //     const formData = localStorage.getItem("kyc_bank_form")

  //     // Get the referrer from sessionStorage if available
  //     const referrer = typeof window !== "undefined" ? sessionStorage.getItem("kyc_referrer") : null

  //     // Only redirect if:
  //     // 1. We have form data
  //     // 2. This is not a backward navigation (referrer is not from a later step)
  //     // 3. The form wasn't just submitted (to prevent double redirects)
  //     if (formData && !referrer?.includes("exchange") && !referrer?.includes("exchange") && !referrer?.includes("ipv")) {
  //       console.log("Bank step already completed with data, proceeding to next step")

  //       // Give a moment for the page to stabilize
  //       const timer = setTimeout(() => {
  //         // Always navigate to exchange if bank is completed
  //         const nextStep = "kyc/exchange"
  //         console.log(`Navigating to next step: ${nextStep}`)
  //         // router.push(getCompatibleUrl(nextStep))
  //       }, 300)

  //       return () => clearTimeout(timer)
  //     } else if (!formData) {
  //       // Reset step status if no data
  //       updateStepStatus("bank", "not_started")
  //     } else {
  //       console.log("Not redirecting from bank page because user came from:", referrer)
  //     }
  //   }
  // }, [state.steps.bank, router, formSubmitted, updateStepStatus])

  // Add a new useEffect to track the referrer
  // useEffect(() => {
  //   // Store the previous page as referrer when navigating
  //   if (typeof window !== "undefined") {
  //     const previousPath = document.referrer
  //     if (previousPath) {
  //       sessionStorage.setItem("kyc_referrer", previousPath)
  //       console.log("Stored referrer:", previousPath)
  //     }
  //   }
  // }, [])

  return (
    <>
      <StepProgress />
      <Card className="border-none shadow-md">
        <CardContent className="pt-6 px-6 pb-8">
          <BankForm onFormSubmitted={() => setFormSubmitted(true)} />
        </CardContent>
      </Card>
    </>
  )
}
