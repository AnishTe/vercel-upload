"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import IPOList from "./IPOList"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { useUser } from "@/contexts/UserContext"
import { FileText, HelpCircle, ListFilter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function IPOLayout({
    applyIPO = true,
    openIPORoute = "",
    openViewHistoryRoute = "",
}: {
    applyIPO?: boolean
    openIPORoute?: string
    openViewHistoryRoute?: string
}) {
    const [activeTab, setActiveTab] = useState("open")
    const router = useRouter()
    const { loginType, accountType } = useUser()

    const handleViewOrdersClick = () => {
        router.push(getCompatibleUrl("/client/dashboard/ipo/view-orders"))
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle>IPO Dashboard</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4  cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                        <p>
                                            Initial Public Offerings (IPOs) are when companies first offer shares to the public. Browse open,
                                            upcoming, and closed IPOs here.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex gap-2">
                            {loginType === "Client" && (
                                <Button onClick={handleViewOrdersClick} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    View My Orders
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="open">Open IPOs</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming IPOs</TabsTrigger>
                                <TabsTrigger value="closed">Closed IPOs</TabsTrigger>
                            </TabsList>

                            <TabsContent value="open">
                                <IPOList
                                    ipolisttype="ongoing"
                                    noDataMessage="No IPOs are currently open for subscription."
                                    applyIPO={applyIPO}
                                    openIPORoute={openIPORoute}
                                    openViewHistoryRoute={openViewHistoryRoute}
                                />
                            </TabsContent>
                            <TabsContent value="upcoming">
                                <IPOList ipolisttype="upcoming" noDataMessage="No upcoming IPOs are scheduled at this time." />
                            </TabsContent>
                            <TabsContent value="closed">
                                <IPOList
                                    ipolisttype="closed"
                                    noDataMessage="No closed IPOs are available in the system."
                                    openViewHistoryRoute={openViewHistoryRoute}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

