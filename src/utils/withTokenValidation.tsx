"use client"

import { type ComponentType, useState, useEffect } from "react"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { SessionExpiredModal } from "./tokenValidation"
import { usePathname, useSearchParams } from "next/navigation"
import { getLocalStorage, removeLocalStorage } from "./localStorage"

// Define the validation result type
export interface ValidationResult {
    isValid: boolean
    showSessionExpired: boolean
    showAccessDenied: boolean
    userType: string
}

// Validation function
export const validateTokenEnhanced = (response: any): ValidationResult => {
    const tokenValidity = response?.data?.tokenValidity
    const branchClientCheck = response?.data?.tokenValidity?.branchClientCheck
    const result: ValidationResult = {
        isValid: true,
        showSessionExpired: false,
        showAccessDenied: false,
        userType: tokenValidity?.userType || "",
    }

    // Check token validity
    if (tokenValidity && !tokenValidity.isValid) {
        result.isValid = false
        result.showSessionExpired = true

        // Clear cookies for invalid token
        const userId = getLocalStorage("currentClientId")
        // const userId = localStorage.getItem("currentClientId")
        if (userId) {
            removeLocalStorage(`userToken_${userId}`)
            removeLocalStorage(`userID_${userId}`)
            removeLocalStorage(`userDetails_${userId}`)
            removeLocalStorage("currentClientId")
        }
        toast.error("You have been logged out :(")
    } else if (!tokenValidity) {
        toast.warning("tokenValidity is not available in response.")
    }

    // Check branch client access
    if (branchClientCheck && !branchClientCheck.isValidBranch && tokenValidity?.userType === "BRANCH") {
        result.isValid = false
        result.showAccessDenied = true
    }

    return result
}

// HOC function that wraps components requiring token validation
export function withTokenValidation<P extends object>(
    WrappedComponent: ComponentType<
        P & {
            validationResult: ValidationResult
            setValidationResult: (result: ValidationResult) => void
        }
    >,
) {
    return function WithTokenValidation(props: P) {
        const pathname = usePathname()
        const [validationResult, setValidationResult] = useState<ValidationResult>({
            isValid: true,
            showSessionExpired: false,
            showAccessDenied: false,
            userType: "",
        })

        // Access Denied component
        const AccessDeniedAlert = () => {
            const [countdown, setCountdown] = useState(5)
            const searchParams = useSearchParams()

            useEffect(() => {
                const clientId = searchParams.get("clientId")
                const branchClientCheck = searchParams.get("branchClientCheck")

                const shouldCloseTab = pathname.startsWith("/client") && clientId && branchClientCheck === "true"

                if (!shouldCloseTab) {
                    return
                }

                const timer = setInterval(() => {
                    sessionStorage.removeItem("branchClientCheck")
                    sessionStorage.removeItem("clientId")
                    sessionStorage.removeItem(`branchClientCheck_${clientId}`);
                    sessionStorage.clear()
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer)
                            window.close() // Close the tab
                        }
                        return prev - 1
                    })
                }, 1000)

                return () => clearInterval(timer) // Cleanup the timer
            }, [searchParams])

            return (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    {/* Blurred overlay */}
                    <div className="absolute inset-0 backdrop-blur-sm" />

                    {/* Alert modal with transparent glassy effect */}
                    <Alert className="w-full max-w-lg border border-black/20 shadow-lg backdrop-blur-md">
                        <AlertTitle className="text-2xl font-bold text-destructive">Access Denied</AlertTitle>
                        <AlertDescription className="mt-4 text-lg">
                            <p className="mb-4">You are not authorized to access this branch.</p>
                            <div className="font-semibold">
                                Closing window in <span className="text-destructive">{countdown}</span> seconds...
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }

        useEffect(() => {
            if (validationResult.showAccessDenied && validationResult.userType === "BRANCH") {
                if (pathname.startsWith("/branch")) {
                    toast.error("You are not authorized to access this branch.")
                    // Reset showAccessDenied to prevent further alerts
                    setValidationResult((prev) => ({ ...prev, showAccessDenied: false, isValid: true }))
                } else if (pathname.startsWith("/client")) {
                    toast.error("You are not authorized to access this branch.")
                }
            }
        }, [validationResult, pathname])

        if (validationResult.showSessionExpired) {
            return <SessionExpiredModal />
        }

        if (validationResult.showAccessDenied && validationResult.userType === "BRANCH") {
            if (pathname.startsWith("/branch")) {
                // For /branch paths, only show toast and return null to prevent rendering
                return null
            } else if (pathname.startsWith("/client")) {
                // For /client paths, show toast and AccessDeniedAlert
                return <AccessDeniedAlert />
            }
        }

        // Only render the wrapped component if validation passes
        return validationResult.isValid ? (
            <WrappedComponent {...props} validationResult={validationResult} setValidationResult={setValidationResult} />
        ) : null
    }
}

