"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/DataTable"
import { columns } from "./columns"
import { getHoldingMismatch } from "@/lib/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { AddPortfolioDialog } from "../ReusableComponents/AddPortfolioDialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import dynamic from "next/dynamic"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface RowData {
    tradeDate: string;
    scripName: string;
    scrip: string;
    isin: string;
    buySell: string;
    narration: string;
    quantity: number;
    rate: string;
    holdingQuantity: number;
    globalQuantity: number;
    fromEquity?: boolean; // Optional property to handle fromEquity prop
}

export default function HoldingMismatch() {
    const [data, setData] = useState<[]>([])
    const [loading, setLoading] = useState(true)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isFromCardHeader, setIsFromCardHeader] = useState(false)
    const modalRef = useRef(null)

    const [selectedRow, setSelectedRow] = useState<RowData | null>(null)

    const handleAddPortfolio = useCallback((rowData: any, fromCardHeader = false) => {
        console.log(rowData);
        setSelectedRow({
            tradeDate: "",
            scripName: rowData?.scripName,
            scrip: rowData?.scripSymbol,
            isin: rowData?.isin,
            buySell: "B",
            narration: "",
            quantity: 0,
            rate: "",
            holdingQuantity: rowData?.holdingQuantity,
            globalQuantity: rowData?.globalQuantity,
            fromEquity: false,
        })
        setIsFromCardHeader(fromCardHeader)
        setIsDialogOpen(true)
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await getHoldingMismatch()
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }

                const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

                if (parsedData) {
                    setData(parsedData)
                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch Holdings data.")
                }
            } catch (error: any) {
                setError(error.message || "An error occurred while fetching data.")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        if (actionType === "action") {
            handleAddPortfolio(row)
        }
    }, [handleAddPortfolio])

    const columnsWithAction = columns
        .filter((column) => column.id !== "actions")
        .concat({
            id: "actions",
            accessorKey: "",
            header: "Actions",
            cell: ({ row }: { row: any }) => {
                return (
                    <Button variant="ghost" size="icon" className="action-btn" data-action="action">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add to Portfolio</span>
                    </Button>
                )
            },
        })

    return (
        <>
            {/* <DashboardLayout>
                <div className="space-y-4"> */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Holding Mismatch</CardTitle>
                    <Button variant="ghost" onClick={() => handleAddPortfolio({
                        tradeDate: "",
                        scripName: "",
                        scrip: "",
                        isin: "",
                        buySell: "B",
                        narration: "",
                        quantity: 0,
                        rate: "",
                        holdingQuantity: "",
                        globalQuantity: "",
                        fromEquity: false,
                    }, true)}>
                        <PlusCircle className="h-4 w-4" />
                        Add to Portfolio
                    </Button>

                </CardHeader>
                <CardContent>
                    {loading ? (
                        <DataTableSkeleton columns={4} rows={10} />
                    ) : error ? (
                        <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                    ) : (
                        <DataTableArray columns={columnsWithAction} data={data} showAllRows={true}
                            getActionButtonDetails={getActionButtonDetails} viewColumns={false} downloadExcel={false}
                        />
                    )}
                </CardContent>
            </Card>
            {/* </div>
            </DashboardLayout> */}

            <AddPortfolioDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} rowData={selectedRow} isFromCardHeader={isFromCardHeader} />

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

