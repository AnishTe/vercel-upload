"use client"
import { viewClientDetails } from "@/api/auth"
import type React from "react"

import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { withTokenValidation, validateTokenEnhanced, type ValidationResult } from "@/utils/withTokenValidation"

const orderedKeys = ["clientId", "clientName", "email", "pan", "mobile", "birthDate", "branchCode"]

interface ClientDetailsProps {
    validationResult: ValidationResult
    setValidationResult: (result: ValidationResult) => void
}

function Page({ validationResult, setValidationResult }: ClientDetailsProps) {
    // const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<any>(null)
    const [clientId, setClientId] = useState("")

    const handleSearch = async (inputClientId?: string) => {
        // Get the current value directly from state to ensure we have the latest
        const currentClientId = (inputClientId ?? clientId).trim();

        if (!currentClientId) {
            setData(null)
            toast.error("Please enter a Client ID")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await viewClientDetails({ clientId: currentClientId })
            const result = validateTokenEnhanced(response)
            setValidationResult(result)

            if (result.isValid) {
                const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

                if (parsedData) {
                    setData(parsedData)
                } else {
                    throw new Error(response.data?.branchClientCheck?.message || "Failed to fetch client data")
                }
            } else {
                setError("You are not authorized to access this client.")
                setData(null)
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault() // Prevent form submission
            handleSearch(clientId);
        }
    }

    const handleDashboardRedirect = () => {
        const clientId = data.clientId
        const encodedData = encodeURIComponent(JSON.stringify(data));

        sessionStorage.setItem(`branchClientCheck_${clientId}`, JSON.stringify(data))
        // sessionStorage.setItem("clientId", clientId)
        // sessionStorage.setItem(`branchClientCheck`, "true")

        const dashboardUrl = getCompatibleUrl("/client/dashboard")
        window.open(`${dashboardUrl}?clientId=${clientId}&branchClientCheck=true`, "_blank")
    }

    const formatKey = (key: string) => {
        return key
            .split(/(?=[A-Z])|_/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
    }

    if (!validationResult.isValid) {
        return null
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">View Client Details</CardTitle>
                        </CardHeader>
                        <CardContent className="container mx-auto">
                            <div className="flex flex-col space-y-2 mb-4 w-full sm:w-auto p-4">
                                <Label htmlFor="clientId">Please enter ClientID to continue:</Label>
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <Input
                                        id="clientId"
                                        type="text"
                                        placeholder="Enter Client ID"
                                        value={clientId}
                                        onChange={(e) => {
                                            const newValue = e.target.value
                                            setClientId(newValue)
                                        }}
                                        onKeyDown={handleKeyDown}
                                        className="w-full sm:w-48"
                                    />
                                    <Button onClick={() => handleSearch()} disabled={loading} size="sm">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
                            {loading ? (
                                <div className="container mx-auto w-full md:w-[80%]">
                                    <Skeleton className="h-6 w-40 mb-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 m-4">
                                        {Array.from({ length: 10 }).map((_, index) => (
                                            <div key={index} className="flex flex-row gap-2 p-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                data && (
                                    <div className="container mx-auto w-full  p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            {orderedKeys?.map(
                                                (key) =>
                                                    data[key] && (
                                                        <div key={key} className="flex flex-wrap gap-2 p-2 rounded-lg shadow-sm">
                                                            <span className="font-semibold text-base sm:text-lg w-full sm:w-1/2">{formatKey(key)}:</span>
                                                            <span className="text-sm sm:text-md w-full sm:w-1/2">{data[key]}</span>
                                                        </div>
                                                    )
                                            )}
                                            {Object.entries(data).map(
                                                ([key, value]) =>
                                                    !orderedKeys?.includes(key) && (
                                                        <div key={key} className="flex flex-wrap gap-2 p-2 rounded-lg shadow-sm">
                                                            <span className="font-semibold text-base sm:text-lg w-full sm:w-1/2">{formatKey(key)}:</span>
                                                            <span className="text-sm sm:text-md w-full sm:w-1/2 break-words whitespace-normal overflow-hidden">
                                                                {value as string}
                                                            </span>
                                                        </div>
                                                    )
                                            )}
                                        </div>
                                        <div className="flex justify-center mt-6">
                                            <Button disabled={loading} onClick={handleDashboardRedirect} className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 transition rounded-lg">
                                                Go to Client Dashboard
                                            </Button>
                                        </div>
                                    </div>

                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {/* {showSessionExpired && <SessionExpiredModal />} */}
        </>
    )
}

export default withTokenValidation(Page)

