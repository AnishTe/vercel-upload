"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileX, Loader2, RefreshCcw, Search } from "lucide-react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { getCuspaLedgerMessageLog } from "@/api/auth"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import DataTableSkeleton from "./DataTable-Skeleton"
import dynamic from "next/dynamic"
import { columns } from "./Dashboard/whatsapp/columns"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface TabContent {
    [key: string]: {
        title: string
        description?: string
        icon: React.ElementType
        action: () => Promise<any>
    }
}

interface OperationDashboardProps {
    title: string
    tabContent: TabContent
    defaultTab: string
}

export default function OperationDashboard({ title, tabContent, defaultTab }: OperationDashboardProps) {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [alertTitle, setAlertTitle] = useState("")
    const [alertMessage, setAlertMessage] = useState("")
    const [showAlert, setShowAlert] = useState(false)
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date()
        return today.toISOString().split("T")[0] // YYYY-MM-DD format
    })
    const [logData, setLogData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value)
    }

    const fetchLog = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getCuspaLedgerMessageLog({ date: selectedDate })
            const tokenIsValid = validateToken(res)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = res.data.data;

            if (parsedData && parsedData.length > 0) {
                setLogData(parsedData);
            } else {
                setLogData([]);
            }
        } catch (error: any) {
            console.error("Error fetching CUSPA ledger message logs:", error)
            setError("Failed to load data.")
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => {
        if (selectedDate) {
            fetchLog()
        }
    }, [fetchLog, selectedDate])

    const handleApiCall = async (apiFunction: () => Promise<any>, actionName: string) => {
        setIsLoading(true)
        try {
            const response = await apiFunction()

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }
            if (response?.data) {
                setAlertTitle(`${actionName} Successful`)
                setAlertMessage(response.data.message || JSON.stringify(response.data.data))
            } else {
                throw new Error(response?.data?.error || `Failed to perform ${actionName}`)
            }
        } catch (error) {
            setAlertTitle(`${actionName} Failed`)
            setAlertMessage(`An error occurred during ${actionName}. Please try again.`)
        } finally {
            setIsLoading(false)
            setShowAlert(true)
        }
    }

    // Get the current icon component
    const ActiveIcon = tabContent[activeTab].icon

    return (
        <DashboardLayout>
            <div className="mx-auto py-4 px-4 md:px-6">
                <Card className="w-full shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
                        <CardTitle className="text-xl font-bold text-center">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row min-h-[400px]">
                            {/* Sidebar Navigation */}
                            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/60">
                                <div className="p-4 space-y-1">
                                    {Object.entries(tabContent).map(([key, { title, icon: Icon }]) => (
                                        <button
                                            key={key}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors
                                ${activeTab === key
                                                    ? "bg-primary text-primary-foreground font-medium"
                                                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                                                }`}
                                            onClick={() => setActiveTab(key)}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>{title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-grow flex flex-col items-center justify-center p-2 md:p-10 gap-4">
                                <div className="w-full flex items-center justify-center flex-col gap-4">
                                    <div className="mb-8 text-center">
                                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                                            <ActiveIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{tabContent[activeTab].title}</h3>
                                        {tabContent[activeTab].description && (
                                            <p className="text-muted-foreground">{tabContent[activeTab].description}</p>
                                        )}

                                        {
                                            activeTab === "cuspaLedgerMessage" &&
                                            <p className="text-muted-foreground mt-4">
                                                <span className="font-medium">📁 Please ensure the input files are placed at the following location before processing:</span>
                                                <br />
                                                D:\CRON\Files\CuspaDebit\$yyyy$\$MM$$yy$\$dd$$MM$$yyyy$
                                                <br />
                                                <span className="font-medium">🗓️ (Replace placeholders with the current date values — e.g., yyyy=2025, MM=06, dd=04, yy=25)</span>
                                            </p>
                                        }
                                    </div>

                                    <Button
                                        onClick={() => handleApiCall(tabContent[activeTab].action, tabContent[activeTab].title)}
                                        disabled={isLoading}
                                        size="lg"
                                        className="max-w-md w-full h-12"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            `Process ${tabContent[activeTab].title}`
                                        )}
                                    </Button>
                                </div>

                                {
                                    activeTab === "cuspaLedgerMessage" &&
                                    <Card className="w-full shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-center flex items-center justify-between gap-2 ">
                                                Logs
                                                <Button variant="secondary" className="text-sm" onClick={() => fetchLog()}> <RefreshCcw className="mr-1 h-2 w-2" />Refresh </Button>
                                            </CardTitle>
                                            <div className="flex flex-col space-y-2 mb-4 w-full sm:w-auto">
                                                <Label htmlFor="date">Date:</Label>
                                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={handleDateChange}
                                                        className="w-full sm:w-38 bg-white text-black placeholder-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>

                                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
                                            {loading ? (
                                                <DataTableSkeleton columns={5} rows={10} />
                                            ) : (
                                                <>
                                                    {logData === null ? (
                                                        <p></p>
                                                    ) : logData.length > 0 ? (
                                                        <DataTableArray
                                                            columns={columns}
                                                            data={logData}
                                                            showPagination={false}
                                                            filterColumn="clientId"
                                                            filterPlaceholder="Filter ClientID..."
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                                            <div className="rounded-full bg-muted p-3 mb-4">
                                                                <FileX className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                            <h3 className="text-lg font-medium mb-2">No records found</h3>
                                                            <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Session Expired Modal */}
            {showSessionExpired && <SessionExpiredModal />}

            {/* Alert Modal */}
            {showAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6">
                            <AlertTitle className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle
                                    className={`h-6 w-6 ${alertTitle.includes("Failed") ? "text-destructive" : "text-primary"}`}
                                />
                                {alertTitle}
                            </AlertTitle>
                            <AlertDescription className="text-muted-foreground">{alertMessage}</AlertDescription>
                            <div className="flex justify-end mt-6">
                                <Button onClick={() => setShowAlert(false)}>Close</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
