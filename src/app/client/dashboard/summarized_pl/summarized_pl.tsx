/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { lazy, useEffect, useState, useMemo } from "react"
import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { columns, hiddenColumns } from "@/components/Dashboard/AnnualPL_Summary/columns"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"

import { annualPLSummary } from "@/api/auth"

import { toast } from "sonner"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import ExpensesDisplay from "@/components/Dashboard/ReusableComponents/ExpensesDisplays"
import TotalDataSummary from "@/components/Dashboard/ReusableComponents/TotalDataSummary"

import dynamic from "next/dynamic"
import { SummarizedPLForm } from "./summarized-pl-form"
const DatatableNet = dynamic(() => import("@/components/DataTableNet"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

const LazyDataTable = lazy(() => import("@/components/DataTable").then((module) => ({ default: module.DataTable })))

export default function SummarizedPL() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[]>([])
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [expensesData, setExpensesData] = useState([])

    /// Helper to generate financial years
    const getFinancialYears = () => {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const startYear = currentMonth < 3 ? currentYear - 1 : currentYear

        return Array.from({ length: 5 }, (_, index) => {
            const year = startYear - index
            return {
                label: `${year}-${year + 1}`,
                value: `${year}-${year + 1}`,
                fromDate: format(new Date(year, 3, 1), "dd/MM/yyyy"),
                toDate: format(new Date(year + 1, 2, 31), "dd/MM/yyyy"),
            }
        })
    }

    // Memoize financial years to prevent unnecessary recalculations
    const financialYears = useMemo(() => getFinancialYears(), [])

    // Add state to track the selected dates
    const [selectedDates, setSelectedDates] = useState({
        financialYear: financialYears[0]?.value || "",
        fromDate: financialYears[0]?.fromDate || "",
        toDate: financialYears[0]?.toDate || "",
    })

    // Fetch Annual PL Data
    const fetchAnnualPLData = async (fromDate: string, toDate: string) => {
        setLoading(true)
        setError(null)
        try {
            // Update the selected dates state
            setSelectedDates({
                financialYear: financialYears.find((fy) => fy.fromDate === fromDate)?.value || "",
                fromDate,
                toDate,
            })

            const response = await annualPLSummary({ fromDate, toDate })
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData.Success === "True") {
                toast.success("Data fetched successfully!")
                const description = parsedData["Success Description"]
                const expensesRows = description.filter((row) => row.TR_TYPE === "EXPENSES")
                const nonExpensesRows = description.filter((row) => row.TR_TYPE !== "EXPENSES")
                setExpensesData(expensesRows)
                setData(nonExpensesRows)
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const { fromDate, toDate } = financialYears[0]
        fetchAnnualPLData(fromDate, toDate)
    }, [])

    // Normalize TR_TYPE values
    const normalizedData = data.map((row: any) => ({
        ...row,
        TR_TYPE: ["LONGTERM", "OP LONGTERM"].includes(row.TR_TYPE)
            ? "LONGTERM"
            : ["SHORTTERM", "OP_SHORTTERM"].includes(row.TR_TYPE)
                ? "SHORTTERM"
                : row.TR_TYPE,
    }))

    // Group data by TR_TYPE
    const groupedData = normalizedData.reduce((acc: Record<string, { rows: any[]; sum: number }>, row: any) => {
        const key = row.TR_TYPE
        if (!acc[key]) acc[key] = { rows: [], sum: 0 }
        acc[key].rows.push(row)
        if (key === "LIABILITIES") {
            acc[key].sum += Number.parseFloat(row.SALE_AMT?.toString() || "0")
        } else {
            acc[key].sum += Number.parseFloat(row.PL_AMT?.toString() || "0")
        }
        return acc
    }, {})

    // Ensure `OP_ASSETS` is always first and `ASSETS` is always second
    const sortedGroupedData = Object.entries(groupedData)
        .sort(([keyA], [keyB]) => {
            if (keyA === "OP_ASSETS") return -1 // `OP_ASSETS` is always first
            if (keyB === "OP_ASSETS") return 1 // Push other keys below `OP_ASSETS`
            if (keyA === "ASSETS") return -1 // `ASSETS` is second
            if (keyB === "ASSETS") return 1 // Push other keys below `ASSETS`
            return 0 // Keep the rest in their original order
        })
        .reduce(
            (acc, [key, value]) => {
                acc[key] = value
                return acc
            },
            {} as Record<string, { rows: any[]; sum: number }>,
        )

    const cleanSymbol = (symbol: string) => symbol?.replace(/^\*|\*$/g, "")
    const processedExpensesData = (() => {
        const mergedData: Record<string, { SCRIP_SYMBOL: string; PL_AMT: number }> = {}

        // Merge CGST and SGST into GST and calculate totals
        expensesData.forEach((expense: any) => {
            const { SCRIP_SYMBOL, PL_AMT } = expense
            const cleanedName = cleanSymbol(SCRIP_SYMBOL) // Apply cleanSymbol to SCRIP_SYMBOL
            const key = cleanedName === "CGST" || cleanedName === "SGST" ? "GST" : cleanedName

            if (!mergedData[key]) {
                mergedData[key] = { SCRIP_SYMBOL: key, PL_AMT: 0 }
            }
            mergedData[key].PL_AMT += Number(PL_AMT)
        })

        // Convert the merged data back into an array
        const mergedArray = Object.values(mergedData)

        // Sort the array by the desired order: STT, STAMP DUTY, GST, followed by others
        const order = ["STT", "STAMP DUTY", "GST"]
        return mergedArray.sort((a, b) => {
            const indexA = order.indexOf(a.SCRIP_SYMBOL)
            const indexB = order.indexOf(b.SCRIP_SYMBOL)
            if (indexA !== -1 && indexB !== -1) return indexA - indexB // Both are in the predefined order
            if (indexA !== -1) return -1 // A is in the predefined order
            if (indexB !== -1) return 1 // B is in the predefined order
            return 0 // Keep the original order for others
        })
    })()

    const totalexpenses = expensesData?.reduce(
        (total: number, expense: any) => total + Number.parseFloat(expense.PL_AMT?.toString() || "0"),
        0,
    )

    const handleTypeClick = (type: string) => {
        const element = document.getElementById(type)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    const totalUnrealized = Object.entries(sortedGroupedData)
        .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
        .reduce((acc, [, { sum }]) => acc + sum, 0)

    const totalRealized =
        Object.entries(sortedGroupedData)
            .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
            .reduce((acc, [, { sum }]) => acc + sum, 0) - Math.abs(Number(totalexpenses))

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-col sm:flex-col mb-4">
                            <div className="flex-1">
                                <CardTitle>Summarized P&L Equity</CardTitle>
                            </div>
                            <div className="flex-shrink-0 m-0">
                                {/* Separated form component */}
                                <SummarizedPLForm financialYears={financialYears} onSubmit={fetchAnnualPLData} loading={loading} />
                            </div>
                        </CardHeader>

                        <CardContent>
                            {(Object.keys(sortedGroupedData).length > 0 || processedExpensesData.length > 0) && !error && (
                                <TotalDataSummary
                                    sortedGroupedData={sortedGroupedData}
                                    processedExpensesData={processedExpensesData.reduce(
                                        (acc, expense) => {
                                            acc[expense.SCRIP_SYMBOL] = {
                                                rows: [expense],
                                                sum: expense.PL_AMT,
                                            }
                                            return acc
                                        },
                                        {} as Record<string, { rows: any[]; sum: number }>,
                                    )}
                                    totalExpenses={totalexpenses}
                                    handleTypeClick={handleTypeClick}
                                />
                            )}

                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                            ) : (
                                <DatatableNet
                                    columns={columns}
                                    data={sortedGroupedData}
                                    hiddenColumns={hiddenColumns}
                                    filterColumn="scrip_name1"
                                    filterPlaceholder="Filter Scrip..."
                                    includeFileData={true}
                                    showAllRows={true}
                                    year={selectedDates.financialYear}
                                    fromDate={selectedDates.fromDate}
                                    toDate={selectedDates.toDate}
                                    totalDataSummary={{
                                        unrealized: Object.entries(sortedGroupedData)
                                            .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
                                            .reduce((acc, [, { sum }]) => acc + sum, 0),
                                        realized:
                                            Object.entries(sortedGroupedData)
                                                .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
                                                .reduce((acc, [, { sum }]) => acc + sum, 0) - Math.abs(Number(totalexpenses)),
                                        liabilities: sortedGroupedData["LIABILITIES"]?.sum || 0,
                                    }}
                                    expensesData={{
                                        rowKey: "SCRIP_SYMBOL",
                                        rowAmount: "PL_AMT",
                                        rows: processedExpensesData,
                                        total: totalexpenses,
                                    }}
                                    showPagination={false}
                                    downloadFileName={"Summarized_P&L_Equity"}
                                    columnsWithTotals={["BUY_QTY", "BUY_AMT", "SALE_QTY", "SALE_AMT", "NET_QTY", "CURR_AMOUNT", "PL_AMT"]}
                                />
                            )}

                            <ExpensesDisplay
                                processedExpensesData={processedExpensesData}
                                totalExpenses={totalexpenses}
                                expenseRowKey={"SCRIP_SYMBOL"}
                                expenseRowAmount={"PL_AMT"}
                            />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}
