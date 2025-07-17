"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "sonner"
import { getclientdataHO, applyIPOHO } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { useIPO } from "@/contexts/IPOContext"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, Search, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DecryptedText from "@/components/ui/DecryptedText"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useTheme } from "next-themes"

export default function ApplyIPO() {
    const { theme } = useTheme()
    const [ipoId, setIpoId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clientDetails, setClientDetails] = useState<any>(null)
    const [calculatedAmount, setCalculatedAmount] = useState(0)
    const [lotOptions, setLotOptions] = useState<string[]>([])
    const { selectedIPO, setSelectedIPO, setClientDetailsIPO } = useIPO()
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [showApplyRestrictionModal, setShowApplyRestrictionModal] = useState(false)
    const [showApplyRestrictionDialog, setShowApplyRestrictionDialog] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setModalOpen] = useState(false)
    const [clientId, setClientId] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isPrintModalOpen, setPrintModalOpen] = useState(false)
    const [showSuggestion, setShowSuggestion] = useState(false)
    const [upiSuggestionValue, setUpiSuggestionValue] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formInitialized, setFormInitialized] = useState(false)

    // Default form values
    const defaultFormValues = {
        hasUPI: "YES" as const,
        upiId: null,
        bankAccountNO: "",
        bankName: "",
        depositoryId: "",
        beneficiaryId: "",
        selectedBOID: "",
        lot: "1", // Set a default lot value
        quantity: 1,
        rate: selectedIPO?.maxpricerange ? Number.parseFloat(selectedIPO.maxpricerange) : 0,
        autoCutOff: true,
    }

    useEffect(() => {
        const searchParamsipoId = searchParams.get("ipoId")

        if (searchParamsipoId) {
            // Remove ".html" if present at the end of ipoId
            const cleanedIpoId = searchParamsipoId.replace(/\.html$/, "")
            setIpoId(cleanedIpoId)
        } else {
            router.push(getCompatibleUrl(`/branch/dashboard/ipo`))
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
        defaultValues: defaultFormValues,
    })

    const hasUPI = form.watch("hasUPI")
    const autoCutOff = form.watch("autoCutOff")
    const selectedBOID = form.watch("selectedBOID")
    const selectedLot = form.watch("lot")

    // Function to calculate quantity and amount based on lot
    const calculateQuantityAndAmount = useCallback(
        (lot: string) => {
            if (!selectedIPO) return

            const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")

            const newQuantity = noOfEquitySharesBid * Number.parseInt(lot || "1")
            const newAmount = newQuantity * cutoffPrice

            form.setValue("quantity", newQuantity, { shouldDirty: true, shouldTouch: true })
            setCalculatedAmount(newAmount)
        },
        [form, selectedIPO],
    )

    // Function to reset the form to default values
    const resetForm = () => {
        form.reset(defaultFormValues)
        setFormInitialized(false)
    }

    // Replace the handleSearch function with this updated version that ensures quantity is calculated correctly
    const handleSearch = async () => {
        if (!clientId.trim()) {
            setShowForm(false)
            toast.error("Please enter a Client ID / BOID")
            return
        }

        setLoading(true)

        // Reset form and state before loading new client data
        resetForm()
        setUpiSuggestionValue(null)
        setShowSuggestion(false)
        setShowApplyRestrictionModal(false)
        setShowApplyRestrictionDialog(false)
        setError(null)

        try {
            const response = await getclientdataHO({ clientId: clientId.trim(), ipoId: ipoId })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData) {
                // Set client details from the response
                if (response?.data?.data) {
                    if (parsedData?.status === false) {
                        toast.error(parsedData?.message || "Failed to fetch client data. Please try again.")
                        setShowForm(false)
                    } else {
                        const data = response.data.data

                        if (data.ipoAppliedStatus?.allowToApply === false) {
                            setShowApplyRestrictionModal(true)
                            setShowApplyRestrictionDialog(true)
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
                        setShowForm(true)

                    }
                } else {
                    throw new Error("Invalid API response format.")
                }
            } else {
                throw new Error("Failed to fetch Branch Holding data")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    // Initialize lot options and calculate initial quantity when IPO data is available
    useEffect(() => {
        if (selectedIPO) {
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
    }, [selectedIPO, hasUPI, form, autoCutOff])

    // Update quantity and amount when lot changes
    useEffect(() => {
        if (formInitialized && selectedLot) {
            calculateQuantityAndAmount(selectedLot)
        }
    }, [selectedLot, formInitialized, calculateQuantityAndAmount])

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
    //         <div className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/20 rounded-md">
    //             {error}
    //         </div>
    //     )
    // }

    const handlePrintIPO = () => {
        setPrintModalOpen(true)
        // setClientDetailsIPO({ clientDetails, ...form.getValues(), calculatedAmount })
        // router.push("/client/dashboard/ipo/printForm");
    }

    const applyIPOForClient = async (isPrint = false) => {
        setSubmitting(true)
        setError(null)
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
                rate: formValues.autoCutOff ? selectedIPO?.maxpricerange : formValues.rate,
                formtype: formValues.hasUPI === "YES" ? "online" : "offline",
                cuttoffflag: "0",
                category: selectedIPO?.category || "Retail",
                companySymbol: selectedIPO?.companysymbol,
                actionCode: "n",
                Exchange: selectedIPO?.companylogoex,
            },
        ]
        console.log(data);

        try {
            const response = await applyIPOHO({ data })
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
                        // setTimeout(() => {
                        //     router.push("/branch/dashboard/ipo/RedirectToPrint")
                        // }, 1000)
                        setTimeout(() => {
                            const url = calculatedAmount > 500000 ? "/printBackend.html" : "/print_form.html";

                            window.open(url, "_blank");
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            router.push(getCompatibleUrl("/branch/dashboard/ipo"))
                            setSelectedIPO(null)
                        }, 3000)
                    }
                } else if (responseData[0]?.orderstatus === false) {
                    setTimeout(() => {
                        toast.error(responseData[0]?.error || "Failed to submit IPO application. Please try again.")
                        router.push(getCompatibleUrl("/branch/dashboard/ipo"))
                        setSelectedIPO(null)
                    }, 3000)
                } else {
                    toast.error("Failed to submit IPO application. Please try again.", { position: "top-center" })
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred while fetching data.")
        } finally {
            setSubmitting(false)
            if (setPrintModalOpen) setPrintModalOpen(false)
            if (setModalOpen) setModalOpen(false)
        }
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4 max-w-5xl mx-auto">
                    <Card className="border dark:border-slate-800 shadow-sm">
                        <CardHeader className="sticky z-10 top-0 ">
                            <CardTitle className="text-lg">Apply for IPO: {selectedIPO?.companyname}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex flex-col items-center justify-center  bg-card dark:bg-card p-4 rounded-lg">
                                <div className="flex flex-col space-y-2 mb-4 w-full sm:w-96">
                                    <Label htmlFor="clientId">ClientID / BOID:</Label>
                                    <div className="flex items-center space-x-2 w-full">
                                        <Input
                                            id="clientId"
                                            type="text"
                                            placeholder="Enter Client ID/BOID"
                                            value={clientId}
                                            onChange={(e) => setClientId(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="w-full"
                                        />
                                        <Button onClick={handleSearch} disabled={loading} size="sm">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center w-full py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                            <span className="text-sm text-muted-foreground">Searching...</span>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center text-red-500 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/20 rounded-md w-full">
                                        {error}
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                            {showForm && (
                                <div className="p-0 md:p-6 my-6">
                                    {clientDetails && (
                                        <div className="mb-6 bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border dark:border-slate-800 transition-all duration-200">
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
                                                                <h3 className="text-xl font-bold capitalize">
                                                                    {clientDetails.clientDetails?.clientName}
                                                                </h3>
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
                                                <div className="w-full md:w-auto mt-4 md:mt-0">
                                                    {loading ? (
                                                        <Skeleton className="h-10 w-full md:w-64" />
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-muted-foreground">Select BOID</label>
                                                            <Select
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

                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)}>
                                            <div className="space-y-6">
                                                <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border dark:border-slate-800 transition-all duration-200">
                                                    <div className="flex items-center gap-2 text-base font-medium mb-4">
                                                        <span>💰 Payment Method</span>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="hasUPI"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Do you have a UPI ID?</FormLabel>
                                                                    <RadioGroup
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                        className="flex space-x-4"
                                                                    >
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="YES" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">Yes</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="NO" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">No</FormLabel>
                                                                        </FormItem>
                                                                    </RadioGroup>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {hasUPI === "YES" && (
                                                            <FormField
                                                                control={form.control}
                                                                name="upiId"
                                                                render={({ field }) => {
                                                                    return (
                                                                        <FormItem className="relative space-y-2">
                                                                            <FormLabel>UPI ID</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    {...field}
                                                                                    value={field.value || ""}
                                                                                    placeholder="Enter your UPI ID (e.g., username@bank)"
                                                                                    autoComplete="off"
                                                                                    className="h-10"
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
                                                                                <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1 p-1 dark:border-slate-700">
                                                                                    <div
                                                                                        className="cursor-pointer p-1.5 hover:bg-muted rounded flex items-center gap-2 text-sm"
                                                                                        onClick={() => {
                                                                                            form.setValue("upiId", upiSuggestionValue)
                                                                                            setShowSuggestion(false)
                                                                                        }}
                                                                                    >
                                                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                                                        {upiSuggestionValue}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <FormDescription>Format: username@bank</FormDescription>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {hasUPI === "NO" && (
                                                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                                                            <FormField
                                                                control={form.control}
                                                                name="bankAccountNO"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-2">
                                                                        <FormLabel>Bank Account Number</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} disabled={true} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="bankName"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-2">
                                                                        <FormLabel>Bank Name</FormLabel>
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
                                                                                <SelectTrigger>
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
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border dark:border-slate-800 transition-all duration-200">
                                                    <div className="flex items-center gap-2 text-base font-medium mb-4">
                                                        <span>🏦 Depository Details</span>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="depositoryId"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Depository ID</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} disabled={true} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="beneficiaryId"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Beneficiary ID</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} disabled={true} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border dark:border-slate-800 transition-all duration-200">
                                                    <div className="flex items-center gap-2 text-base font-medium mb-4">
                                                        <span>📈 Investment Details</span>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="lot"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Select Lot</FormLabel>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button variant="outline" role="combobox" className="w-full justify-between">
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
                                                                                <CommandInput placeholder="Search lot..." />
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
                                                                    <FormDescription>Number of lots to apply for</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="quantity"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Quantity</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                                                                            disabled={true}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>Total shares based on selected lot</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="rate"
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-2">
                                                                    <FormLabel>Rate</FormLabel>
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
                                                                            min={selectedIPO?.minpricerange}
                                                                            max={selectedIPO?.maxpricerange}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        {autoCutOff
                                                                            ? "Using cut-off price automatically"
                                                                            : `Range: ${selectedIPO?.minpricerange} - ${selectedIPO?.maxpricerange}`}
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="autoCutOff"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
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
                                                                        />
                                                                    </FormControl>
                                                                    <div className="space-y-1 leading-none">
                                                                        <FormLabel>Auto Cut-off Pricing</FormLabel>
                                                                        <FormDescription>Use cut-off price automatically</FormDescription>
                                                                    </div>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Total Amount Section */}
                                                <div className="bg-muted/30 dark:bg-muted/10 p-6 rounded-lg border dark:border-slate-800 transition-all duration-200">
                                                    <div className="text-center">
                                                        <h3 className="text-base font-medium mb-2">💵 Total Amount Payable</h3>
                                                        <div className="text-2xl font-bold">
                                                            {loading ? (
                                                                <Skeleton className="h-8 w-40 mx-auto" />
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
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            {form.watch("lot")} lot(s) × {form.watch("quantity")} shares
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="sticky bottom-0 bg-background dark:bg-background py-4 border-t mt-6 flex flex-col sm:flex-row justify-between gap-3 z-10">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => router.push(getCompatibleUrl("/branch/dashboard/ipo"))}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                                        Back to IPO List
                                                    </Button>
                                                    {hasUPI === "YES" ? (
                                                        <Button
                                                            type="submit"
                                                            className="w-full sm:w-auto"
                                                            disabled={submitting || showApplyRestrictionModal}
                                                        >
                                                            {submitting ? "Submitting..." : "✅ Submit Application"}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            className="w-full sm:w-auto"
                                                            onClick={() => handlePrintIPO()}
                                                            disabled={submitting || showApplyRestrictionModal}
                                                        >
                                                            {submitting ? "Processing..." : <>🖨️ Print IPO Form</>}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                    </Form>
                                </div>
                            )}
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
                                Are you sure you want to submit IPO application for <span className="font-bold"> {selectedIPO?.companyname}</span> Client <span className="font-bold">{clientId}</span>?
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
                                Are you sure you want to submit and print IPO application for <span className="font-bold"> {selectedIPO?.companyname}</span> Client <span className="font-bold">{clientId}</span>?
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
                <Dialog open={showApplyRestrictionDialog} onOpenChange={setShowApplyRestrictionDialog}>
                    <DialogContent className="max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                IPO Application Restriction
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-2">
                            <p className="mb-4">
                                Client <span className="font-bold">{clientId}</span> has already applied for this{" "}
                                <span className="font-bold">{clientDetails?.ipoAppliedStatus?.companyName || ""}</span> IPO. Please
                                check in View Orders for details.
                            </p>
                            <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-md mb-4">
                                <p>
                                    Order Status: <span className="font-bold">{clientDetails?.ipoAppliedStatus?.orderStatus || ""}</span>
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => router.push(getCompatibleUrl("/branch/dashboard/ipo"))}
                                className="w-full sm:w-auto"
                            >
                                Go to IPO Page
                            </Button>
                            <Button
                                onClick={() => router.push(getCompatibleUrl(`/branch/dashboard/ipo/view-ordersHO?ipoId=${selectedIPO?.ipoid}`))}
                                className="w-full sm:w-auto"
                            >
                                View History
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
