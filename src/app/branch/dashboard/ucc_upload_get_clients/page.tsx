"use client"
import { syncDataForAllClients, syncDataForClient, uccDetails, uploadToBSE, uploadToNSE } from "@/lib/auth"
import type React from "react"

import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { AlertCircle, FileX, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { columns } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MailBounceCount = {
    client_id: string
    count: number
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

export default function Page() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[] | null>(null)
    const [open, setOpen] = useState(false)
    const [alertTitle, setAlertTitle] = useState("")
    const [alertMessage, setAlertMessage] = useState("")
    const [syncOpen, setSyncOpen] = useState(false)
    const [syncValue, setSyncValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [clientSyncResponse, setClientSyncResponse] = useState<string | null>(null)
    const [bulkSyncResponse, setBulkSyncResponse] = useState<string | null>(null)
    const [syncSuccess, setSyncSuccess] = useState(false)

    const handleSearch = async () => {
        setAlertTitle("")
        setAlertMessage("")
        setOpen(false)
        setLoading(true)
        setError(null)
        try {
            const response = await uccDetails()
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = response.data.data
            if (parsedData && parsedData.length > 0) {
                setData(parsedData)
            } else {
                setData([])
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleSearch() // Call handleSearch on component mount
    }, [])

    const handleSyncData = async () => {
        setIsLoading(true)
        setError(null)
        setClientSyncResponse(null)
        try {
            const response = await syncDataForClient({ clientId: syncValue })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }
            setSyncValue("") // Clear the input field after sync
            setClientSyncResponse(response?.data.data || "Client data has been successfully synchronized.")
            setSyncSuccess(true)
        } catch (error: any) {
            setClientSyncResponse(error.message || "An error occurred while syncing client data.")
            setSyncSuccess(false)
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSyncAll = async () => {
        setIsLoading(true)
        setError(null)
        setBulkSyncResponse(null)
        try {
            const response = await syncDataForAllClients()
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }
            setBulkSyncResponse(response.data.data || "All client data has been successfully synchronized.")
            setSyncSuccess(true)
        } catch (error: any) {
            setBulkSyncResponse(error.message || "An error occurred while syncing all client data.")
            setSyncSuccess(false)
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleNseUpload = async (rowData: MailBounceCount) => {
        try {
            const response = await uploadToNSE({ clientId: rowData.client_id.toString() })
            setAlertTitle(response.data.data)
            setAlertMessage(response.data.data.data)
        } catch (error) {
            console.error("Upload failed:", error)
        } finally {
            setOpen(true)
        }
    }

    const handleBseUpload = async (rowData: MailBounceCount) => {
        try {
            const response = await uploadToBSE({ clientId: rowData.client_id.toString() })
            setAlertTitle(response.data.data)
            setAlertMessage(response.data.data)
        } catch (error) {
            console.error("Upload failed:", error)
        } finally {
            setOpen(true)
        }
    }

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        event.stopPropagation() // Prevents row click from interfering
        if (actionType === "handleBseUpload") {
            handleBseUpload(row)
        } else if (actionType === "handleNseUpload") {
            handleNseUpload(row)
        }
    }, [])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">UCC Upload</CardTitle>
                            <Button onClick={() => setSyncOpen(true)}>
                                <RefreshCw /> Sync Data
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
                            {loading ? (
                                <DataTableSkeleton columns={5} rows={10} />
                            ) : (
                                <>
                                    {data === null ? (
                                        <p className="text-center">No records available!</p>
                                    ) : data.length > 0 ? (
                                        <DataTableArray
                                            columns={columns}
                                            data={data}
                                            showPagination={false}
                                            getActionButtonDetails={getActionButtonDetails}
                                            downloadCSV={false}
                                            downloadExcel={false}
                                            downloadPDF={false}
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
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/30 dark:bg-white/10">
                    <Alert className="max-w-[90%] sm:max-w-[425px] border bg-card text-card-foreground shadow-xl rounded-lg p-5 animate-fade-in">
                        <AlertTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            {alertTitle}
                        </AlertTitle>
                        <AlertDescription className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {alertMessage}
                        </AlertDescription>
                        <div className="flex justify-end mt-6 gap-3">
                            <Button
                                onClick={() => {
                                    setOpen(false)
                                    handleSearch()
                                }}
                                variant="outline"
                                className="px-4 py-2 text-sm sm:text-base"
                            >
                                Close
                            </Button>
                        </div>
                    </Alert>
                </div>
            )}


            <Dialog
                open={syncOpen}
                onOpenChange={(open) => {
                    if (!open && syncSuccess) {
                        handleSearch()
                    }
                    setSyncOpen(open)
                    if (!open) {
                        setClientSyncResponse(null)
                        setBulkSyncResponse(null)
                        setSyncSuccess(false)
                    }
                }}
            >
                <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Sync Options</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="client_data" className="w-full">
                        <TabsList className="grid grid-cols-2 w-full mb-4">
                            <TabsTrigger value="client_data" className="text-sm sm:text-base">
                                Client Data
                            </TabsTrigger>
                            <TabsTrigger value="bulk_data" className="text-sm sm:text-base">
                                Bulk Data
                            </TabsTrigger>
                        </TabsList>

                        {/* Client Data Tab */}
                        <TabsContent value="client_data">
                            <div className="flex flex-col space-y-4 py-2">
                                <div className="space-y-2">
                                    <label htmlFor="client-id" className="text-sm font-medium">
                                        Client ID
                                    </label>
                                    <Input
                                        id="client-id"
                                        placeholder="Enter Client ID"
                                        value={syncValue}
                                        onChange={(e) => setSyncValue(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the client ID to sync data for a specific client.
                                    </p>
                                </div>

                                {clientSyncResponse && (
                                    <div
                                        className={`p-3 rounded-md text-sm ${syncSuccess ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
                                    >
                                        {clientSyncResponse}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button className="w-full" onClick={handleSyncData} disabled={!syncValue.trim() || isLoading}>
                                        {isLoading ? "Syncing..." : "Sync Client Data"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (syncSuccess) {
                                                handleSearch()
                                            }
                                            setSyncOpen(false)
                                        }}
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Bulk Data Tab */}
                        <TabsContent value="bulk_data">
                            <div className="flex flex-col space-y-4 py-2">
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        This will synchronize data for all clients in the system. This operation may take some time to
                                        complete.
                                    </p>
                                </div>

                                {bulkSyncResponse && (
                                    <div
                                        className={`p-3 rounded-md text-sm ${syncSuccess ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
                                    >
                                        {bulkSyncResponse}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button onClick={handleSyncAll} variant="default" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Syncing All Data..." : "Sync All Data"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (syncSuccess) {
                                                handleSearch()
                                            }
                                            setSyncOpen(false)
                                        }}
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}

