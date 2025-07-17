/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useCallback, useEffect, useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { annualPL } from "@/api/auth"
import { toast } from "sonner"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import ExpensesDisplay from "@/components/Dashboard/ReusableComponents/ExpensesDisplays"
import TotalDataSummary from "@/components/Dashboard/ReusableComponents/TotalDataSummary"
import { AddPortfolioDialog } from "@/components/Dashboard/ReusableComponents/AddPortfolioDialog"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { ITReportForm } from "./it-report-form"
import { ITReportTable } from "./it-report-table"
import { format } from "date-fns"

interface RowData {
    tradeDate: string
    scripName: string
    scrip: string
    isin: string
    buySell: string
    narration: string
    quantity: number
    rate: string
    fromEquity?: boolean
}

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

export default function ITReportEquity() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[]>([])
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [expensesData, setExpensesData] = useState([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null)
    const tableRef = useRef<any>(null)

    // Get financial years once
    const financialYears = useMemo(() => getFinancialYears(), [])

    // Add state to track the selected dates
    const [selectedDates, setSelectedDates] = useState({
        financialYear: financialYears[0]?.value || "",
        fromDate: financialYears[0]?.fromDate || "",
        toDate: financialYears[0]?.toDate || "",
    })

    // Fetch Annual PL Data
    const fetchAnnualPLData = useCallback(async (fromDate: string, toDate: string) => {
        setError(null)
        setLoading(true)
        try {
            const response = await annualPL({ fromDate, toDate })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
            if (parsedData.Success === "True") {
                toast.success("Data fetched successfully!")
                const description = parsedData["Success Description"]
                const expensesRows = description.filter((row: { TR_TYPE: string }) => row.TR_TYPE === "Expenses")
                const nonExpensesRows = description.filter((row: { TR_TYPE: string }) => row.TR_TYPE !== "Expenses")
                setExpensesData(expensesRows)
                setData(nonExpensesRows)
                // Update the selected dates state
                setSelectedDates({
                    financialYear: financialYears.find((fy) => fy.fromDate === fromDate)?.value || "",
                    fromDate,
                    toDate,
                })
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred.")
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial data fetch
    useEffect(() => {
        if (financialYears.length > 0) {
            const { fromDate, toDate } = financialYears[0]
            fetchAnnualPLData(fromDate, toDate)
        }

    }, []) // Empty dependency array to run only once on mount

    const handleAddPortfolio = useCallback((rowData: any) => {
        console.log(rowData);
        if (rowData?.scrip_name) {
            const scripNameParts = rowData.scrip_name.split("-")
            const isinValue = scripNameParts[0].trim()

            setSelectedRow({
                tradeDate: "",
                scripName: rowData.scrip_name1,
                scrip: rowData.SCRIP_SYMBOL,
                isin: isinValue,
                buySell: "B",
                narration: "",
                quantity: rowData.SALE_QTY,
                rate: "",
                fromEquity: true,
            })
            setIsDialogOpen(true)
        }
    }, [])

    const handleTypeClick = (type: string) => {
        setTimeout(() => {
            if (type === "expenses") {
                const element = document.getElementById(type);

                if (!element) {
                    console.error(`Element with id '${type}' not found.`);
                    return;
                }

                try {
                    element.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                } catch (error) {
                    console.warn("scrollIntoView failed, using fallback scrolling", error);

                    const rect = element.getBoundingClientRect();
                    window.scrollTo({
                        top: window.scrollY + rect.top - 50, // Adjust offset as needed
                        behavior: "smooth"
                    });
                }
            } else {
                scrollToCategoryRow(type);
            }
        }, 100);
    }

    const scrollToCategoryRow = (categoryId: string) => {
        if (!tableRef.current) return;

        const api = tableRef.current; // ✅ Directly use the DataTable API

        // Find the first matching row index with category
        const rowIndex = api
            .rows()
            .indexes()
            .toArray()
            .find((idx: number) => {
                const rowData = api.row(idx).data();
                return rowData?.category === categoryId;
            });

        if (rowIndex === undefined) {
            console.warn("Category row not found");
            return;
        }

        // Scroll to the row using DataTables Scroller plugin
        api.scroller.toPosition(rowIndex, false); // false = don't redraw

        // Fallback + ensure DOM renders the category row
        setTimeout(() => {
            const rowEl = document.getElementById(categoryId);
            if (rowEl) {
                rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                let retryCount = 0;
                const tryScroll = () => {
                    const el = document.getElementById(categoryId);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else if (retryCount < 5) {
                        retryCount++;
                        setTimeout(tryScroll, 150);
                    }
                };
                tryScroll();
            }
        }, 250);
    };


    // Normalize and process data for the table component
    const processData = useCallback(() => {
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

        return sortedGroupedData
    }, [data])

    // Process expenses data
    const processExpensesData = useCallback(() => {
        const totalexpenses = expensesData?.reduce(
            (total: number, expense: any) => total + Number.parseFloat(expense.PL_AMT?.toString() || "0"),
            0,
        )

        const cleanSymbol = (symbol: string) => symbol.replace(/^\*|\*$/g, "")
        const mergedData: Record<string, { BUY_COMPANY_CODE: string; PL_AMT: number }> = {}

        // Merge CGST and SGST into GST and calculate totals
        expensesData.forEach((expense: any) => {
            const { BUY_COMPANY_CODE, PL_AMT } = expense
            const cleanedName = cleanSymbol(BUY_COMPANY_CODE)
            const key = cleanedName === "CGST" || cleanedName === "SGST" ? "GST" : cleanedName

            if (!mergedData[key]) {
                mergedData[key] = { BUY_COMPANY_CODE: key, PL_AMT: 0 }
            }
            mergedData[key].PL_AMT += Math.abs(Number(PL_AMT))
        })

        // Convert the merged data back into an array
        const mergedArray = Object.values(mergedData)

        // Sort the array by the desired order: STT, STAMP DUTY, GST, followed by others
        const order = ["STT", "STAMP DUTY", "GST"]
        const processed = mergedArray.sort((a, b) => {
            const indexA = order.indexOf(a.BUY_COMPANY_CODE)
            const indexB = order.indexOf(b.BUY_COMPANY_CODE)
            if (indexA !== -1 && indexB !== -1) return indexA - indexB // Both are in the predefined order
            if (indexA !== -1) return -1 // A is in the predefined order
            if (indexB !== -1) return 1 // B is in the predefined order
            return 0 // Keep the original order for others
        })

        return { processedExpensesData: processed, totalExpenses: totalexpenses }
    }, [expensesData])

    const sortedGroupedData = processData()
    const { processedExpensesData, totalExpenses } = processExpensesData()

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-col sm:flex-col mb-4">
                            <div className="flex-1">
                                <CardTitle>IT Report Equity</CardTitle>
                            </div>
                            <div className="flex-shrink-0 m-0">
                                {/* Form component - separated to prevent re-renders */}
                                <ITReportForm financialYears={financialYears} onSubmit={fetchAnnualPLData} loading={loading} />
                            </div>
                        </CardHeader>

                        <CardContent>
                            {(Object.keys(sortedGroupedData).length > 0 || processedExpensesData.length > 0) && !error && (
                                <TotalDataSummary
                                    sortedGroupedData={sortedGroupedData}
                                    processedExpensesData={processedExpensesData.reduce(
                                        (acc, expense) => {
                                            acc[expense.BUY_COMPANY_CODE] = {
                                                rows: [expense],
                                                sum: expense.PL_AMT,
                                            }
                                            return acc
                                        },
                                        {} as Record<string, { rows: any[]; sum: number }>,
                                    )}
                                    totalExpenses={totalExpenses}
                                    handleTypeClick={handleTypeClick}
                                />
                            )}

                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                <h3 className="text-center text-red-500">{error}</h3>
                            ) : (
                                <ITReportTable
                                    sortedGroupedData={sortedGroupedData}
                                    processedExpensesData={processedExpensesData}
                                    totalExpenses={totalExpenses}
                                    onAddPortfolio={handleAddPortfolio}
                                    financialYear={selectedDates.financialYear}
                                    fromDate={selectedDates.fromDate}
                                    toDate={selectedDates.toDate}
                                    ref={tableRef}
                                />
                            )}

                            <ExpensesDisplay
                                processedExpensesData={processedExpensesData}
                                totalExpenses={totalExpenses}
                                expenseRowKey={"BUY_COMPANY_CODE"}
                                expenseRowAmount={"PL_AMT"}
                            />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            <AddPortfolioDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                rowData={selectedRow}
                isFromCardHeader={false}
            />

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}
