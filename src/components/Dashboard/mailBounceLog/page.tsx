/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { mailBounceLog } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { columns } from "./columns"
import { FileX, Search } from "lucide-react"
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
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSearch = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await mailBounceLog({ searchDate: date.trim() });
            const tokenIsValid = validateToken(response);
            if (!tokenIsValid) {
                setShowSessionExpired(true);
                return;
            }

            // Directly access the data array
            const parsedData = response.data.data.data;

            if (parsedData && parsedData.length > 0) {
                setData(parsedData);
            } else {
                setData([]);
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.");
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        handleSearch(); // Call handleSearch on component mount
    }, []);

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader className="flex flex-col sm:flex-row gap-2">
                            <CardTitle className="text-center">Mail Bounce Whatsapp Log</CardTitle>
                            <div className="flex flex-col space-y-2 mb-4 w-full sm:w-auto">
                                <Label htmlFor="date">Date:</Label>
                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full sm:w-38 bg-white text-black placeholder-gray-400"
                                    />                                    <Button onClick={handleSearch} disabled={loading} size="sm">
                                        <Search className="h-4 w-4" />

                                    </Button>
                                </div>
                            </div>
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
                                            showAllRows={true}
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

