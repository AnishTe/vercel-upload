/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { branchHolding } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useCallback } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
// import { DataTable } from "@/components/DataTable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileX, Search } from "lucide-react"
import { columns, isinColumns } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { isindetails } from "@/api/auth"
import { toast } from "sonner"
import dynamic from "next/dynamic"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface EPNRecordsEntry {
    [key: string]: any
    onIsinClick?: (isin: string) => void
}

export default function BranchHolding() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // const [data, setData] = useState<EPNRecordsEntry[]>([])
    const [data, setData] = useState<[] | null>(null)
    const [clientId, setClientId] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isinDetails, setIsinDetails] = useState<any>(null)
    const [isinLoading, setIsinLoading] = useState(false)

    const handleSearch = async () => {
        if (!clientId.trim()) {
            toast.error("Please enter a Client ID / BOID")
            // setError("Please enter a Client ID")
            setData(null)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const response = await branchHolding({ clientId: clientId.trim() })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData) {
                setData(parsedData)
            } else {
                throw new Error("Failed to fetch Branch Holding data")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    const handleIsinClick = useCallback(async (isin: string) => {
        setIsinLoading(true)
        setIsDialogOpen(true)
        setError(null)
        try {
            const response = await isindetails({ isin })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }
            setIsinDetails(response.data.data)
        } catch (error: any) {
            console.error("Error fetching ISIN details:", error)
            setError(error.message || "An error occurred while fetching ISIN details.")
        } finally {
            setIsinLoading(false)
        }
    }, [])

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        event.stopPropagation()
        if (actionType === "isinOpen") {
            handleIsinClick(row.original.isin)
        }
    }, [])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">Holding</CardTitle>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-2 w-full">
                                    <Label htmlFor="clientId">ClientID / BOID:</Label>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                                        <Input
                                            id="clientId"
                                            type="text"
                                            placeholder="Enter Client ID/BOID"
                                            value={clientId}
                                            onChange={(e) => setClientId(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="w-full sm:w-38 bg-white text-black placeholder-gray-400"
                                        />
                                        <Button onClick={handleSearch} disabled={loading} size="sm">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>

                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : (

                                <>
                                    {data === null ? (
                                        <p></p>
                                    ) : data.length > 0 ? (
                                        <DataTableArray
                                            columns={columns}
                                            data={data}
                                            showPagination={true}
                                            showAllRows={true}
                                            getActionButtonDetails={getActionButtonDetails}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>ISIN Details</DialogTitle>
                    </DialogHeader>
                    {isinLoading ? (
                        <DataTableSkeleton columns={2} rows={5} />
                    ) : isinDetails ? (
                        <div className="flex flex-col gap-2 m-4">
                            {Object.entries(isinDetails)
                                .map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-1">
                                        <span className="font-semibold capitalize">{key}:</span>
                                        <span>{String(value)}</span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p>No ISIN details available.</p>
                    )}
                </DialogContent>
            </Dialog>
            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

