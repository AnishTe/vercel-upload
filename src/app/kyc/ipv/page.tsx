"use client"

import { useEffect } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import StepProgress from "@/components/KYC/step-progress"
import IPVForm from "@/components/KYC/ipv-form"
import { useSearchParams, useRouter } from "next/navigation"
import { redirect } from "next/navigation"

export default function IPVPage() {
  const { setCurrentStep, canAccessStep, handleDigioReturn, updateStepStatus, state, validateStepStatuses } = useKYC()
  const searchParams = useSearchParams()
  const router = useRouter()

  // // Check if this step is accessible
  // useEffect(() => {
  //   // Validate step statuses when the page loads
  //   validateStepStatuses()

  //   if (!canAccessStep("ipv")) {
  //     redirect("/kyc/exchange")
  //   }
  // }, [canAccessStep, validateStepStatuses])

  // // Set current step
  // useEffect(() => {
  //   setCurrentStep("ipv")
  // }, [setCurrentStep])

  // // Handle return from Digio
  // useEffect(() => {
  //   const status = searchParams.get("status")
  //   const sessionId = searchParams.get("sessionId")

  //   if (status && sessionId) {
  //     handleDigioReturn("ipv", status === "success" ? "success" : "failure")

  //     // Remove query params
  //     router.replace("/kyc/ipv")
  //   }
  // }, [searchParams, handleDigioReturn, router])

  // // Check if form data exists when navigating back to this step
  // useEffect(() => {
  //   // If this step is marked as completed but has no data, reset it
  //   const { steps } = state
  //   if (steps.ipv === "completed") {
  //     const formData = localStorage.getItem("kyc_ipv_form")
  //     if (!formData) {
  //       updateStepStatus("ipv", "not_started")
  //     }
  //   }
  // }, [state, updateStepStatus])

  return (
    <>
      <StepProgress />
      <Card className="border-none shadow-md">
        <CardContent className="pt-6 px-6 pb-8">
          <IPVForm />
        </CardContent>
      </Card>
    </>
  )
}
