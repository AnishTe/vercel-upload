/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { applyIPOClient, getClientData } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { useIPO } from "@/contexts/IPOContext"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CreditCard, User, ArrowLeft, CheckCircle, Wallet, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DecryptedText from "@/components/ui/DecryptedText"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export default function ApplyIPO() {
    const { theme } = useTheme()
    const [ipoId, setIpoId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [clientDetails, setClientDetails] = useState<any>(null)
    const [calculatedAmount, setCalculatedAmount] = useState(0)
    const [lotOptions, setLotOptions] = useState<string[]>([])
    const { selectedIPO, setSelectedIPO, setClientDetailsIPO } = useIPO()
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [showApplyRestrictionModal, setShowApplyRestrictionModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPrintModalOpen, setPrintModalOpen] = useState(false)
    const [isModalOpen, setModalOpen] = useState(false)
    const [showSuggestion, setShowSuggestion] = useState(false)
    const [upiSuggestionValue, setUpiSuggestionValue] = useState<string | null>(null)
    const [formInitialized, setFormInitialized] = useState(false)

    useEffect(() => {
        const searchParamsipoId = searchParams.get("ipoId")

        if (searchParamsipoId) {
            // Remove ".html" if present at the end of ipoId
            const cleanedIpoId = searchParamsipoId.replace(/\.html$/, "")
            setIpoId(cleanedIpoId)
        } else {
            router.push(getCompatibleUrl(`/client/dashboard/ipo`))
        }
    }, [router, searchParams])

    const formSchema = z
        .object({
            hasUPI: z.enum(["YES", "NO"]),
            upiId: z
                .string()
                .nullable()
                .optional()
                .refine(
                    (value) => {
                        if (value === null || value === undefined || value.trim() === "") {
                            return true // Allow null/optional if not required
                        }
                        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
                        return upiRegex.test(value)
                    },
                    {
                        message: "Invalid UPI ID. Example format: username@bank",
                    },
                ),
            bankAccountNO: z.string().optional(),
            bankName: z.string().optional(),
            depositoryId: z.string().min(1, "Depository ID is required"),
            beneficiaryId: z.string().min(1, "Beneficiary ID is required"),
            selectedBOID: z.string().min(1, "BOID is required"),
            lot: z.string().min(1, "Lot is required"),
            quantity: z.number().int().positive("Quantity must be a positive integer"),
            rate: z.number().positive().nullable().optional(),
            autoCutOff: z.boolean(),
        })
        .superRefine((data, ctx) => {
            if (data.hasUPI === "YES" && !data.upiId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["upiId"],
                    message: "UPI ID is required when UPI is selected",
                })
            }

            if (data.hasUPI === "NO") {
                if (!data.bankAccountNO) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["bankAccountNO"],
                        message: "Bank Account Number is required",
                    })
                }
                if (!data.bankName) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["bankName"],
                        message: "Bank Name is required",
                    })
                }
            }

            if (!data.autoCutOff && data.rate === null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["rate"],
                    message: "Rate is required when Auto Cut-off is not enabled",
                })
            }

            const minRate = selectedIPO?.minpricerange ? Number(selectedIPO.minpricerange) : 0
            const maxRate = selectedIPO?.maxpricerange ? Number(selectedIPO.maxpricerange) : 0

            if (data.rate !== undefined && data.rate !== null && (data.rate < minRate || data.rate > maxRate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["rate"],
                    message: `Rate must be between ${minRate} and ${maxRate}`,
                })
            }
        })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hasUPI: "YES",
            upiId: null,
            bankAccountNO: "",
            bankName: "",
            depositoryId: "",
            beneficiaryId: "",
            selectedBOID: "",
            lot: "",
            quantity: 1,
            rate: selectedIPO?.maxpricerange ? Number.parseFloat(selectedIPO.maxpricerange) : 0,
            autoCutOff: true,
        },
    })

    const hasUPI = form.watch("hasUPI")
    const autoCutOff = form.watch("autoCutOff")
    const selectedBOID = form.watch("selectedBOID")
    const selectedLot = form.watch("lot")
    const bankName = form.watch("bankName")

    // Function to calculate quantity and amount based on lot
    const calculateQuantityAndAmount = (lot: string) => {
        if (!selectedIPO) return

        const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
        const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")

        const newQuantity = noOfEquitySharesBid * Number.parseInt(lot || "1")
        const newAmount = newQuantity * cutoffPrice

        form.setValue("quantity", newQuantity, { shouldDirty: true, shouldTouch: true })
        setCalculatedAmount(newAmount)
    }

    const fetchClientData = useCallback(async () => {
        if (!ipoId) return

        setLoading(true)
        setError(null)
        try {
            const response = await getClientData({ ipoId: ipoId })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }
            if (response?.data?.data) {
                const data = response.data.data

                if (data.ipoAppliedStatus?.allowToApply === false) {
                    setShowApplyRestrictionModal(true)
                }

                const defaultBOID = data.applicantBoId?.find((bo: any) => bo.depository === "CDSL") || data.applicantBoId?.[0]
                if (defaultBOID) {
                    form.setValue("selectedBOID", defaultBOID.boid)
                    form.setValue("depositoryId", defaultBOID.dpid)
                    form.setValue("beneficiaryId", defaultBOID.boid)
                }

                const defaultBank = data.bankDetails?.find((bank: any) => bank.defaultAccount === "Yes")
                if (defaultBank) {
                    form.setValue("bankAccountNO", defaultBank.accountNumber)
                    form.setValue("bankName", defaultBank.bankName)
                }

                // Set UPI ID if available in client details
                if (data.clientDetails?.upiId) {
                    setUpiSuggestionValue(data.clientDetails.upiId)
                    // Don't auto-fill, just make it available for suggestion
                    // form.setValue("upiId", data.clientDetails.upiId)
                }

                setClientDetails(data)

                // Calculate quantity immediately after client data is loaded
                if (selectedIPO) {
                    const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
                    const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")
                    const maxLotSize = Number.parseInt(selectedIPO.maxlotsize || "0")
                    const maxPriceRange = Number.parseFloat(selectedIPO.maxpricerange || "0")

                    const calculatedLots =
                        hasUPI === "YES" ? Math.floor(500000 / (noOfEquitySharesBid * cutoffPrice)) : maxLotSize
                    const lotOptionsArray = Array.from({ length: calculatedLots }, (_, i) => (i + 1).toString())

                    setLotOptions(lotOptionsArray)

                    if (lotOptionsArray.length > 0) {
                        const defaultLot = lotOptionsArray[0]
                        form.setValue("lot", defaultLot, { shouldDirty: true, shouldTouch: true })

                        // Calculate quantity based on the default lot
                        const calculatedQuantity = noOfEquitySharesBid * Number.parseInt(defaultLot)
                        form.setValue("quantity", calculatedQuantity, { shouldDirty: true, shouldTouch: true })

                        // Calculate amount
                        const calculatedAmount = calculatedQuantity * cutoffPrice
                        setCalculatedAmount(calculatedAmount)
                    }

                    if (form.getValues("autoCutOff")) {
                        form.setValue("rate", maxPriceRange)
                    } else {
                        form.setValue("rate", null)
                    }

                    setFormInitialized(true)
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [ipoId, form, hasUPI, selectedIPO])

    useEffect(() => {
        if (ipoId) {
            fetchClientData()
        }
    }, [ipoId, fetchClientData])

    // Initialize lot options and calculate initial quantity when IPO data is available
    useEffect(() => {
        if (selectedIPO && !formInitialized) {
            const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")
            const maxLotSize = Number.parseInt(selectedIPO.maxlotsize || "0")
            const maxPriceRange = Number.parseFloat(selectedIPO.maxpricerange || "0")

            const calculatedLots = hasUPI === "YES" ? Math.floor(500000 / (noOfEquitySharesBid * cutoffPrice)) : maxLotSize

            const lotOptionsArray = Array.from({ length: calculatedLots }, (_, i) => (i + 1).toString())

            setLotOptions(lotOptionsArray)

            // Set default lot value if options are available
            if (lotOptionsArray.length > 0) {
                const defaultLot = lotOptionsArray[0]
                form.setValue("lot", defaultLot, { shouldDirty: true, shouldTouch: true })

                // Calculate quantity and amount based on the default lot
                const calculatedQuantity = noOfEquitySharesBid * Number.parseInt(defaultLot)
                const calculatedAmount = calculatedQuantity * cutoffPrice

                form.setValue("quantity", calculatedQuantity, { shouldDirty: true, shouldTouch: true })
                setCalculatedAmount(calculatedAmount)

                setFormInitialized(true)
            }

            if (autoCutOff) {
                form.setValue("rate", maxPriceRange)
            } else {
                form.setValue("rate", null)
            }
        }
    }, [selectedIPO, hasUPI, autoCutOff, form, formInitialized])

    // Update quantity and amount when lot changes
    useEffect(() => {
        if (formInitialized && selectedLot) {
            calculateQuantityAndAmount(selectedLot)
        }
    }, [selectedLot, formInitialized])

    // Update rate when autoCutOff changes
    useEffect(() => {
        if (selectedIPO && formInitialized) {
            const maxPriceRange = Number.parseFloat(selectedIPO.maxpricerange || "0")

            if (autoCutOff) {
                form.setValue("rate", maxPriceRange)
            } else {
                form.setValue("rate", null)
            }
        }
    }, [autoCutOff, selectedIPO, formInitialized, form])

    useEffect(() => {
        if (selectedBOID && clientDetails?.applicantBoId) {
            const selectedBO = clientDetails.applicantBoId.find((bo: any) => bo.boid === selectedBOID)
            if (selectedBO) {
                form.setValue("depositoryId", selectedBO.dpid)
                form.setValue("beneficiaryId", selectedBO.boid)
            }
        }
    }, [selectedBOID, clientDetails, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setModalOpen(true)
    }

    // if (error) {
    //     return (
    //         <Alert variant="destructive" className="max-w-3xl mx-auto my-8">
    //             <AlertCircle className="h-5 w-5" />
    //             <AlertTitle>Error</AlertTitle>
    //             <AlertDescription>{error}</AlertDescription>
    //             <Button
    //                 variant="outline"
    //                 className="mt-4"
    //                 onClick={() => router.push(getCompatibleUrl("/client/dashboard/ipo"))}
    //             >
    //                 Return to IPO Dashboard
    //             </Button>
    //         </Alert>
    //     )
    // }

    const handlePrintIPO = () => {
        setPrintModalOpen(true)
    }

    const applyIPOForClient = async (isPrint = false) => {
        setSubmitting(true)
        const formValues = form.getValues()
        const dpDetails = clientDetails?.applicantBoId?.find((bo: any) => bo.boid === formValues.selectedBOID)

        const data = [
            {
                boid: formValues.selectedBOID,
                dpid: formValues.depositoryId,
                depository: dpDetails.depository,
                companyname: selectedIPO?.companyname,
                ipocompanymasterId: ipoId,
                name: clientDetails?.clientDetails?.clientName,
                upiId: formValues.upiId || "",
                lotsapplied: formValues.lot,
                clientId: clientDetails?.clientDetails?.clientId,
                mobile: clientDetails?.clientDetails?.mobile,
                pan: clientDetails?.clientDetails?.pan,
                email: clientDetails?.clientDetails?.email,
                applicationno: "",
                quantity: formValues.quantity.toString(),
                rate: formValues.autoCutOff ? selectedIPO?.maxpricerange : formValues.rate?.toString(),
                formtype: formValues.hasUPI === "YES" ? "online" : "offline",
                cuttoffflag: "0",
                category: selectedIPO?.category || "Retail",
                companySymbol: selectedIPO?.companysymbol,
                actionCode: "n",
                Exchange: selectedIPO?.companylogoex,
            },
        ]

        try {
            const response = await applyIPOClient({ data })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }
            if (response?.data?.data) {
                const responseData = response.data.data
                if (responseData[0]?.orderstatus === true) {
                    localStorage.setItem("applicationno", responseData[0]?.applicationNo)
                    toast.success("IPO application submitted successfully.", { position: "top-center" })

                    if (isPrint && formValues.hasUPI === "NO") {
                        sessionStorage.setItem("category", selectedIPO?.category || "")
                        sessionStorage.setItem("companyname", selectedIPO?.companyname || "")
                        sessionStorage.setItem("companyAddress", selectedIPO?.companyAddress || "")
                        sessionStorage.setItem("logolink", selectedIPO?.logolink || "")
                        sessionStorage.setItem("cutoffprice", selectedIPO?.cutoffprice || "")
                        sessionStorage.setItem("mobile", clientDetails?.clientDetails?.mobile)
                        sessionStorage.setItem("BankName", formValues.bankName?.toString() || "")
                        sessionStorage.setItem("isin", selectedIPO?.isin || "")
                        sessionStorage.setItem("pan", clientDetails?.clientDetails?.pan)
                        sessionStorage.setItem("applicationno", responseData[0]?.applicationNo)
                        sessionStorage.setItem("calculatedAmount", calculatedAmount.toString() || "0")
                        sessionStorage.setItem("AccNo", formValues.bankAccountNO?.toString() || "")
                        sessionStorage.setItem("clientName", clientDetails?.clientDetails?.clientName)
                        sessionStorage.setItem("email", clientDetails?.clientDetails?.email)
                        sessionStorage.setItem("calculatedQuantity", formValues.quantity.toString())
                        sessionStorage.setItem("depository", dpDetails.depository)
                        sessionStorage.setItem("CDSLboid", dpDetails.boid)
                        sessionStorage.setItem("NSDLboid", dpDetails.boid)
                        sessionStorage.setItem("NSDLdpid", dpDetails.dpid)
                        setTimeout(() => {
                            router.push("/client/dashboard/ipo/RedirectToPrint")
                        }, 1000)
                    } else {
                        setTimeout(() => {
                            router.push(getCompatibleUrl("/client/dashboard/ipo"))
                            setSelectedIPO(null)
                        }, 3000)
                    }
                } else if (responseData[0]?.orderstatus === false) {
                    setTimeout(() => {
                        toast.error(responseData[0]?.error || "Failed to submit IPO application. Please try again.")
                        router.push(getCompatibleUrl("/client/dashboard/ipo"))
                        setSelectedIPO(null)
                    }, 3000)
                } else {
                    toast.error("Failed to submit IPO application. Please try again.", { position: "top-center" })
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred while submitting your application.")
        } finally {
            setSubmitting(false)
            if (setPrintModalOpen) setPrintModalOpen(false)
            if (setModalOpen) setModalOpen(false)
        }
    }

    return (
        <>
            <DashboardLayout>
                <div className="container mx-auto px-4 py-6 max-w-6xl">
                    <Card className="shadow-md border border-border">
                        <CardHeader className="sticky z-10 top-0 ">
                            <CardTitle className="text-lg">Apply for IPO: {selectedIPO?.companyname}</CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 md:p-6">
                            {error &&
                                <Alert variant="destructive" className="max-w-3xl mx-auto my-8">
                                    <AlertCircle className="h-5 w-5" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => router.push(getCompatibleUrl("/client/dashboard/ipo"))}
                                    >
                                        Return to IPO Dashboard
                                    </Button>
                                </Alert>
                            }
                            {clientDetails && (
                                <div className="mb-3 bg-muted/40 dark:bg-muted/20 p-4 rounded-lg border">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        {/* Avatar and Client Details */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div>
                                                {loading ? (
                                                    <Skeleton className="w-16 h-16 rounded-full" />
                                                ) : (
                                                    <Avatar className="w-16 h-16 border-2 border-primary/10">
                                                        <AvatarFallback className="bg-primary/5 text-primary">
                                                            <User className="w-8 h-8" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                            <div>
                                                {loading ? (
                                                    <>
                                                        <Skeleton className="h-6 w-48 mb-2" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-xl font-bold capitalize">{clientDetails.clientDetails?.clientName}</h3>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-sm font-medium py-1 px-2">
                                                                {clientDetails.clientDetails?.clientId}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-sm font-medium py-1 px-2 flex items-center gap-1"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" />
                                                                {clientDetails.clientDetails?.pan}
                                                            </Badge>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* BOID Select */}
                                        <div className="w-full md:w-auto">
                                            {loading ? (
                                                <Skeleton className="h-10 w-full md:w-64" />
                                            ) : (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Select BOID</label>
                                                    <Select
                                                        name="BOID"
                                                        onValueChange={(value) => {
                                                            form.setValue("selectedBOID", value)
                                                        }}
                                                        value={form.watch("selectedBOID")}
                                                        disabled={loading}
                                                    >
                                                        <SelectTrigger className="w-full md:w-64">
                                                            <SelectValue placeholder="Select BOID" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {clientDetails.applicantBoId?.map((bo: any) => (
                                                                <SelectItem key={bo.boid} value={bo.boid}>
                                                                    {bo.boid}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!error && <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <div className="space-y-6">
                                        <div className="bg-muted/40 dark:bg-muted/20 p-3 rounded-lg border">
                                            <div className="flex items-center gap-2 text-base font-medium mb-3">
                                                <Wallet className="h-4 w-4 text-primary" />
                                                <span>Payment Method</span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="hasUPI"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Do you have a UPI ID?</FormLabel>
                                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="YES" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-xs">Yes</FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="NO" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-xs">No</FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {hasUPI === "YES" && (
                                                    <FormField
                                                        control={form.control}
                                                        name="upiId"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem className="relative space-y-1">
                                                                    <FormLabel className="text-xs">UPI ID</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value || ""}
                                                                            placeholder="Enter your UPI ID (e.g., username@bank)"
                                                                            autoComplete="off"
                                                                            className="h-8 text-sm"
                                                                            onFocus={() => {
                                                                                if (upiSuggestionValue && !field.value) {
                                                                                    setShowSuggestion(true)
                                                                                }
                                                                            }}
                                                                            onBlur={() => {
                                                                                setTimeout(() => setShowSuggestion(false), 200)
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    {showSuggestion && upiSuggestionValue && !field.value && (
                                                                        <div className="absolute z-10 w-full bg-card border rounded-md shadow-md mt-1 p-1">
                                                                            <div
                                                                                className="cursor-pointer p-1.5 hover:bg-muted rounded flex items-center gap-2 text-xs"
                                                                                onClick={() => {
                                                                                    form.setValue("upiId", upiSuggestionValue)
                                                                                    setShowSuggestion(false)
                                                                                }}
                                                                            >
                                                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                                                {upiSuggestionValue}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <FormDescription className="text-xs">Format: username@bank</FormDescription>
                                                                    <FormMessage className="text-xs" />
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {hasUPI === "NO" && (
                                                <div className="grid md:grid-cols-2 gap-3 mt-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="bankAccountNO"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-1">
                                                                <FormLabel className="text-xs">Bank Account Number</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} disabled={true} className="h-8 text-sm" />
                                                                </FormControl>
                                                                <FormMessage className="text-xs" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="bankName"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-1">
                                                                <FormLabel className="text-xs">Bank Name</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        // Split the combined value to get bankName and accountNumber
                                                                        const [bankName, accountNumber] = value.split("|")

                                                                        // Update the form fields
                                                                        field.onChange(bankName)
                                                                        form.setValue("bankAccountNO", accountNumber)
                                                                    }}
                                                                    value={
                                                                        field.value && form.getValues("bankAccountNO")
                                                                            ? `${field.value}|${form.getValues("bankAccountNO")}`
                                                                            : ""
                                                                    }
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-8 text-sm">
                                                                            <SelectValue placeholder="Select bank" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {clientDetails?.bankDetails?.map((bank: any, index: number) => (
                                                                            <SelectItem
                                                                                key={`${bank.bankName}-${bank.accountNumber}-${index}`}
                                                                                value={`${bank.bankName}|${bank.accountNumber}`}
                                                                            >
                                                                                {bank.bankName} {bank.defaultAccount === "Yes" ? "(Default)" : ""} -{" "}
                                                                                {bank.accountNumber}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-xs" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-muted/40 dark:bg-muted/20 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 text-base font-medium mb-3">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <span>Depository Details</span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="depositoryId"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Depository ID</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} disabled={true} className="h-8 text-sm" />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="beneficiaryId"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Beneficiary ID</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} disabled={true} className="h-8 text-sm" />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-muted/40 dark:bg-muted/20 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 text-base font-medium mb-3">
                                                <AlertCircle className="h-4 w-4 text-primary" />
                                                <span>Investment Details</span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="lot"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Select Lot</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className="h-8 text-sm w-full justify-between"
                                                                        >
                                                                            {field.value
                                                                                ? `Lot: ${field.value}`
                                                                                : lotOptions.length > 0
                                                                                    ? `Lot: ${lotOptions[0]}`
                                                                                    : "Select lot"}
                                                                            <span className="sr-only">Toggle lot menu</span>
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-full p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search lot..." className="h-9" />
                                                                        <CommandList>
                                                                            <CommandEmpty>No lot found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {lotOptions.map((lot) => (
                                                                                    <CommandItem
                                                                                        key={lot}
                                                                                        value={lot}
                                                                                        onSelect={(value) => {
                                                                                            field.onChange(value)
                                                                                            form.setValue("lot", value)
                                                                                            calculateQuantityAndAmount(value)
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                field.value === lot ? "opacity-100" : "opacity-0",
                                                                                            )}
                                                                                        />
                                                                                        {lot}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormDescription className="text-xs">Number of lots to apply for</FormDescription>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="quantity"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Quantity</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                                                                    disabled={true}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </FormControl>
                                                            <FormDescription className="text-xs">Total shares based on selected lot</FormDescription>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                                                <FormField
                                                    control={form.control}
                                                    name="rate"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs">Rate</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value ? Number.parseFloat(e.target.value) : null
                                                                        field.onChange(value)
                                                                    }}
                                                                    value={field.value ?? ""}
                                                                    placeholder={`Enter rate (${selectedIPO?.minpricerange}-${selectedIPO?.maxpricerange})`}
                                                                    disabled={autoCutOff}
                                                                    className="h-8 text-sm"
                                                                    min={selectedIPO?.minpricerange}
                                                                    max={selectedIPO?.maxpricerange}
                                                                />
                                                            </FormControl>
                                                            <FormDescription className="text-xs">
                                                                {autoCutOff
                                                                    ? "Using cut-off price automatically"
                                                                    : `Range: ${selectedIPO?.minpricerange} - ${selectedIPO?.maxpricerange}`}
                                                            </FormDescription>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="autoCutOff"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-2 h-14">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={(checked) => {
                                                                        field.onChange(checked)
                                                                        if (checked) {
                                                                            form.setValue("rate", Number(selectedIPO?.maxpricerange) || null)
                                                                        } else {
                                                                            form.setValue("rate", null)
                                                                        }
                                                                    }}
                                                                    className="mt-0.5"
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-0 leading-none">
                                                                <FormLabel className="text-xs">Auto Cut-off Pricing</FormLabel>
                                                                <FormDescription className="text-xs">Use cut-off price automatically</FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Total Amount Section */}
                                        <div className="bg-muted/40 dark:bg-muted/20 p-3 rounded-md border">
                                            <div className="text-center">
                                                <h3 className="text-sm font-medium mb-1">Total Amount Payable</h3>
                                                <div className="text-lg font-bold text-primary">
                                                    {loading ? (
                                                        <Skeleton className="h-6 w-32 mx-auto" />
                                                    ) : (
                                                        <DecryptedText
                                                            animateOn="view"
                                                            revealDirection="center"
                                                            characters="12345678"
                                                            text={new Intl.NumberFormat("en-IN", {
                                                                style: "currency",
                                                                currency: "INR",
                                                            }).format(Number.parseFloat(calculatedAmount.toFixed(2)))}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {form.watch("lot")} lot(s) × {form.watch("quantity")} shares
                                                </p>
                                            </div>
                                        </div>

                                        <div className="sticky bottom-0 bg-card py-3 border-t mt-3 flex justify-between">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.push(getCompatibleUrl("/client/dashboard/ipo"))}
                                                className="h-9 text-xs"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                                Back to IPO List
                                            </Button>
                                            {hasUPI === "YES" ? (
                                                <Button type="submit" className="h-9 text-xs px-4" disabled={submitting}>
                                                    {submitting ? "Submitting..." : "Submit Application"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    className="h-9 text-xs px-4"
                                                    onClick={() => handlePrintIPO()}
                                                    disabled={submitting}
                                                >
                                                    {submitting ? "Processing..." : "Print IPO Form"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </Form>}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}

            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Confirm IPO Application</DialogTitle>
                            <DialogDescription className="pt-4">
                                Are you sure you want to submit this IPO application for {selectedIPO?.companyname}?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Company:</span>
                                <span className="font-medium">{selectedIPO?.companyname}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Lot(s):</span>
                                <span className="font-medium">{form.watch("lot")}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Quantity:</span>
                                <span className="font-medium">{form.watch("quantity")} shares</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(Number.parseFloat(calculatedAmount.toFixed(2)))}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Payment Method:</span>
                                <span className="font-medium">{hasUPI === "YES" ? "UPI" : "Bank Account"}</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => applyIPOForClient()} disabled={submitting}>
                                {submitting ? "Submitting..." : "Confirm"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {isPrintModalOpen && (
                <Dialog open={isPrintModalOpen} onOpenChange={setPrintModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Print IPO Form</DialogTitle>
                            <DialogDescription className="pt-4">
                                Are you sure you want to submit and print this IPO application?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Company:</span>
                                <span className="font-medium">{selectedIPO?.companyname}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Bank:</span>
                                <span className="font-medium">{form.watch("bankName")}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium">
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    }).format(Number.parseFloat(calculatedAmount.toFixed(2)))}
                                </span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPrintModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => applyIPOForClient(true)} disabled={submitting}>
                                {submitting ? "Processing..." : "Submit & Print"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {showApplyRestrictionModal && (
                <Alert className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="max-w-[425px] bg-card p-6 rounded-lg shadow-lg">
                        <AlertTitle className="mb-2 flex items-center gap-2 font-bold text-lg">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            IPO Application Restriction
                        </AlertTitle>
                        <AlertDescription className="m-4 p-2">
                            You have already applied for this{" "}
                            <span className="font-bold">{clientDetails?.ipoAppliedStatus?.companyName || ""}</span> IPO. Please check
                            in View Orders for details.
                            <p className="mt-4 p-2 bg-muted rounded-md">
                                Order Status: <span className="font-bold">{clientDetails?.ipoAppliedStatus?.orderStatus || ""}</span>
                            </p>
                        </AlertDescription>
                        <div className="flex justify-between mt-4 gap-4">
                            <Button variant="outline" onClick={() => router.push(getCompatibleUrl("/client/dashboard/ipo"))}>
                                Go to IPO Page
                            </Button>
                            <Button onClick={() => router.push(getCompatibleUrl("/client/dashboard/ipo/view-orders"))}>
                                View Orders
                            </Button>
                        </div>
                    </div>
                </Alert>
            )}
        </>
    )
}
