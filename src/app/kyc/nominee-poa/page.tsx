"use client"

import { useEffect } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import StepProgress from "@/components/KYC/step-progress"
import NomineePoaForm from "@/components/KYC/nominee-poa-form"
import { useSearchParams, useRouter } from "next/navigation"
import { useSessionValidation } from "@/hooks/use-session-validationKYC"

export default function NomineePoaPage() {
    const { setCurrentStep, handleDigioReturn, updateStepStatus, state } = useKYC()
    const searchParams = useSearchParams()
    const router = useRouter()
    // const hasValidSession = useSessionValidation("nominee-poa")

    // Set current step
    useEffect(() => {
        setCurrentStep("nominee-poa")
    }, [setCurrentStep])

    // Handle return from Digio
    useEffect(() => {
        const status = searchParams.get("status")
        const sessionId = searchParams.get("sessionId")

        if (status && sessionId) {
            handleDigioReturn("nominee-poa", status === "success" ? "success" : "failure")

            // Remove query params
            router.replace("/kyc/nominee-poa")
        }
    }, [searchParams, handleDigioReturn, router])

    // Check if form data exists when navigating back to this step
    useEffect(() => {
        // If this step is marked as completed but has no data, reset it
        const { steps } = state
        if (steps["nominee-poa"] === "completed") {
            const formData = localStorage.getItem("kyc_nominee-poa_form")
            if (!formData) {
                updateStepStatus("nominee-poa", "not_started")
            }
        }
    }, [state, updateStepStatus])

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
                        <NomineePoaForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
