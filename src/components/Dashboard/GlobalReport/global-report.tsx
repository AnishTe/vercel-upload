/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { columns } from "./columns"
import { globalReport } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import DecryptedText from "@/components/ui/DecryptedText"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader, Search } from "lucide-react"
import ExpensesDisplay from "../ReusableComponents/ExpensesDisplays"
import TotalDataSummary from "../ReusableComponents/TotalDataSummary"
import { CompanyCodeSummary } from "./company-code-summary"

import dynamic from "next/dynamic"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface DataRow {
    COMPANY_CODE: string;
    NOT_PROFIT: string;
}
export default function GlobalReport() {

    const [data, setData] = useState<DataRow[]>([])
    const [totalCapital, setTotalCapital] = useState(0)
    const [totalDerivatives, setTotalDerivatives] = useState(0)
    const [totalMFSS, setTotalMFSS] = useState(0)
    const [totalCommodity, setTotalCommodity] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [loading, setLoading] = useState(true)
    const [expensesData, setExpensesData] = useState([])
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
    const financialYears = getFinancialYears()

    // Validation Schema
    const formSchema = z.object({
        financialYear: z.object({
            fromDate: z.string(),
            toDate: z.string(),
            value: z.string(),
        }),
        toDate: z.string().nonempty("To Date is required"),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            financialYear: financialYears[0],
            toDate: financialYears[0].toDate,
        },
    })

    const { watch, setValue } = form

    // Watch for financialYear changes
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "financialYear") {
                setValue("toDate", value.financialYear?.toDate || financialYears[0].toDate)
            }
        })
        return () => subscription.unsubscribe()
    }, [watch, financialYears, setValue])

    const onSubmit = (formData: z.infer<typeof formSchema>) => {
        const { financialYear, toDate } = formData
        loadData(financialYear.fromDate, toDate)
    }

    const loadData = async (fromDate: string, toDate: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await globalReport({ toDate })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                const description = parsedData["Success Description"]

                const filteredRows = description.filter(
                    (row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "DERIVATIVES" || row.COMPANY_CODE === "CAPITAL" || row.COMPANY_CODE === "MFSS" || row.COMPANY_CODE === "COMMODITY",
                )

                const capitalSum = filteredRows
                    .filter((row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "CAPITAL")
                    .reduce((acc: number, row: { NOT_PROFIT: any }) => acc + Number.parseFloat(row.NOT_PROFIT || 0), 0)

                const derivativesSum = filteredRows
                    .filter((row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "DERIVATIVES")
                    .reduce((acc: number, row: { NOT_PROFIT: any }) => acc + Number.parseFloat(row.NOT_PROFIT || 0), 0)

                const MFSSSum = filteredRows
                    .filter((row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "MFSS")
                    .reduce((acc: number, row: { NOT_PROFIT: any }) => acc + Number.parseFloat(row.NOT_PROFIT || 0), 0)

                const commoditySum = filteredRows
                    .filter((row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "COMMODITY")
                    .reduce((acc: number, row: { NOT_PROFIT: any }) => acc + Number.parseFloat(row.NOT_PROFIT || 0), 0)

                setData(filteredRows)
                setTotalCapital(capitalSum)
                setTotalDerivatives(derivativesSum)
                setTotalMFSS(MFSSSum)
                setTotalCommodity(commoditySum)

                const expensesRows = description.filter((row: { COMPANY_CODE: string }) => row.COMPANY_CODE === "EXPENSES")
                const totalExpenses = expensesRows.reduce(
                    (acc: number, row: { NOT_PROFIT: any }) => acc + Number.parseFloat(row.NOT_PROFIT || 0),
                    0,
                )

                setExpensesData(expensesRows)
                setTotalExpenses(totalExpenses)
            } else {
                throw new Error("Failed to fetch data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const { fromDate, toDate } = financialYears[0]
        loadData(fromDate, toDate)
    }, [])

    const totalexpenses = expensesData?.reduce(
        (total: number, expense: any) => total + parseFloat(expense.NOT_PROFIT?.toString() || '0'),
        0
    );
    const cleanSymbol = (symbol: string) => symbol.replace(/^\*|\*$/g, "");

    const processedExpensesData = (() => {
        const mergedData: Record<string, { SCRIP_SYMBOL: string; NOT_PROFIT: number }> = {};

        // Merge CGST and SGST into GST and calculate totals
        expensesData.forEach((expense: any) => {
            const { SCRIP_SYMBOL, NOT_PROFIT } = expense;
            const cleanedName = cleanSymbol(SCRIP_SYMBOL); // Apply cleanSymbol to SCRIP_SYMBOL
            const key = cleanedName === "CGST" || cleanedName === "SGST" ? "GST" : cleanedName;

            if (!mergedData[key]) {
                mergedData[key] = { SCRIP_SYMBOL: key, NOT_PROFIT: 0 };
            }
            mergedData[key].NOT_PROFIT += Math.abs(Number(NOT_PROFIT));
        });

        // Convert the merged data back into an array
        const mergedArray = Object.values(mergedData);

        // Sort the array by the desired order: STT, STAMP DUTY, GST, followed by others
        const order = ["STT", "STAMP DUTY", "GST"];
        return mergedArray.sort((a, b) => {
            const indexA = order.indexOf(a.SCRIP_SYMBOL);
            const indexB = order.indexOf(b.SCRIP_SYMBOL);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both are in the predefined order
            if (indexA !== -1) return -1; // A is in the predefined order
            if (indexB !== -1) return 1; // B is in the predefined order
            return 0; // Keep the original order for others
        });
    })();

    const totalRealized = (totalCapital + totalDerivatives + totalMFSS + totalCommodity) - Math.abs(Number(totalexpenses));

    const handleTypeClick = (type: string) => {
        setTimeout(() => {
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
        }, 100);
    };

    const summaries = useMemo(() => {
        const uniqueCodes = [...new Set(data.map((row) => row.COMPANY_CODE))]

        return uniqueCodes
            .map((code) => {
                const sum = data
                    .filter((row) => row.COMPANY_CODE === code)
                    .reduce((acc, row) => acc + Number.parseFloat(row.NOT_PROFIT || "0"), 0)
                const filteredCode = code === "CAPITAL" ? "EQUITY" : code

                return { filteredCode, sum }
            })
            .filter((summary) => summary.sum !== 0)
    }, [data])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>

                        <CardHeader className="flex flex-col md:flex-col sm:flex-col  mb-4">
                            <div className="flex-1">
                                <CardTitle>Annual P&L</CardTitle>
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
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap justify-start items-center lg:gap-6 sm:gap-3">
                                        <h2 className="text-lg font-bold flex gap-2 items-center py-2">
                                            <p className={`text-sm font-regular`}>
                                                {totalRealized >= 0 ? 'Profit' : 'Loss'}
                                            </p>
                                            <p className={`text-sm font-regular ${totalRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(totalRealized).replace(/^(\D?)(.+)$/, (_, symbol, amount) => `(${symbol}${amount})`)}
                                            </p>
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            <CompanyCodeSummary data={summaries.map(({ filteredCode, sum }) => ({ code: filteredCode, sum }))} loading={loading} />

                                            {/* Add Expenses to Realized */}
                                            <div onClick={() => handleTypeClick("expenses")} className="flex border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md" >
                                                <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                                    EXPENSES
                                                </h3>
                                                {/* <p className={`text-xs font-regular`}>
                                            {totalExpenses >= 0 ? 'Profit' : 'Loss'}
                                        </p> */}
                                                <p className={`text-xs ${totalExpenses >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                                    <DecryptedText
                                                        animateOn="view"
                                                        revealDirection="center"
                                                        characters="123456789"
                                                        text={new Intl.NumberFormat("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                        }).format((Math.abs(Number(totalExpenses))))}
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <DataTableArray
                                        columns={columns}
                                        data={data}
                                        includeFileData={true}
                                        showAllRows={true}
                                        showPagination={false}
                                        moreDetails={{
                                            "Realized": {
                                                rowKey: "category",
                                                rowAmount: "amount",
                                                rows: [
                                                    // Map and transform the summaries data to match the Realized row structure
                                                    ...summaries.map(item => ({
                                                        category: item.filteredCode, // Use the filteredCode as the category name
                                                        amount: item.sum // Use the sum as the amount
                                                    })),
                                                    { category: "Expenses", amount: totalExpenses }
                                                ],
                                                total: totalRealized, // This will show as the Realized Total
                                            },
                                            "Expenses": {
                                                rowKey: "SCRIP_SYMBOL",
                                                rowAmount: "NOT_PROFIT",
                                                rows: processedExpensesData,
                                                total: Math.abs(totalExpenses),
                                            }
                                        }}
                                    />
                                    <div id="expenses">
                                        <ExpensesDisplay processedExpensesData={processedExpensesData} totalExpenses={totalExpenses} expenseRowKey={"SCRIP_SYMBOL"} expenseRowAmount={"NOT_PROFIT"} />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

