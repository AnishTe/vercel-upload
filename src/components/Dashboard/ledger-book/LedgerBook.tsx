/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, FileX, Loader, Search, X } from "lucide-react"
import { format, parse } from "date-fns"
import { useForm } from "react-hook-form"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { columns, type LedgerBookEntry, selectedColumns } from "@/components/Dashboard/ledger-book/columns"
import { Skeleton } from "@/components/ui/skeleton"
import DecryptedText from "@/components/ui/DecryptedText"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import { crSauda, ledgerBook } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { PopoverClose } from "@radix-ui/react-popover"

import dynamic from "next/dynamic"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface AmountRow {
    SCRIPDATACOL: any
    NOT_PROFIT: number
    company_code: string
    NET_AMOUNT: string | number
}
interface DataRow {
    COCD: any
    DR_AMT: any
    CR_AMT: any
    NARRATION: string
}
interface ExpenseRow {
    SCRIPDATACOL: string
    NET_AMOUNT: string | number // Assuming NET_AMOUNT can be string or number based on your data
}
interface ProcessedRow {
    label: string
    amount: number
}

export default function LedgerBook() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [amountLoading, setAmountLoading] = useState(false)
    const [amountError, setAmountError] = useState<string | null>(null)
    const [amountData, setAmountData] = useState<AmountRow[]>([])
    const [rowsTable, setRowsTable] = useState<DataRow[]>([])
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [isToggleExpanded, setIsToggleExpanded] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [activeGroup, setActiveGroup] = useState<string>("group1")
    const [currentBillDetails, setCurrentBillDetails] = useState<{
        toDate: string
        mktType: string
        SETLNO: string
    } | null>(null)

    const handleAmountBillClick = useCallback(async (row: LedgerBookEntry) => {
        setAmountLoading(true)
        setModalOpen(true)
        setAmountData([])
        setAmountError(null)
        const formattedDate = format(new Date(row.original.BILL_DATE as string), "dd/MM/yyyy")

        // Store the current bill details for display in the dialog header
        setCurrentBillDetails({
            toDate: formattedDate,
            mktType: row.original.MKT_TYPE,
            SETLNO: row.original.SETTLEMENT_NO,
        })

        try {
            const response = await crSauda({
                toDate: formattedDate,
                mktType: row.original.MKT_TYPE,
                SETLNO: row.original.SETTLEMENT_NO,
            })

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                setAmountData(parsedData["Success Description"])
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch ledger data.")
            }
        } catch (error: any) {
            setAmountError(error.message || "An error occurred while fetching data.")
        } finally {
            setAmountLoading(false)
        }
    }, [])

    const tableRef = useRef<HTMLDivElement>(null)

    const getCurrentFinancialYear = useCallback(() => {
        const today = new Date()
        const currentYear = today.getUTCFullYear()
        const currentMonth = today.getUTCMonth()

        const fromDate = currentMonth < 3 ? new Date(currentYear - 1, 3, 1) : new Date(currentYear, 3, 1)

        const toDate = new Date(fromDate.getUTCFullYear() + 1, 2, 31)

        return {
            fromDate: format(fromDate, "yyyy-MM-dd"),
            toDate: format(toDate, "yyyy-MM-dd"),
        }
    }, [])

    const { fromDate, toDate } = getCurrentFinancialYear()

    const formSchema = z.object({
        fromDate: z.string().nonempty("From Date is required"),
        toDate: z.string().nonempty("To Date is required"),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fromDate,
            toDate,
        },
    })

    const fetchLedgerData = useCallback(async (fromDate: string, toDate: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await ledgerBook({
                fromDate: format(parse(fromDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy"),
                toDate: format(parse(toDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy"),
            })

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                setRowsTable(parsedData["Success Description"])
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch ledger data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLedgerData(fromDate, toDate)
    }, [fromDate, toDate, fetchLedgerData])

    const onSubmit = useCallback(
        (formData: z.infer<typeof formSchema>) => {
            fetchLedgerData(formData.fromDate, formData.toDate)
        },
        [fetchLedgerData],
    )

    // Separate rows based on NARRATION
    const amountExpensesRows = useMemo(() => {
        return amountData.filter((row) => row.company_code === "EXPENSES" || row.company_code === "BROKERAGE")
    }, [amountData])

    const order = ["STT", "STAMP DUTY", "GST"]

    const processedExpensesRows = useMemo(() => {
        const result: ProcessedRow[] = []

        // Helper object for group additions
        const groupedAmounts = {
            transactionCharges: 0,
            gst: 0,
        }

        amountExpensesRows.forEach((row: ExpenseRow) => {
            const netAmount = Number(row.NET_AMOUNT)

            switch (row.SCRIPDATACOL) {
                case "ACCOUNT732":
                    result.push({
                        label: "SEBI FEES",
                        amount: netAmount,
                    })
                    break

                case "BRK":
                    result.push({
                        label: "Brokerage",
                        amount: netAmount,
                    })
                    break

                case "DEF4NSE":
                case "DEF4BSE":
                    groupedAmounts.transactionCharges += netAmount
                    break

                case "CGST":
                case "SGST":
                    groupedAmounts.gst += netAmount
                    break

                default:
                    result.push({
                        label: row.SCRIPDATACOL,
                        amount: netAmount,
                    })
                    break
            }
        })

        // Add grouped amounts to the result
        if (groupedAmounts.transactionCharges) {
            result.push({
                label: "Transaction Charges",
                amount: groupedAmounts.transactionCharges,
            })
        }

        if (groupedAmounts.gst) {
            result.push({
                label: "GST",
                amount: groupedAmounts.gst,
            })
        }

        // Sort the result based on the predefined order
        const orderedResult = [
            ...result.filter((row) => order.includes(row.label)),
            ...result.filter((row) => !order.includes(row.label)),
        ]

        return orderedResult
    }, [amountExpensesRows, order])

    const filteredAmountRows = useMemo(() => {
        return amountData.filter((row) => row.company_code !== "EXPENSES" && row.company_code !== "BROKERAGE")
    }, [amountData])

    const handleGroupChange = (group: string) => {
        if (loading || activeGroup === group) return // Prevent unnecessary re-renders

        setLoading(true) // Show loading state for DataTable
        setActiveGroup(group) // Update active group

        setTimeout(() => {
            setLoading(false) // Simulate delay before updating table
        }, 500) // You can adjust timing based on API response time
    }

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        if (actionType === "modal") {
            handleAmountBillClick(row)
        }
    }, [])

    function calculateBalances(ledgerData: any[], activeGroup: string) {
        // Helper function to calculate opening balance
        const calculateOpeningBalance = (rows: any[]) => {
            return rows.reduce((total, row) => total + (row.CR_AMT - row.DR_AMT), 0)
        }

        // Helper function to calculate rows with balances
        const calculateRowsWithBalances = (filteredRows: any[], initialBalance: number) => {
            let currentOpeningBalance = initialBalance
            return filteredRows.map((row) => {
                const amount = row.CR_AMT - row.DR_AMT || 0
                const closingBalance = currentOpeningBalance + amount
                const updatedRow = {
                    ...row,
                    OpeningBalance: currentOpeningBalance,
                    Amount: amount,
                    ClosingBalance: closingBalance,
                }
                currentOpeningBalance = closingBalance
                return updatedRow
            })
        }

        // Group 1 calculations
        const openingBalanceRows = ledgerData.filter(
            (row) => row.NARRATION === "OPENING BALANCE" && row.COCD !== "ICL" && row.COCD !== "MTF",
        )
        const filteredRows = ledgerData.filter(
            (row) =>
                row.NARRATION !== "OPENING BALANCE" &&
                row.NARRATION !== "ASSOCIATE OPENING BALANCE" &&
                row.COCD !== "ICL" &&
                row.COCD !== "MTF",
        )
        const openingBalanceTotal = calculateOpeningBalance(openingBalanceRows)
        const initialOpeningBalance = openingBalanceTotal
        const rowsWithBalances = calculateRowsWithBalances(filteredRows, initialOpeningBalance)
        const finalClosingBalance =
            rowsWithBalances.length > 0 ? rowsWithBalances[rowsWithBalances.length - 1].ClosingBalance : openingBalanceTotal

        // MTF calculations
        const openingBalanceRowsMTF = ledgerData.filter(
            (row) => row.NARRATION === "OPENING BALANCE" && row.COCD === "MTF" && !row["ACCOUNTCODE"].endsWith("_F"),
        )
        const filteredMTF = ledgerData.filter(
            (row) =>
                row.COCD === "MTF" &&
                row.NARRATION !== "OPENING BALANCE" &&
                row.NARRATION !== "ASSOCIATE OPENING BALANCE" &&
                !row["ACCOUNTCODE"].endsWith("_F"),
        )
        const openingBalanceTotalMTF = calculateOpeningBalance(openingBalanceRowsMTF)
        const initialOpeningBalanceMTF = openingBalanceTotalMTF
        const rowsWithBalancesfilteredMTF = calculateRowsWithBalances(filteredMTF, initialOpeningBalanceMTF)
        const finalClosingBalanceMTF =
            rowsWithBalancesfilteredMTF.length > 0
                ? rowsWithBalancesfilteredMTF[rowsWithBalancesfilteredMTF.length - 1].ClosingBalance
                : openingBalanceTotalMTF

        // MTFF calculations
        const openingBalanceRowsMTFF = ledgerData.filter(
            (row) => row.NARRATION === "OPENING BALANCE" && row.COCD === "MTF" && row["ACCOUNTCODE"].endsWith("_F"),
        )
        const filteredMTFF = ledgerData.filter(
            (row) =>
                row.COCD === "MTF" &&
                row.NARRATION !== "OPENING BALANCE" &&
                row.NARRATION !== "ASSOCIATE OPENING BALANCE" &&
                row["ACCOUNTCODE"].endsWith("_F"),
        )
        const openingBalanceTotalMTFF = calculateOpeningBalance(openingBalanceRowsMTFF)
        const initialOpeningBalanceMTFF = openingBalanceTotalMTFF
        const rowsWithBalancesfilteredMTFF = calculateRowsWithBalances(filteredMTFF, initialOpeningBalanceMTFF)
        const finalClosingBalanceMTFF =
            rowsWithBalancesfilteredMTFF.length > 0
                ? rowsWithBalancesfilteredMTFF[rowsWithBalancesfilteredMTFF.length - 1].ClosingBalance
                : openingBalanceTotalMTFF

        return {
            openingBalanceTotal,
            finalClosingBalance,
            openingBalanceRows,
            rowsWithBalances,
            openingBalanceTotalMTF,
            finalClosingBalanceMTF,
            openingBalanceRowsMTF,
            rowsWithBalancesfilteredMTF,
            openingBalanceTotalMTFF,
            finalClosingBalanceMTFF,
            openingBalanceRowsMTFF,
            rowsWithBalancesfilteredMTFF,
            filteredMTF,
            filteredMTFF,
        }
    }

    const {
        openingBalanceTotal,
        finalClosingBalance,
        openingBalanceRows,
        rowsWithBalances,
        openingBalanceTotalMTF,
        finalClosingBalanceMTF,
        openingBalanceRowsMTF,
        rowsWithBalancesfilteredMTF,
        openingBalanceTotalMTFF,
        finalClosingBalanceMTFF,
        openingBalanceRowsMTFF,
        rowsWithBalancesfilteredMTFF,
        filteredMTF,
    } = useMemo(() => calculateBalances(rowsTable, activeGroup), [rowsTable, activeGroup])

    const totalExpenses = useMemo(() => {
        return modalOpen ? amountExpensesRows.reduce((acc, row) => acc + (Number(row.NOT_PROFIT) || 0), 0) : 0
    }, [modalOpen, amountExpensesRows])

    const totalAmountRowsNetAmount = useMemo(() => {
        return modalOpen
            ? filteredAmountRows.reduce(
                (acc: number, row: { NET_AMOUNT: any }) => acc + Number.parseFloat(row.NET_AMOUNT || 0),
                0,
            )
            : 0
    }, [modalOpen, filteredAmountRows])

    useEffect(() => {
        if (modalOpen && amountData.length === 0 && !amountLoading) {
            setAmountError("No data available for this bill.")
        } else {
            setAmountError(null)
        }
    }, [modalOpen, amountData, amountLoading])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-col sm:flex-col  mb-4 ">
                            <div className="flex-1">
                                <CardTitle>Ledger Book</CardTitle>
                            </div>
                            <div className="flex-shrink-0 m-0">
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="flex flex-row gap-2 sm:flex-row sm:gap-3 items-center w-full"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="fromDate"
                                            render={({ field }) => (
                                                <FormItem className="space-y-0">
                                                    <Label htmlFor="fromDate" className="sr-only">
                                                        From Date
                                                    </Label>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            id="fromDate"
                                                            className="h-10 w-[140px] rounded-md border text-white bg-transparent px-3 py-2 text-sm md:w-[150px] lg:w-full"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="toDate"
                                            render={({ field }) => (
                                                <FormItem className="space-y-0">
                                                    <Label htmlFor="toDate" className="sr-only">
                                                        To Date
                                                    </Label>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            id="toDate"
                                                            className="h-10 w-[140px] rounded-md border text-white bg-transparent px-3 py-2 text-sm md:w-[150px] lg:w-full"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button name="submit" type="submit" disabled={loading} className="sm:mt-0 w-[50%]">
                                            {loading ? <Loader className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-full" />
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        {filteredMTF.length > 0 && (
                                            <div className="flex items-center space-x-2 border rounded-lg p-1">
                                                <button
                                                    onClick={() => handleGroupChange("group1")}
                                                    disabled={loading}
                                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${activeGroup === "group1" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                                                >
                                                    Group1
                                                </button>
                                                <button
                                                    onClick={() => handleGroupChange("mtf")}
                                                    disabled={loading}
                                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${activeGroup === "mtf" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                                                >
                                                    MTF
                                                </button>
                                                <button
                                                    onClick={() => handleGroupChange("mtff")}
                                                    disabled={loading}
                                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${activeGroup === "mtff" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                                                >
                                                    MTFF
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        <div className="flex justify-center items-center gap-6 m-2">
                                            <span className="font-[400]">Opening Balance:</span>
                                            <span
                                                className={`font-semibold ${activeGroup === "mtf" ? (openingBalanceTotalMTF >= 0 ? "text-green-600" : "text-red-600") : activeGroup === "mtff" ? (openingBalanceTotalMTFF >= 0 ? "text-green-600" : "text-red-600") : openingBalanceTotal >= 0 ? "text-green-600" : "text-red-600"}`}
                                            >
                                                <DecryptedText
                                                    animateOn="view"
                                                    revealDirection="center"
                                                    characters="123456789"
                                                    text={new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                        minimumFractionDigits: 2,
                                                    }).format(
                                                        activeGroup === "mtf"
                                                            ? openingBalanceTotalMTF
                                                            : activeGroup === "mtff"
                                                                ? openingBalanceTotalMTFF
                                                                : openingBalanceTotal,
                                                    )}
                                                />
                                            </span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        {isToggleExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    align="center"
                                                    side="bottom"
                                                    className="w-[320px] p-4 shadow-lg border border-gray-200 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-semibold">Opening Balance Details</span>
                                                        <PopoverClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                                            <X className="h-4 w-4" />
                                                            <span className="sr-only">Close</span>
                                                        </PopoverClose>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {activeGroup === "mtf"
                                                            ? openingBalanceRowsMTF.map((row, index) => (
                                                                <div key={index} className="flex justify-between items-center p-2">
                                                                    <span className="text-sm ">{row.COCD}</span>
                                                                    <span className="text-sm ">
                                                                        {new Intl.NumberFormat("en-IN", {
                                                                            style: "currency",
                                                                            currency: "INR",
                                                                            maximumFractionDigits: 2,
                                                                        }).format(row.CR_AMT - row.DR_AMT)}
                                                                    </span>
                                                                </div>
                                                            ))
                                                            : activeGroup === "mtff"
                                                                ? openingBalanceRowsMTFF.map((row, index) => (
                                                                    <div key={index} className="flex justify-between items-center p-2">
                                                                        <span className="text-sm ">{row.COCD}</span>
                                                                        <span className="text-sm ">
                                                                            {new Intl.NumberFormat("en-IN", {
                                                                                style: "currency",
                                                                                currency: "INR",
                                                                                maximumFractionDigits: 2,
                                                                            }).format(row.CR_AMT - row.DR_AMT)}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                                : openingBalanceRows.map((row, index) => (
                                                                    <div key={index} className="flex justify-between items-center p-2">
                                                                        <span className="text-sm ">{row.COCD}</span>
                                                                        <span className="text-sm ">
                                                                            {new Intl.NumberFormat("en-IN", {
                                                                                style: "currency",
                                                                                currency: "INR",
                                                                                maximumFractionDigits: 2,
                                                                            }).format(row.CR_AMT - row.DR_AMT)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-[400]">Closing Balance:</span>
                                            <span
                                                className={`font-semibold ${activeGroup === "mtf" ? (finalClosingBalanceMTF >= 0 ? "text-green-600" : "text-red-600") : activeGroup === "mtff" ? (finalClosingBalanceMTFF >= 0 ? "text-green-600" : "text-red-600") : finalClosingBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                                            >
                                                <DecryptedText
                                                    animateOn="view"
                                                    revealDirection="center"
                                                    characters="123456789"
                                                    text={new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                        minimumFractionDigits: 2,
                                                    }).format(
                                                        activeGroup === "mtf"
                                                            ? finalClosingBalanceMTF
                                                            : activeGroup === "mtff"
                                                                ? finalClosingBalanceMTFF
                                                                : finalClosingBalance,
                                                    )}
                                                />
                                            </span>
                                        </div>
                                    </div>

                                    <div></div>
                                </div>
                            )}

                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                    <div className="rounded-full bg-muted p-3 mb-4">
                                        <FileX className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">No Data found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-md">There are no Ledger Book records available.</p>
                                </div>
                            ) : (
                                <DataTableArray
                                    ref={tableRef}
                                    columns={columns}
                                    data={
                                        activeGroup === "group1"
                                            ? [...rowsWithBalances].reverse()
                                            : activeGroup === "mtf"
                                                ? [...rowsWithBalancesfilteredMTF].reverse()
                                                : activeGroup === "mtff"
                                                    ? [...rowsWithBalancesfilteredMTFF].reverse()
                                                    : [...rowsWithBalances].reverse()
                                    }
                                    filterColumn="NARRATION"
                                    filterPlaceholder="Filter Narration..."
                                    includeFileData={true}
                                    showAllRows={true}
                                    showPagination={false}
                                    getActionButtonDetails={getActionButtonDetails}
                                    downloadFileName={"Ledger_Book"}
                                    columnSearch={true}
                                    fromDate={form.watch("fromDate")}
                                    toDate={form.watch("toDate")}
                                    moreDetails={{
                                        "Opening Balance":
                                            activeGroup === "mtf"
                                                ? openingBalanceTotalMTF
                                                : activeGroup === "mtff"
                                                    ? openingBalanceTotalMTFF
                                                    : openingBalanceTotal,
                                        "Closing Balance":
                                            activeGroup === "mtf"
                                                ? finalClosingBalanceMTF
                                                : activeGroup === "mtff"
                                                    ? finalClosingBalanceMTFF
                                                    : finalClosingBalance,
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            <Dialog
                open={modalOpen}
                onOpenChange={(open) => {
                    setModalOpen(open)
                    if (!open) {
                        setAmountData([])
                        setAmountError(null)
                        setCurrentBillDetails(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base md:text-lg lg:text-xl">Bill Data Amount</DialogTitle>
                        <DialogDescription className="text-sm ">
                            {currentBillDetails ? (
                                <>
                                    Settlement:  <span className="font-bold">{currentBillDetails.SETLNO}</span> |
                                    Market type: <span className="font-bold">{currentBillDetails.mktType}</span> |
                                    Date: <span className="font-bold">{currentBillDetails.toDate}</span>
                                </>
                            ) : (
                                "Details related to Bill Amount."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {amountLoading ? (
                        <DataTableSkeleton columns={4} rows={5} />
                    ) : amountError ? (
                        <h3 className="text-red-600">{amountError}</h3>
                    ) : amountData.length === 0 ? (
                        <h3 className="text-yellow-600">No data available for this bill.</h3>
                    ) : (
                        <>
                            <div className="sm:flex-row sm:justify-between sm:items-center flex flex-row justify-between gap-6">
                                {/* Total Amount Display */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <span className="font-semibold text-sm sm:text-base text-card-foreground">Total Amount:</span>
                                    <span
                                        className={`text-sm sm:text-base ${totalAmountRowsNetAmount >= 0 ? "text-green-600" : "text-red-600"
                                            }`}
                                    >
                                        {new Intl.NumberFormat("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 2,
                                        }).format(totalAmountRowsNetAmount)}
                                    </span>
                                </div>

                                {/* Expense Details Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <div className="flex md:flex-row sm:flex-col items-center gap-2">
                                        <span className="font-semibold text-sm sm:text-base text-card-foreground">Expenses:</span>

                                        <div className="flex items-center">
                                            <span
                                                className={`font-semibold text-sm sm:text-base ${totalExpenses >= 0 ? "text-green-600" : "text-red-400"
                                                    }`}
                                            >
                                                <DecryptedText
                                                    animateOn="view"
                                                    revealDirection="center"
                                                    characters="12345678"
                                                    text={new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                        minimumFractionDigits: 2,
                                                    }).format(Math.abs(totalExpenses))}
                                                />
                                            </span>
                                            {processedExpensesRows.length > 0 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="p-2">
                                                            {isToggleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        align="center"
                                                        side="bottom"
                                                        className="w-[95vw] sm:w-[320px] p-4 shadow-lg border border-gray-200 rounded-lg"
                                                    >
                                                        <div className="space-y-2">
                                                            {processedExpensesRows.map((row, index) => (
                                                                <div key={index} className="flex justify-between items-center text-xs sm:text-sm p-2">
                                                                    <span>{row.label}</span>
                                                                    <span>
                                                                        {new Intl.NumberFormat("en-IN", {
                                                                            style: "currency",
                                                                            currency: "INR",
                                                                            maximumFractionDigits: 2,
                                                                        }).format(Math.abs(row.amount || 0))}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main DataTable */}
                            <div className="overflow-x-auto">
                                <DataTableArray
                                    columns={selectedColumns}
                                    data={filteredAmountRows}
                                    showAllRows={true}
                                    downloadFileName={"Ledger_Book_Bill_Data_Amount"}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}
