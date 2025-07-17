"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useKYC } from "@/contexts/kyc-context"
import { usePathname } from "next/navigation"
import { useKYCError } from "@/contexts/KYCErrorContext"

interface KYCBackButtonProps {
    className?: string
    type?: "button" | "submit" | "reset"
    variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
    size?: "default" | "sm" | "lg" | "icon"
    disabled?: boolean
}

export function KYCBackButton({
    className = "",
    variant = "outline",
    size = "default",
    disabled = false,
    type = "button"
}: KYCBackButtonProps) {
    const { navigateToPreviousStep, getPreviousStep } = useKYC()
    const { setErrors } = useKYCError();

    const pathname = usePathname()

    // Get current step from pathname
    const currentStep = pathname.split("/").pop()?.replace(".html", "") || ""
    const previousStep = getPreviousStep(currentStep)

    // Don't show back button on first step
    if (!previousStep || currentStep === "signin") {
        return null
    }

    const handleBackClick = () => {
        if (!disabled) {
            navigateToPreviousStep()
            setErrors([]) // Clear errors when going back
        }
    }

    return (
        <Button
            type={type}
            variant={variant}
            size={size}
            onClick={handleBackClick}
            disabled={disabled}
            className={`flex items-center gap-2 ${className}`}
        >
            <ArrowLeft className="h-4 w-4" />
            Back to {previousStep.replace("-", " ")}
        </Button>
    )
}
