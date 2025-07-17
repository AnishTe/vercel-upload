/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { columns, selectedColumn } from "@/components/Dashboard/Holdings/columns"
import { DataTable } from "@/components/DataTable"
import DecryptedText from "@/components/ui/DecryptedText"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { format } from "date-fns"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { fetchHoldings } from "@/lib/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"

import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js"
ChartJS.register(ArcElement, Tooltip, Legend)

import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"

import DataTableSkeleton from "@/components/DataTable-Skeleton"
import HoldingMismatch from "@/components/Dashboard/HoldingMismatch/HoldingMismatch"
import { HoldingMismatchSkeleton } from "@/components/Dashboard/HoldingMismatch/HoldingMismatchSkeleton"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader, Search } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

export default function HoldingsPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [rowsTable, setRowsTable] = useState<any[]>([])
    const [totalValue, setTotalValue] = useState(0)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [isDarkTheme, setIsDarkTheme] = useState(false) // Added state variable
    const { theme, systemTheme } = useTheme()

    const getFinancialYears = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;

        return Array.from({ length: 5 }, (_, index) => {
            const year = startYear - index;
            return {
                label: `${year}-${year + 1}`,
                value: `${year}-${year + 1}`,
                fromDate: format(new Date(year, 3, 1), "dd/MM/yyyy"),
                toDate: format(new Date(year + 1, 2, 31), "dd/MM/yyyy"),
            };
        });
    };

    const financialYears = getFinancialYears();
    const todayFormatted = format(new Date(), "dd/MM/yyyy"); // Get today's date in required format

    // Validation Schema
    const formSchema = z.object({
        financialYear: z.object({
            fromDate: z.string(),
            toDate: z.string(),
            value: z.string(),
        }),
        toDate: z.string().nonempty("To Date is required"),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            financialYear: financialYears[0],
            toDate: todayFormatted, // ✅ Set today's date as default
        },
    });

    const { watch, setValue } = form;

    // Watch for financialYear changes and update toDate only if it wasn't manually changed
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "financialYear") {
                setValue("toDate", value.financialYear?.toDate || todayFormatted);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, financialYears, setValue]);

    const fetchHoldingsData = async (fromDate: string, toDate: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetchHoldings({ toDate })
            const isTokenValid = validateToken(response)

            if (!isTokenValid) {
                setShowSessionExpired(true)
                return
            }

            // Check if response.data and response.data.data exist
            if (response && response.data && response.data.data) {
                try {
                    // Parse the data as it's a string
                    const parsedData =
                        typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

                    // Check if Success is true and Success Description is available
                    if (parsedData.Success === "True" && parsedData["Success Description"]) {
                        const description = parsedData["Success Description"]
                        setRowsTable(description) // Set data directly from the first item
                    } else {
                        throw new Error(parsedData["Error Description"] || "Failed to fetch Holdings data.")
                    }
                } catch (parseError: any) {
                    setError("Error parsing data: " + parseError.message)
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        const { fromDate, toDate } = financialYears[0]
        fetchHoldingsData(fromDate, toDate)
    }, [])

    useEffect(() => {
        if (rowsTable.length > 0) {
            const total = Number.parseFloat(rowsTable[0]?.TOT_AMT || 0)
            if (!isNaN(total) && total !== totalValue) {
                setTotalValue(total)
            }
        }
    }, [rowsTable, totalValue])

    const calculatePieChartData = () => {
        if (!rowsTable || rowsTable.length === 0)
            return { top3: 0, remaining: 0, tail: 0, top3Rows: [], tailRows: [], remainingRows: [] }

        // Modify the rows to set invalid PERCENT_HOLD values to 0.00
        const updatedRows = rowsTable.map((row: any) => ({
            ...row,
            PERCENT_HOLD:
                !row.PERCENT_HOLD || isNaN(Number.parseFloat(row.PERCENT_HOLD)) ? 0.0 : Number.parseFloat(row.PERCENT_HOLD),
        }))

        // Sort rows in descending order by PERCENT_HOLD
        const sortedRows = [...updatedRows].sort((a, b) => b.PERCENT_HOLD - a.PERCENT_HOLD)

        // Get top 3 holdings
        const top3Rows = sortedRows.slice(0, 3)
        const top3 = top3Rows.reduce((sum, row) => sum + Number.parseFloat(row.PERCENT_HOLD), 0)

        // Define the threshold for the tail (adjustable based on your requirements)
        const TAIL_THRESHOLD = 1.0

        // Get tail holdings (PERCENT_HOLD <= TAIL_THRESHOLD)
        const tailRows = sortedRows.filter((row) => Number.parseFloat(row.PERCENT_HOLD) <= TAIL_THRESHOLD)
        const tail = tailRows.reduce((sum, row) => sum + Number.parseFloat(row.PERCENT_HOLD), 0)

        // Get remaining holdings
        const remainingRows = sortedRows.filter(
            (row) =>
                !top3Rows.includes(row) && !tailRows.includes(row) && Number.parseFloat(row.PERCENT_HOLD) > TAIL_THRESHOLD,
        )
        const remaining = remainingRows.reduce((sum, row) => sum + Number.parseFloat(row.PERCENT_HOLD), 0)

        return { top3, remaining, tail, top3Rows, tailRows, remainingRows }
    }

    const { top3, remaining, tail, top3Rows, tailRows, remainingRows } = calculatePieChartData()

    const calculateStockWisePieChartData = () => {
        if (!rowsTable || rowsTable.length === 0) return { labels: [], data: [], colors: [] }

        // Ensure consistent formatting for PERCENT_HOLD
        const formatPercentHold = (value: string | number | null | undefined) => {
            if (value === null || value === undefined) {
                return 0 // Return a default value when null or undefined
            }

            const parsedValue = typeof value === "string" ? Number.parseFloat(value) : value

            return isNaN(parsedValue) ? 0 : Number.parseFloat(parsedValue.toFixed(2))
        }

        const updatedRows = rowsTable.map((row: any) => ({
            ...row,
            PERCENT_HOLD: formatPercentHold(row.PERCENT_HOLD),
        }))

        const sortedRows = [...updatedRows].sort(
            (a, b) => formatPercentHold(b.PERCENT_HOLD) - formatPercentHold(a.PERCENT_HOLD),
        )

        const TAIL_THRESHOLD = 1.0

        // Separate rows into "Other" (tail stocks) and "Remaining" stocks
        const tailRows = sortedRows.filter((row) => {
            const percentHold = formatPercentHold(row.PERCENT_HOLD)
            return percentHold <= TAIL_THRESHOLD // Ensure numeric comparison
        })
        const other = tailRows.reduce((sum, row) => sum + formatPercentHold(row.PERCENT_HOLD), 0)

        const remainingRows = sortedRows.filter((row) => {
            const percentHold = formatPercentHold(row.PERCENT_HOLD)
            return percentHold > TAIL_THRESHOLD // Ensure numeric comparison
        })

        // Predefined colors for consistency, extended to avoid duplication
        const predefinedColors = [
            "#36A2EB",
            "#FF6384",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#C9CBCF",
            "#8A2BE2",
            "#ADFF2F",
            "#FF4500",
            "#FFD700",
        ]

        // Generate labels, data, and unique colors for the pie chart
        const labels = remainingRows.map((row) => row.SCRIP_NAME || "Unnamed Stock") // Default label if SCRIP_NAME is missing
        const data = remainingRows.map((row) => formatPercentHold(row.PERCENT_HOLD)) // Data for remaining stocks

        const colors = remainingRows.map((_, index) => {
            return predefinedColors[index % predefinedColors.length]
        })

        if (other > 0) {
            labels.push("Tail Stocks")
            data.push(formatPercentHold(other))
            colors.push("#FF0000") // Fixed color for "Other" (distinct from predefined colors)
        }

        return { labels, data, colors }
    }

    // Get data for the second pie chart
    const { labels, data, colors } = calculateStockWisePieChartData()

    const getChartOptions = useCallback((isStockWise = false): ChartOptions<'pie'> => {
        const currentTheme = theme === 'system' ? systemTheme : theme
        const textColor = currentTheme === 'dark' ? '#ffffff' : '#333333'

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: isStockWise ? 'left' : 'top',
                    align: isStockWise ? 'center' : 'start',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                        },
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.toFixed(2)
                            if (isStockWise) {
                                const amount = rowsTable.find((row) => row.SCRIP_NAME === context.label)?.AMOUNT || 0
                                const formattedAmount = new Intl.NumberFormat("en-IN", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                }).format(Number(amount))
                                return `${context.label}: ${value}% (₹${formattedAmount})`
                            }
                            return `${context.label}: ${value}%`
                        },
                    },
                },
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index
                    let selectedData
                    if (isStockWise) {
                        const clickedLabel = labels[index]
                        selectedData = clickedLabel === "Tail Stocks" ? tailRows : rowsTable.filter((row) => row.SCRIP_NAME === clickedLabel)
                    } else {
                        const dataCategory = ["top3Rows", "remainingRows", "tailRows"][index]
                        selectedData = { top3Rows, remainingRows, tailRows }[dataCategory] || []
                    }
                    setSelectedRows(selectedData)
                    setModalOpen(true)
                }
            },
        }
    }, [theme, systemTheme, rowsTable, labels, tailRows, top3Rows, remainingRows]) // Added theme and systemTheme dependencies

    const pieData = {
        labels: ["Top 3 Holdings", "Remaining", "Tail Holdings"],
        datasets: [
            {
                data: [top3, remaining, tail],
                backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
                hoverOffset: 4,
            },
        ],
    }

    const stockWisePieData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: colors,
                hoverOffset: 4,
            },
        ],
    }

    useEffect(() => {
        const charts = ChartJS.instances
        Object.values(charts).forEach((chart) => {
            if (chart.options.plugins?.legend?.labels) {
                const newOptions = getChartOptions((chart.data.labels?.length ?? 0) > 3)
                chart.options = { ...chart.options, ...newOptions }
                chart.update("none")
            }
        })
    }, [getChartOptions])

    // Theme detection effect
    useEffect(() => {
        // Initial theme detection
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains("dark")
            setIsDarkTheme(isDark)
        }

        checkTheme()

        // Set up a MutationObserver to watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class" && mutation.target === document.documentElement) {
                    checkTheme()
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })

        return () => observer.disconnect()
    }, [])

    const onSubmit = (formData: z.infer<typeof formSchema>) => {
        const { financialYear, toDate } = formData
        fetchHoldingsData(financialYear.fromDate, toDate)
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>

                        <CardHeader className="flex flex-col md:flex-col sm:flex-col  mb-4">
                            <div className="flex-1">
                                <CardTitle>Holdings</CardTitle>
                            </div>
                            <div className="flex-shrink-0 m-0">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3">
                                        <FormField
                                            control={form.control}
                                            name="financialYear"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem className="w-[200px]">
                                                        <Select
                                                            name="financialYear"
                                                            onValueChange={(value) => {
                                                                // Find the selected year based on value
                                                                const selectedYear = financialYears.find((fy) => fy.value === value)
                                                                field.onChange(selectedYear) // Pass the selected year object to form
                                                            }}
                                                            defaultValue={field.value?.value || ""} // Use the 'value' property of the object
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select year" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {financialYears.map((fy) => (
                                                                    <SelectItem key={fy.value} value={fy.value}>
                                                                        {fy.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )
                                            }}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="toDate"
                                            render={({ field }) => (
                                                <FormItem className="w-[150px]">
                                                    <FormControl>
                                                        <Input
                                                            name="date"
                                                            type="date"
                                                            className="flex h-10 w-full rounded-md border text-white bg-transparent px-3 py-2 text-sm "
                                                            value={format(new Date(field.value.split("/").reverse().join("-")), "yyyy-MM-dd")}
                                                            min={format(
                                                                new Date(form.watch("financialYear").fromDate.split("/").reverse().join("-")),
                                                                "yyyy-MM-dd",
                                                            )}
                                                            max={format(
                                                                new Date(form.watch("financialYear").toDate.split("/").reverse().join("-")),
                                                                "yyyy-MM-dd",
                                                            )}
                                                            onChange={(e) => {
                                                                const date = new Date(e.target.value)
                                                                field.onChange(format(date, "dd/MM/yyyy"))
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button name="submit" type="submit" disabled={loading}>
                                            {loading ? <Loader /> : <Search className="h-5 w-5" />}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ) : error ? (
                                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                            ) : (
                                <>
                                    <div className="flex justify-end items-center gap-2">
                                        <div className="flex gap-1 items-center">
                                            <h3 className="text-lg font-semibold">Total Value:</h3>
                                        </div>
                                        <p className={`font-semibold flex flex-wrap gap-2 justify-end `}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(Math.abs(totalValue))}
                                            />
                                        </p>
                                    </div>
                                    {/* <DataTable columns={columns} data={rowsTable} showAllRows={true} /> */}
                                    <DataTableArray
                                        columns={columns}
                                        data={rowsTable}
                                        includeFileData={true}
                                        showPagination={false}
                                        moreDetails={{
                                            "Total Value": {
                                                rowKey: "",
                                                rowAmount: "",
                                                rows: [],
                                                total: totalValue, // Ensure it's a number
                                            },
                                        }}
                                    />

                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Holdings Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Holdings Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-[350px] w-full md:h-[400px]" />
                                ) : (
                                    <div className="relative h-[350px] w-full md:h-[400px]">
                                        <Pie data={pieData} options={getChartOptions()} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stock-Wise Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock-wise Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-[350px] w-full md:h-[400px]" />
                                ) : (
                                    <div className="relative h-[350px] w-full md:h-[450px]">
                                        <Pie data={stockWisePieData} options={getChartOptions(true)} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="my-8">
                    <Suspense fallback={<HoldingMismatchSkeleton />}>
                        <HoldingMismatch />
                    </Suspense>
                </div>
            </DashboardLayout>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[750px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Holdings Chart Data</DialogTitle>
                        <DialogDescription>Holdings Chart data that are available in selected section.</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                        <DataTableArray columns={selectedColumn} data={selectedRows} showAllRows={true} />
                    </div>
                </DialogContent>
            </Dialog>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}