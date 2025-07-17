"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { FileText, HelpCircle, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@/contexts/UserContext"
import IPOList from "@/components/Dashboard/ipo/IPOList"
import { useState } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { syncCronIPO } from "@/lib/auth"
import { toast } from "sonner"

export default function AllIPOsPage() {
    const router = useRouter()
    const { accountType } = useUser()
    const [loading, setLoading] = useState(false)
    const [showSessionExpired, setShowSessionExpired] = useState(false)

    const handleBackClick = () => {
        router.back()
    }

    const handleSyncClick = async () => {
        setLoading(true)
        try {
            const response = await syncCronIPO()
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            if (response?.data.data[0].status === "success") {
                toast.success("IPOs synced successfully.")
            } else {
                toast.error("Failed to sync IPOs.")
            }

        } catch (error: any) {
            toast.error(error.message || "An error occurred while syncing data.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle>All IPOs</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                        <p>View all Initial Public Offerings (IPOs) in the system, regardless of their status.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSyncClick} disabled={loading} className="gap-2">
                                <RefreshCw /> Sync Data
                            </Button>
                            <Button onClick={handleBackClick} className="gap-2">
                                <FileText className="h-4 w-4" />
                                Back to IPO Dashboard
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <IPOList
                            ipolisttype="all"
                            noDataMessage="No IPOs are available in the system."
                            openViewHistoryRoute={accountType === "employee" ? "branch/dashboard/ipo/view-history" : ""}
                        />
                    </CardContent>
                </Card>
            </div>

            {showSessionExpired && <SessionExpiredModal />}
        </DashboardLayout>
    )
}

