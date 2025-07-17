"use client"

import { useEffect } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import StepProgress from "@/components/KYC/step-progress"
import ExchangeForm from "@/components/KYC/exchange-form"
import { useSearchParams, useRouter } from "next/navigation"
import { redirect } from "next/navigation"

export default function ExchangePage() {
  const { setCurrentStep, canAccessStep, handleDigioReturn, updateStepStatus, state, validateStepStatuses } = useKYC()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if this step is accessible
  useEffect(() => {
    // Validate step statuses when the page loads
    validateStepStatuses()

    if (!canAccessStep("exchange")) {
      redirect("/kyc/bank")
    }
  }, [canAccessStep, router, validateStepStatuses])

  // Set current step
  useEffect(() => {
    setCurrentStep("exchange")
  }, [setCurrentStep])

  // Handle return from Digio
  // useEffect(() => {
  //   const status = searchParams.get("status")
  //   const sessionId = searchParams.get("sessionId")

  //   if (status && sessionId) {
  //     handleDigioReturn("exchange", status === "success" ? "success" : "failure")

  //     // Remove query params
  //     router.replace("/kyc/exchange")
  //   }
  // }, [searchParams, handleDigioReturn, router])


  useEffect(() => {
    const status = searchParams.get("status")
    const sessionId = searchParams.get("sessionId")
    const digioDocId = searchParams.get("digio_doc_id")

    // Only process once and only if we have the right parameters
    if ((status && sessionId) || (status && digioDocId)) {
      // Clean the URL by removing the query parameters to prevent re-processing
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
      }

      // Only then process the parameters
      // if (status === "success") {
      //   handleDigioReturn("profile", "success")
      // } else {
      //   handleDigioReturn("profile", "failure")
      // }
    }
  }, [searchParams, handleDigioReturn, router])

  // Check if form data exists when navigating back to this step
  useEffect(() => {
    // If this step is marked as completed but has no data, reset it
    const { steps } = state
    if (steps.exchange === "completed") {
      const formData = localStorage.getItem("kyc_exchange_form")
      if (!formData) {
        updateStepStatus("exchange", "not_started")
      }
    }
  }, [state, updateStepStatus])

  return (
    <>
      <StepProgress />
      <Card className="border-none shadow-md">
        <CardContent className="m-0 p-0 shadow-xl rounded-xl backdrop-blur sm:p-4">
          <ExchangeForm />
        </CardContent>
      </Card>
    </>
  )
}
