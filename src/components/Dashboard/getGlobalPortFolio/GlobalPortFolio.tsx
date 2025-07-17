"use client"

import { useEffect, useState, useMemo } from "react"
import { getGlobalPortFolio } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { columns } from "./columns"
import { TrendingUp, IndianRupee, Wallet, FileX } from "lucide-react"
import DecryptedText from "@/components/ui/DecryptedText"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

export function GlobalPortFolio() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [data, setData] = useState<any[] | null>(null)

    useEffect(() => {
        const fetchGlobalPortFolio = async () => {
            setError(null)
            setLoading(true)
            try {
                const response = await getGlobalPortFolio()
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }

                let parsedData: any
                if (typeof response.data.data === "string") {
                    parsedData = response.data.data.trim().startsWith("Error")
                        ? response.data.data
                        : JSON.parse(response.data.data)
                } else {
                    parsedData = response.data.data
                }

                if (parsedData.Success === "True" && parsedData["Success Description"]) {
                    const description = parsedData["Success Description"]
                    const formattedData = description.filter((row: any) => row.NET_QUANTITY !== "0")
                    setData(formattedData)
                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
                }
            } catch (error: any) {
                setError(error.message || "An unknown error occurred while fetching data.")
            } finally {
                setLoading(false)
            }
        }

        fetchGlobalPortFolio()
    }, [])

    const filteredData = useMemo(() => {
        return data?.map(row => {
            if (row.NET_QUANTITY < 0) {
                return {
                    ...row,
                    NET_AMOUNT: 0,
                    CLOSING_PRICE: 0,
                    NOT_PROFIT: 0
                };
            }
            return row;
        });
    }, [data]);

    const { totalInvestedAmount, totalCurrentAmount, totalOverallPL } = useMemo(() => {
        if (!filteredData) return { totalInvestedAmount: 0, totalCurrentAmount: 0, totalOverallPL: 0 }

        return filteredData.reduce(
            (acc, row) => {
                acc.totalInvestedAmount += Math.abs(Number(row.NET_AMOUNT)) || 0
                acc.totalCurrentAmount += Number(row.CLOSING_PRICE) * Number(row.NET_QUANTITY) || 0
                acc.totalOverallPL += Number(row.NOT_PROFIT) || 0
                return acc
            },
            { totalInvestedAmount: 0, totalCurrentAmount: 0, totalOverallPL: 0 },
        )
    }, [filteredData])

    const calculatedPer = useMemo(() => {
        return totalInvestedAmount !== 0 ? (totalOverallPL / totalInvestedAmount) * 100 : 0;
    }, [totalInvestedAmount, totalOverallPL]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        }).format(Math.abs(amount))
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-semibold">Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="px-2 py-8 pt-0">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="m-0">
                                    <CardContent className="flex items-center space-x-4 pt-6">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex md:gap-0 sm:flex-row gap-4 md:flex-col items-center justify-center">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="m-0">
                                <CardContent className="flex items-center space-x-4 pt-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Wallet className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex md:gap-0 sm:flex-row gap-4 md:flex-col items-center justify-center">
                                        <p className="text-sm font-medium text-muted-foreground">Invested Amount</p>
                                        <p className="text-lg font-bold">
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={formatCurrency(totalInvestedAmount)}
                                            />
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="m-0">
                                <CardContent className="flex items-center space-x-4 pt-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <IndianRupee className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div className="flex md:gap-0 sm:flex-row gap-4 md:flex-col items-center justify-center">
                                        <p className="text-sm font-medium text-muted-foreground">Current Amount</p>
                                        <p className="text-lg font-bold">
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={formatCurrency(totalCurrentAmount)}
                                            />
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="m-0">
                                <CardContent className="flex items-center space-x-4 pt-4">
                                    <div
                                        className={`w-8 h-8 rounded-full ${totalOverallPL >= 0 ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}
                                    >
                                        <TrendingUp className={`h-5 w-5 ${totalOverallPL >= 0 ? "text-green-500" : "text-red-500"}`} />
                                    </div>
                                    <div className="flex md:gap-0 sm:flex-row gap-4 md:flex-col items-center justify-center">
                                        <p className="text-sm font-medium text-muted-foreground">Overall {totalOverallPL >= 0 ? "Profit" : "Loss"} <span className="text-xs font-[600]">({calculatedPer.toFixed(2)}%)</span></p>
                                        <p className={`text-lg font-bold ${totalOverallPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={formatCurrency(totalOverallPL)}
                                            />
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {loading ? (
                        <DataTableSkeleton columns={4} rows={10} />
                    ) : error ? (
                        // <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                        <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <FileX className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No Data found</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">There are no Portfolio records available.</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md ">
                                <DataTableArray
                                    columns={columns}
                                    data={filteredData || []}
                                // includeFileData={true}
                                // showAllRows={true}
                                // showPagination={false}
                                // downloadFileName="Portfolio"
                                // moreDetails={{
                                //     "Overall Profit": totalOverallPL,
                                //     "Invested Amount": totalInvestedAmount,
                                //     "Current Amount": totalCurrentAmount,
                                // }}

                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

