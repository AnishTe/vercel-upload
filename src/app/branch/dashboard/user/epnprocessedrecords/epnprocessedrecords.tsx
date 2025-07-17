"use client"
import { epnprocessedrecords } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
// import { DataTable } from "@/components/DataTable"
import { columns } from "./columns"
import dynamic from "next/dynamic";
import { FileX, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// import CustomDialog from "@/components/ui/CustomDialog";
import { useCallback } from 'react';
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
});
export default function EPNProcessRecords() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState<[]>([])
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const getEpnRecords = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await epnprocessedrecords({
                date: date.trim()
            })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string"
                ? JSON.parse(response.data.data)
                : response.data.data;

            if (parsedData) {
                setData(parsedData);
            } else {
                throw new Error("Failed to fetch EPN Records :(");
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => {
        getEpnRecords()
    }, [getEpnRecords])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">EPN Process Records</CardTitle>
                            <div className="flex flex-col space-y-2 mb-4 w-full sm:w-auto">
                                <Label htmlFor="date">Date:</Label>
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full sm:w-38 bg-white text-black placeholder-gray-400"
                                    />
                                    <Button onClick={getEpnRecords} disabled={loading} size="sm">
                                        <Search className="h-4 w-4" />

                                    </Button>
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

