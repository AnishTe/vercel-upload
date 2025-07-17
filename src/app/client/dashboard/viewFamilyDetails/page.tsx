"use client"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import {
    getActiveFamilyMembers,
    getClientsHavingMeAsFamilyMember,
    removeFamilyMember,
    removeMyselfAsFamilyMember,
} from "@/lib/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { getLocalStorage } from "@/utils/localStorage"

import { Button } from "@/components/ui/button"
import { List, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner";
import { AddFamilyMemberDialog } from "@/components/Dashboard/viewFamilyDetails/add-family-member-dialog"
import { FamilyMembersList } from "@/components/Dashboard/viewFamilyDetails/family-members-list"
import { FamilyHeadsList } from "@/components/Dashboard/viewFamilyDetails/family-heads-list"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FamilyClientsPage() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [addClientOpen, setAddClientOpen] = useState(false)
    const [familyMembers, setFamilyMembers] = useState([])
    const [refreshing, setRefreshing] = useState(false)

    // State for family heads list (where user is added as a family member)
    const [familyHeadsDialogOpen, setFamilyHeadsDialogOpen] = useState(false)
    const [familyHeads, setFamilyHeads] = useState([])
    const [familyHeadsLoading, setFamilyHeadsLoading] = useState(false)
    const [familyHeadsError, setFamilyHeadsError] = useState<string | null>(null)

    const currentClientId = getLocalStorage("currentClientId")

    const fetchFamilyMembers = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        setError(null)

        try {
            const response = await getActiveFamilyMembers({
                clientId: currentClientId,
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return
            }

            if (!response.status || response.status !== 200) {
                throw new Error("Failed to fetch family members")
            }

            if (response?.data?.data) {
                try {
                    const parsedData =
                        typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
                    setFamilyMembers(parsedData)
                } catch (parseError: any) {
                    setError("Error parsing data: " + parseError.message)
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching family members")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [currentClientId])

    const fetchFamilyHeads = useCallback(async () => {
        setFamilyHeadsLoading(true)
        setFamilyHeadsError(null)

        try {
            const response = await getClientsHavingMeAsFamilyMember({
                clientId: currentClientId,
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return
            }

            if (!response.status || response.status !== 200) {
                throw new Error("Failed to fetch family heads")
            }

            if (response?.data?.data) {
                try {
                    const parsedData =
                        typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
                    setFamilyHeads(parsedData)
                } catch (parseError: any) {
                    setFamilyHeadsError("Error parsing data: " + parseError.message)
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (err: any) {
            setFamilyHeadsError(err.message || "An error occurred while fetching family heads")
        } finally {
            setFamilyHeadsLoading(false)
        }
    }, [currentClientId])

    const handleRemoveFamilyMember = async (familyClientId: string) => {
        try {
            const response = await removeFamilyMember({
                clientId: currentClientId,
                familyClientId: familyClientId,
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return false
            }

            if (response.status === 200) {
                toast.success(response.data?.data.message || "Family member removed successfully");
                fetchFamilyMembers() // Refresh the list
                return true
            } else {
                toast.error("Failed to remove family member");
                return false
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while removing family member");
            return false
        }
    }

    const handleRemoveMyselfAsFamilyMember = async (familyHeadClientId: string) => {
        try {
            const response = await removeMyselfAsFamilyMember({
                clientId: currentClientId,
                familyHeadClientId: familyHeadClientId,
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return false
            }

            if (response.status === 200) {
                toast.success(response.data?.data.message || "Removed from family successfully");

                fetchFamilyHeads() // Refresh the list
                return true
            } else {
                toast.error("Failed to remove family member");
                return false
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while removing family member");
            return false
        }
    }

    // Load family members on component mount
    useEffect(() => {
        fetchFamilyMembers()
    }, [fetchFamilyMembers])

    // Load family heads when dialog opens
    useEffect(() => {
        if (familyHeadsDialogOpen && familyHeads.length === 0 && !familyHeadsLoading) {
            fetchFamilyHeads()
        }
    }, [familyHeads.length, familyHeadsDialogOpen, familyHeadsLoading, fetchFamilyHeads])

    const handleDashboardRedirect = (member) => {
        const clientId = member.clientId
        sessionStorage.setItem(`familyClientCheck_${clientId}`, JSON.stringify(member))

        const dashboardUrl = getCompatibleUrl("/client/dashboard")
        window.open(`${dashboardUrl}?clientId=${clientId}&familyClientCheck=true`, "_blank")
    }

    const handleRefresh = () => {
        fetchFamilyMembers(true)
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">

                        <CardHeader className="flex flex-col gap-1 sm:gap-1 lg:flex-col lg:items-start">
                            {/* Header Top */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                                {/* Left: Title + Refresh */}
                                <div className="flex flex-row sm:items-center gap-2 w-full sm:w-auto">
                                    <h2 className="text-lg font-semibold">Mapped Clients</h2>

                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={loading || refreshing}
                                        className="gap-2 sm:w-auto w-fit self-start sm:self-auto"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                        Refresh
                                    </Button>
                                </div>

                                {/* Right: Add + View Members */}
                                <div className="flex flex-row sm:flex-row sm:items-center gap-2  sm:w-auto w-fit mx-auto sm:mx-0">
                                    <AddFamilyMemberDialog
                                        open={addClientOpen}
                                        onOpenChange={setAddClientOpen}
                                        onSuccess={fetchFamilyMembers}
                                    />

                                    <Button
                                        variant="secondary"
                                        className="flex items-center justify-center gap-2 w-fit sm:w-auto"
                                        onClick={() => setFamilyHeadsDialogOpen(true)}
                                    >
                                        <List className="h-4 w-4" />
                                        <span className="inline">Mapped As Member</span>
                                    </Button>
                                </div>
                            </div>

                            <CardDescription className="text-md">
                                Family members mapped under your client code will appear here. You can view their individual reports such as holdings, ledger, and transactions as per access rights.
                            </CardDescription>
                            {/* Description */}
                        </CardHeader>



                        <CardContent>

                            {/* Error Alert */}
                            {error && (
                                <Alert className="mb-6 border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Family Members List */}
                            <FamilyMembersList
                                familyMembers={familyMembers}
                                loading={loading}
                                refreshing={refreshing}
                                onRemove={handleRemoveFamilyMember}
                                onAddClick={() => setAddClientOpen(true)}
                                onMemberClick={handleDashboardRedirect}
                            />

                            {/* Family Heads Dialog */}
                            <FamilyHeadsList
                                open={familyHeadsDialogOpen}
                                onOpenChange={setFamilyHeadsDialogOpen}
                                familyHeads={familyHeads}
                                loading={familyHeadsLoading}
                                error={familyHeadsError}
                                onRefresh={fetchFamilyHeads}
                                onRemove={handleRemoveMyselfAsFamilyMember}
                            />
                        </CardContent >
                    </Card >
                </div >
            </DashboardLayout >

            {showSessionExpired && <SessionExpiredModal />
            }
        </>
    )
}
