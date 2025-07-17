"use client"
import { epnstatus } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import $ from "jquery";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
// import { DataTable } from "@/components/DataTable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileX, Search } from "lucide-react"
import { columns } from "./columns"
import { toast } from "sonner"
import dynamic from "next/dynamic";
// import CustomDialog from "@/components/ui/CustomDialog";
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
});

export default function EPNStatus() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[] | null>(null)
    const [clientId, setClientId] = useState("")

    const handleSearch = async () => {
        if (!clientId.trim()) {
            toast.error("Please enter a Client ID")
            // setError("Please enter a Client ID")
            setData(null)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const response = await epnstatus({ clientId: clientId.trim() })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

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

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">EPN Status</CardTitle>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-2 w-full">
                                    <Label htmlFor="clientId">ClientID:</Label>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                                        <Input
                                            id="clientId"
                                            type="text"
                                            placeholder="Enter Client ID"
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
                                            showAllRows={true}
                                            showPagination={true}
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
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

