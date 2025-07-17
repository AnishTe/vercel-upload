/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { getUccStatus } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { columns } from "./columns"
import { FileX, Loader, Search } from "lucide-react"
import { useEffect } from "react"

import dynamic from "next/dynamic"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

export default function Page() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[] | null>(null)
    const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10))
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))
    const [dateError, setDateError] = useState<string | null>(null)

    const handleSearch = async () => {
        setLoading(true)
        setError(null)
        setDateError(null)

        // Validate dates
        const fromDateObj = new Date(fromDate)
        const toDateObj = new Date(toDate)

        if (fromDateObj > toDateObj) {
            setDateError("From date cannot be after to date")
            setLoading(false)
            return
        }

        try {
            const response = await getUccStatus({
                fromDate: fromDate.trim(),
                toDate: toDate.trim(),
            })
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

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">

                        <CardHeader className="flex flex-col md:flex-col sm:flex-col pl-6 mb-4">
                            <CardTitle >UCC PAN Status</CardTitle>
                            <div className="flex flex-row md:flex-row sm:flex-row md:items-end gap-1">
                                <div className="flex flex-col space-y-2 w-[95%]">
                                    <Label htmlFor="fromDate">From Date:</Label>
                                    <Input
                                        id="fromDate"
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className=" bg-white text-black placeholder-gray-400 w-[95%]"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2 w-[95%]">
                                    <Label htmlFor="toDate">To Date:</Label>
                                    <Input
                                        id="toDate"
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className=" bg-white text-black placeholder-gray-400 w-[95%]"
                                    />
                                </div>
                                <Button onClick={handleSearch} type="submit" disabled={loading} className="sm:mt-0 w-[50%]">
                                    {loading ? <Loader className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                                </Button>
                            </div>
                            {dateError && <p className="text-red-500 mt-2">{dateError}</p>}
                        </CardHeader>

                        <CardContent>
                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
                            {loading ? (
                                <DataTableSkeleton columns={5} rows={10} />
                            ) : (
                                <>
                                    {data === null ? (
                                        <p></p>
                                    ) : data.length > 0 ? (
                                        <DataTableArray
                                            columns={columns}
                                            data={data}
                                            showPagination={false}
                                            // selectableRows={true}
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

