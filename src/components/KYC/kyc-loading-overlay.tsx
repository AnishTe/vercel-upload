"use client"

import { useKYC } from "@/contexts/kyc-context"
import { Loader2, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function KYCLoadingOverlay() {
    const { isNavigating, navigationMessage } = useKYC()
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        if (isNavigating && navigationMessage.includes("Completing")) {
            // Show success checkmark briefly after completion message
            const timer = setTimeout(() => {
                setShowSuccess(true)
            }, 1000)
            return () => clearTimeout(timer)
        } else {
            setShowSuccess(false)
        }
    }, [isNavigating, navigationMessage])

    if (!isNavigating) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
                <div className="mb-4">
                    {showSuccess ? (
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto animate-in zoom-in duration-300" />
                    ) : (
                        <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                    )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {showSuccess ? "Step Completed!" : "Processing..."}
                </h3>

                <p className="text-gray-600 mb-4">{navigationMessage || "Please wait while we process your information"}</p>

                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`bg-blue-500 h-2 rounded-full transition-all duration-1000 ${showSuccess ? "w-full bg-green-500" : "w-3/4"
                            }`}
                    />
                </div>

                <p className="text-sm text-gray-500 mt-3">{showSuccess ? "Redirecting..." : "Do not close this window"}</p>
            </div>
        </div>
    )
}
