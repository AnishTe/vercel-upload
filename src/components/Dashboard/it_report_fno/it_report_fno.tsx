/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { lazy, Suspense, useEffect, useState } from "react"
import { ExternalLink, Info, Loader, Search } from 'lucide-react'
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AnnualPL_FNO_Entry, columns } from "./columns"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import DecryptedText from "@/components/ui/DecryptedText"

import { annualPLFNO } from "@/lib/auth"

import { toast } from "sonner"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import ExpensesDisplay from "@/components/Dashboard/ReusableComponents/ExpensesDisplays"

import dynamic from "next/dynamic";

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false, loading: () => <DataTableSkeleton columns={4} rows={10} /> });

export default function EquityReportFNOPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[]>([])
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [expensesData, setExpensesData] = useState([]);

    const handleTypeClick = (type: string) => {
        // Scroll to the corresponding section
        const element = document.getElementById(type)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    /// Helper to generate financial years
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
            toDate: financialYears[0].toDate,
        },
    });

    const { watch, setValue } = form;

    // Watch for financialYear changes
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "financialYear") {
                setValue("toDate", value.financialYear?.toDate || financialYears[0].toDate);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, financialYears, setValue]);

    // Fetch Annual PL Data
    const fetchAnnualPLData = async (fromDate: string, toDate: string) => {
        setError("")
        setLoading(true);
        try {
            const response = await annualPLFNO({ fromDate, toDate });
            const tokenIsValid = validateToken(response);

            if (!tokenIsValid) {
                setShowSessionExpired(true);
                return;
            }

            const parsedData = typeof response.data.data === "string"
                ? JSON.parse(response.data.data)
                : response.data.data;
            if (parsedData.Success === "True") {
                toast.success("Data fetched successfully!");
                const description = parsedData["Success Description"];
                const expensesRows = description.filter((row) => row.SR === "2");
                const nonExpensesRows = description.filter((row) => row.SR !== "2");
                setExpensesData(expensesRows);
                setData(nonExpensesRows);
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch data.");
            }
        } catch (error: any) {
            setError(error.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { fromDate, toDate } = financialYears[0];
        fetchAnnualPLData(fromDate, toDate);
    }, []);

    const onSubmit = (formData: z.infer<typeof formSchema>) => {
        const { financialYear, toDate } = formData;
        fetchAnnualPLData(financialYear.fromDate, toDate);
    };

    const totalNetAmount = data?.reduce(
        (total: number, row: any) =>
            // row.SALEQTY === "0" || row.BUYQTY === "0"
            //     ? total
            //     : 

            total + parseFloat(row.LONGQTY !== null || row.SHORTQTY !== null ? row.NOTIONAL.toString() : row.NET_PLAMT.toString() || "0"),
        0
    );


    const totalexpenses = expensesData?.reduce(
        (total: number, expense: any) => total + parseFloat(expense.PL_AMT?.toString() || '0'),
        0
    );

    const cleanSymbol = (symbol: string) => symbol.replace(/^\*|\*$/g, "");


    const processedExpensesData = (() => {
        const mergedData: Record<string, { SCRIP_NAME: string; PL_AMT: number }> = {};

        // Merge CGST and SGST into GST and calculate totals
        expensesData.forEach((expense: any) => {
            const { SCRIP_NAME, PL_AMT } = expense;
            const cleanedName = cleanSymbol(SCRIP_NAME); // Apply cleanSymbol to SCRIP_NAME
            const key = cleanedName === "CGST" || cleanedName === "SGST" ? "GST" : cleanedName;

            if (!mergedData[key]) {
                mergedData[key] = { SCRIP_NAME: key, PL_AMT: 0 };
            }
            mergedData[key].PL_AMT += Math.abs(Number(PL_AMT));
        });

        // Convert the merged data back into an array
        const mergedArray = Object.values(mergedData);

        // Sort the array by the desired order: STT, STAMP DUTY, GST, followed by others
        const order = ["STT", "STAMP DUTY", "GST"];
        return mergedArray.sort((a, b) => {
            const indexA = order.indexOf(a.SCRIP_NAME);
            const indexB = order.indexOf(b.SCRIP_NAME);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both are in the predefined order
            if (indexA !== -1) return -1; // A is in the predefined order
            if (indexB !== -1) return 1; // B is in the predefined order
            return 0; // Keep the original order for others
        });
    })();

    const totalRealized = totalNetAmount - Math.abs(Number(totalexpenses))

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-col sm:flex-col  mb-4">
                            <div className="flex-1">
                                <CardTitle>IT Report FNO</CardTitle>
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
                                                            onValueChange={(value) => {
                                                                // Find the selected year based on value
                                                                const selectedYear = financialYears.find((fy) => fy.value === value);
                                                                field.onChange(selectedYear); // Pass the selected year object to form
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
                                                );
                                            }}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="toDate"
                                            render={({ field }) => (
                                                <FormItem className="w-[150px]">
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            className="flex h-10 w-full rounded-md border text-white bg-transparent px-3 py-2 text-sm "
                                                            value={format(
                                                                new Date(field.value.split("/").reverse().join("-")),
                                                                "yyyy-MM-dd"
                                                            )}
                                                            min={format(
                                                                new Date(form.watch("financialYear").fromDate.split("/").reverse().join("-")),
                                                                "yyyy-MM-dd"
                                                            )}
                                                            max={format(
                                                                new Date(form.watch("financialYear").toDate.split("/").reverse().join("-")),
                                                                "yyyy-MM-dd"
                                                            )}
                                                            onChange={(e) => {
                                                                const date = new Date(e.target.value);
                                                                field.onChange(format(date, "dd/MM/yyyy"));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" disabled={loading}>
                                            {loading ? (
                                                <Loader />
                                            ) : (
                                                <Search className="h-5 w-5" />
                                            )}
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
                                    <div className="flex flex-wrap items-center justify-start gap-3">
                                        <h2 className="text-lg font-bold flex gap-2 items-center">Realized
                                            <p className={`text-sm font-regular `}>
                                                {totalRealized >= 0 ? 'Profit' : 'Loss'}
                                            </p>
                                            <p className={`text-sm font-regular ${totalRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                })
                                                    .format(totalRealized)
                                                    .replace(/^(\D?)(.+)$/, (_, symbol, amount) => `(${symbol}${amount})`)}
                                            </p>

                                        </h2>
                                        <div className="flex flex-wrap border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
                                            onClick={() => handleTypeClick("trading")}>
                                            <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                                Other Trading
                                            </h3>
                                            <p className={`text-xs font-regular`}>
                                                {totalNetAmount >= 0 ? 'Profit' : 'Loss'}
                                            </p>
                                            <p className={`text-xs ${totalNetAmount >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                                <DecryptedText
                                                    animateOn="view"
                                                    revealDirection="center"
                                                    characters="123456789"
                                                    text={new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                        minimumFractionDigits: 2,
                                                    }).format(Math.abs(Number(totalNetAmount)))}
                                                />
                                                <ExternalLink
                                                    size={15}
                                                    className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                />
                                            </p>

                                        </div>
                                        <div className="flex flex-wrap border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md" onClick={() => handleTypeClick("expenses")}>
                                            <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                                Expenses
                                            </h3>
                                            {/* <p className={`text-xs font-regular`}>
                                                {totalexpenses >= 0 ? 'Profit' : 'Loss'}
                                            </p> */}
                                            <p className={`text-xs ${totalexpenses >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                                <DecryptedText
                                                    animateOn="view"
                                                    revealDirection="center"
                                                    characters="123456789"
                                                    text={new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                        minimumFractionDigits: 2,
                                                    }).format(Math.abs(Number(totalexpenses)))}
                                                />
                                                <ExternalLink
                                                    size={15}
                                                    className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                />
                                            </p>

                                        </div>

                                    </div>

                                    <div key={"trading"} id={"trading"} className="my-8">
                                        <div className="flex justify-between items-center gap-6">
                                            <div className="flex gap-1 items-center">
                                                <div className="flex gap-1 items-center mb-4">

                                                    <h3 className="text-lg font-semibold ">Other Trading</h3>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="cursor-pointer">
                                                                <Info size={16} />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="min-w-[50px] max-w-[250px] p-4 m-2 bg-gray-800 text-white rounded-md shadow-md">
                                                            <p>
                                                                Represents derivative trading in Futures and Options (F&O) contracts, including both intraday and positional trades. These trades are settled based on margin requirements and expiry dates.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <p className={`font-semibold flex flex-wrap gap-2 justify-end `}>
                                                Other Trading:
                                                <span className={`${totalNetAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    <DecryptedText
                                                        animateOn="view"
                                                        revealDirection="center"
                                                        characters="123456789"
                                                        text={new Intl.NumberFormat("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                        }).format(Math.abs(totalNetAmount))}
                                                    />
                                                </span>
                                            </p>
                                        </div>
                                        <DataTableArray
                                            columns={columns}
                                            data={data}
                                            filterColumn="SCRIP_NAME"
                                            filterPlaceholder="Filter Scrip..."
                                            includeFileData={true}
                                            showAllRows={true}
                                            showPagination={false}
                                            downloadFileName={"IT_Report_FNO"}
                                            year={form.watch("financialYear").value}
                                            fromDate={form.watch("financialYear").fromDate}
                                            toDate={form.watch("toDate")}
                                            moreDetails={{
                                                "Realized": {
                                                    rowKey: "category",
                                                    rowAmount: "amount",
                                                    rows: [
                                                        { category: "Other Trading", amount: totalNetAmount },
                                                        { category: "Expenses", amount: totalexpenses }
                                                    ],
                                                    total: totalRealized, // This will show as the Realized Total
                                                },
                                                Expenses: {
                                                    rowKey: "SCRIP_NAME",
                                                    rowAmount: "PL_AMT",
                                                    rows: processedExpensesData,
                                                    total: Math.abs(totalexpenses),
                                                }
                                            }}
                                        />
                                    </div>

                                </>
                            )}

                            <ExpensesDisplay processedExpensesData={processedExpensesData} totalExpenses={totalexpenses} expenseRowKey={"SCRIP_NAME"} expenseRowAmount={"PL_AMT"} />

                        </CardContent>

                    </Card>


                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}

        </>
    )
}

