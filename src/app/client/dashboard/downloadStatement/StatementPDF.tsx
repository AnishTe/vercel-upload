"use client"

import React, { useCallback, useEffect, useState } from "react"
import { PDFViewer } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Eye, EyeOff, Loader, Search } from "lucide-react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { stt_certificate } from "@/lib/auth"
import { useUser } from "@/contexts/UserContext"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MainDocument from "./Document"
import { useSearchParams } from "next/navigation"

const formatDateToAPI = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return format(date, "dd/MM/yyyy")
}


const formatDateToInput = (dateStr: string) => {
    if (!dateStr) return ""
    const [day, month, year] = dateStr.split("/")
    return `${year}-${month}-${day}`
}

const StatementPDF = () => {
    const [showPDF, setShowPDF] = React.useState(false)
    const [loading, setLoading] = useState(false)
    const [downloadLoading, setDownloadLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pdfFromDate, setPdfFromDate] = useState<string | null>(null)
    const [pdfToDate, setPdfToDate] = useState<string | null>(null)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [data, setData] = useState<{
        length: number
        common: any
        tableDetails: Record<string, any>[]
    }>({
        common: {},
        tableDetails: [],
        length: 0,
    })
    const { currentUser, userDetails } = useUser()
    const [paramsData, setParamsData] = useState<any>(userDetails || {})
    const searchParams = useSearchParams()

    const availableSegments = paramsData?.segments?.split(",")

    // useEffect(() => {
    //     const searchParamsClientID = searchParams.get("clientId")
    //     const searchParamsBranchClientCheck = searchParams.get("branchClientCheck")
    //     const searchParamsfamilyClientCheck = searchParams.get("familyClientCheck")

    //     if (searchParamsClientID && searchParamsBranchClientCheck) {
    //         const cookieValue = sessionStorage.getItem(`branchClientCheck_${searchParamsClientID}`)
    //         const cookiesData = cookieValue ? JSON.parse(cookieValue) : null
    //         setParamsData(cookiesData)
    //     } else {
    //         setParamsData(userDetails)
    //     }
    // }, [searchParams, userDetails])

    useEffect(() => {
        const clientId = searchParams.get("clientId");
        const isBranchClient = searchParams.get("branchClientCheck");
        const isFamilyClient = searchParams.get("familyClientCheck");

        if (clientId) {
            let cookieKey = "";

            if (isBranchClient) {
                cookieKey = `branchClientCheck_${clientId}`;
            } else if (isFamilyClient) {
                cookieKey = `familyClientCheck_${clientId}`;
            }

            if (cookieKey) {
                const cookieValue = sessionStorage.getItem(cookieKey);
                const cookiesData = cookieValue ? JSON.parse(cookieValue) : null;
                setParamsData(cookiesData);
            } else {
                setParamsData(userDetails);
            }
        } else {
            setParamsData(userDetails);
        }
    }, [searchParams, userDetails]);


    const getCurrentFinancialYear = useCallback(() => {
        const today = new Date()
        const currentYear = today.getUTCFullYear()
        const currentMonth = today.getUTCMonth()
        const fromDate = currentMonth < 3 ? new Date(currentYear - 1, 3, 1) : new Date(currentYear, 3, 1)

        return {
            fromDate: format(fromDate, "yyyy-MM-dd"),
            toDate: format(today, "yyyy-MM-dd"),
        }
    }, [])

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

    const { fromDate, toDate } = getCurrentFinancialYear()

    const formSchema = z.object({
        fromDate: z.string().nonempty("From Date is required"),
        toDate: z.string().nonempty("To Date is required"),
        segment: z.string().nonempty("Segment is required"),
        financialYear: z.object({
            fromDate: z.string(),
            toDate: z.string(),
            value: z.string(),
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            financialYear: financialYears[0] || { fromDate: "", toDate: "", value: "" },
            fromDate,
            toDate,
            segment: "",
        },
    })

    const { watch, setValue } = form

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "financialYear" && value?.financialYear) {
                const selectedYear = value.financialYear
                if (selectedYear?.fromDate && selectedYear?.toDate) {
                    const formattedFromDate = formatDateToInput(selectedYear.fromDate)
                    const formattedToDate = formatDateToInput(selectedYear.toDate)

                    if (formattedFromDate && formattedToDate) {
                        setValue("fromDate", formattedFromDate, { shouldValidate: true, shouldDirty: true })
                        setValue("toDate", formattedToDate, { shouldValidate: true, shouldDirty: true })
                    }
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [watch, setValue])

    const fetchData = useCallback(async (fromDate: string, toDate: string, segment: any) => {
        setLoading(true)
        setError(null)
        try {
            const response = await stt_certificate({
                fromDate: formatDateToAPI(fromDate),
                toDate: formatDateToAPI(toDate),
                companyCode: segment,
            })

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                const data = parsedData["Success Description"]
                setData(groupByTransCode(data))
                setShowPDF(true)
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch ledger data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [])

    const onSubmit = useCallback(
        (formData: z.infer<typeof formSchema>) => {
            if (!formData.financialYear || !formData.financialYear.fromDate || !formData.financialYear.toDate) {
                setError("Financial year selection is invalid")
                return
            }

            // Store the dates for PDF at the time of submission
            setPdfFromDate(formData.fromDate)
            setPdfToDate(formData.toDate)

            fetchData(formData.fromDate, formData.toDate, formData.segment)

            // Reset form properly while preserving valid state
            setTimeout(() => {
                form.reset({
                    financialYear: financialYears.find((fy) => fy.value === formData.financialYear.value) || financialYears[0],
                    fromDate: formData.fromDate,
                    toDate: formData.toDate,
                    segment: formData.segment,
                })
            }, 100)
        },
        [fetchData, form, financialYears],
    )

    const handleDownload = async () => {
        try {
            setDownloadLoading(true)
            const blob = await pdf(<MainDocument data={data} fromDate={pdfFromDate} toDate={pdfToDate} />).toBlob()
            saveAs(blob, `STT_Statement_${currentUser}.pdf`)
        } catch (error) {
            console.error("Error generating PDF:", error)
            setError("Failed to generate PDF for download")
        } finally {
            setDownloadLoading(false)
        }
    }

    function groupByTransCode(data) {
        if (!data || !Array.isArray(data) || data.length === 0) return { common: {}, tableDetails: [], length: 0 }

        const common = {}
        const tableDetails: Record<string, any>[] = []
        const keysToSeparate = [
            "STT",
            "TOTAL_ACCOUNT_STT",
            "TOTAL_ACCOUNT_VALUE",
            "TOTAL_EXCHANGE_STT",
            "TOTAL_EXCHANGE_VALUE",
            "TRANS_CODE",
        ]

        // Initialize common with the first record
        Object.keys(data[0] || {}).forEach((key) => {
            if (!keysToSeparate.includes(key)) {
                common[key] = data[0][key]
            }
        })

        // Collect tableDetails for each record
        data.forEach((record) => {
            const details = {}
            keysToSeparate.forEach((key) => {
                if (record[key] !== undefined) {
                    details[key] = record[key]
                }
            })
            tableDetails.push(details)
        })

        return { common, tableDetails, length: data.length }
    }

    const hasData = data.tableDetails && data.tableDetails.length > 0

    return (
        <>
            <DashboardLayout>
                <div className="space-y-6">
                    <Card className="shadow-md">
                        <CardHeader >
                            <CardTitle>
                                STT Certificate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-4xl mx-auto">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <FormField
                                                control={form.control}
                                                name="financialYear"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Financial Year</FormLabel>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                const selectedYear = financialYears.find((fy) => fy.value === value)
                                                                if (selectedYear) {
                                                                    field.onChange(selectedYear)
                                                                }
                                                            }}
                                                            defaultValue={field.value?.value || ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
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
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="fromDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">From Date</FormLabel>
                                                        <div className="relative">
                                                            <FormControl>
                                                                <Input
                                                                    type="date"
                                                                    id="fromDate"
                                                                    className="w-full"
                                                                    min={
                                                                        form.watch("financialYear")?.value
                                                                            ? `${form.watch("financialYear").value.split("-")[0]}-04-01`
                                                                            : undefined
                                                                    }
                                                                    max={
                                                                        form.watch("financialYear")?.value
                                                                            ? `${form.watch("financialYear").value.split("-")[1]}-03-31`
                                                                            : undefined
                                                                    }
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="toDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">To Date</FormLabel>
                                                        <div className="relative">
                                                            <FormControl>
                                                                <Input
                                                                    type="date"
                                                                    id="toDate"
                                                                    className="w-full"
                                                                    min={
                                                                        form.watch("financialYear")?.value
                                                                            ? `${form.watch("financialYear").value.split("-")[0]}-04-01`
                                                                            : undefined
                                                                    }
                                                                    max={
                                                                        form.watch("financialYear")?.value
                                                                            ? `${form.watch("financialYear").value.split("-")[1]}-03-31`
                                                                            : new Date().toISOString().split("T")[0]
                                                                    }
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="segment"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel className="font-medium block mb-2">Select Segment</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4"
                                                        >
                                                            {availableSegments?.map((segment) => (
                                                                <FormItem
                                                                    key={segment}
                                                                    className="flex items-center space-x-3 space-y-0 rounded-md p-3 hover:bg-muted/50 transition-colors ml-5"
                                                                >
                                                                    <FormControl>
                                                                        <RadioGroupItem value={segment} />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer">{segment}</FormLabel>
                                                                </FormItem>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex justify-center">
                                            <Button type="submit" disabled={loading} className="w-auto px-5 py-3 text-base">
                                                {loading ? (
                                                    <>
                                                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-5 w-5 mr-2" />
                                                        Generate Report
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>

                                {loading && (
                                    <div className="mt-8 space-y-4 max-w-2xl mx-auto p-6 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[250px]" />
                                                <Skeleton className="h-4 w-[200px]" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-3/4 mx-auto" />
                                        {[...Array(10)].map((_, index) => (
                                            <div key={index}>
                                                <Skeleton className="h-4 w-full mx-auto" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-8 p-6 bg rounded-lg max-w-2xl mx-auto shadow-lg text-center font-bold text-lg">
                                        <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                                    </div>
                                )}

                                {!loading && !error && hasData && (
                                    <div className="mt-6 space-y-6 max-w-4xl mx-auto">
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <Button
                                                onClick={handleDownload}
                                                disabled={downloadLoading}
                                                className="w-full sm:w-auto px-2 py-2 text-base"
                                                variant="default"
                                            >
                                                {downloadLoading ? (
                                                    <>
                                                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                                                        Downloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-5 w-5 mr-2" />
                                                        Download Statement
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => setShowPDF(!showPDF)}
                                                className="w-full sm:w-auto px-2 py-2 text-base"
                                                variant="outline"
                                            >
                                                {showPDF ? (
                                                    <>
                                                        <EyeOff className="h-5 w-5 mr-2" />
                                                        Hide PDF Preview
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="h-5 w-5 mr-2" />
                                                        Show PDF Preview
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {showPDF && (
                                            <div className="mt-6 border rounded-lg overflow-hidden shadow-lg">
                                                <PDFViewer width="100%" height={700} className="max-w-full">
                                                    <MainDocument data={data} fromDate={pdfFromDate} toDate={pdfToDate} />
                                                </PDFViewer>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

export default StatementPDF

