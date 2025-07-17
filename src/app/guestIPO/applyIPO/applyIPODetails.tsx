"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"
import DecryptedText from "@/components/ui/DecryptedText"
import { useIPO } from "@/contexts/IPOContext"
import { getIPOGuest } from "@/lib/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import Cookies from "js-cookie"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { ArrowRight, User, Wallet, Building, Calculator } from "lucide-react"
import { setLocalStorage } from "@/utils/localStorage"

export default function ApplyIPO() {
    const [ipoId, setIpoId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [calculatedAmount, setCalculatedAmount] = useState(11050.0)
    const [lotOptions, setLotOptions] = useState<string[]>(["1", "2", "3", "4", "5"])
    const [isModalOpen, setModalOpen] = useState(false)
    const { selectedIPO, setSelectedIPO } = useIPO()
    const [error, setError] = useState<string | null>(null)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [selectedBOID, setSelectedBOID] = useState("")
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 4
    const [formInitialized, setFormInitialized] = useState(false)

    useEffect(() => {
        const searchParamsipoId = searchParams.get("ipoId");

        if (searchParamsipoId) {
            // Remove ".html" if present at the end of ipoId
            const cleanedIpoId = searchParamsipoId.replace(/\.html$/, "");
            setIpoId(cleanedIpoId);
        } else {
            router.push(getCompatibleUrl(`/branch/dashboard/ipo`));
        }
    }, [router, searchParams]);


    const formSchema = z
        .object({
            panNo: z.string().min(10, "PAN Number must be 10 characters").max(10, "PAN Number must be 10 characters"),
            fullName: z.string().min(1, "Full Name is required"),
            mobileNumber: z.string().min(10, "Mobile Number must be 10 digits").max(10, "Mobile Number must be 10 digits"),
            emailId: z.string().email("Invalid email address"),
            category: z.enum(["individual", "shareholder"]),
            hasUPI: z.enum(["YES", "NO"]),
            upiId: z.string().optional().nullable(),
            bankAccountNO: z.string().optional(),
            bankName: z.string().optional(),
            depositoryId: z.enum(["CDSL", "NSDL"]),
            beneficiaryId: z.string().min(1, "Beneficiary ID is required"),
            depositoryParticipantId: z.string().optional(),
            selectedBOID: z.string().optional(),
            lot: z.string().min(1, "Lot is required"),
            quantity: z.number().int().positive("Quantity must be a positive integer"),
            rate: z.number().positive().nullable().optional(),
            autoCutOff: z.boolean(),
        })
        .refine(
            (data) => {
                if (data.hasUPI === "YES" && (!data.upiId || data.upiId.trim() === "")) {
                    return false
                }
                return true
            },
            {
                message: "UPI ID is required when UPI is selected",
                path: ["upiId"],
            },
        )
        .refine(
            (data) => {
                if (data.depositoryId === "CDSL" && data.beneficiaryId.length !== 16) {
                    return false
                }
                return true
            },
            {
                message: "Beneficiary ID must be 16 digits for CDSL",
                path: ["beneficiaryId"],
            },
        )
        .refine(
            (data) => {
                if (data.depositoryId === "NSDL" && data.beneficiaryId.length !== 8) {
                    return false
                }
                return true
            },
            {
                message: "Beneficiary ID must be 8 digits for NSDL",
                path: ["beneficiaryId"],
            },
        )
        .refine(
            (data) => {
                if (
                    data.depositoryId === "NSDL" &&
                    (!data.depositoryParticipantId || data.depositoryParticipantId.length !== 8)
                ) {
                    return false
                }
                return true
            },
            {
                message: "Depository Participant ID must be 8 digits for NSDL",
                path: ["depositoryParticipantId"],
            },
        )
        .refine(
            (data) => {
                if (data.hasUPI === "YES" && data.upiId) {
                    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
                    return upiRegex.test(data.upiId)
                }
                return true
            },
            {
                message: "Invalid UPI ID. Example format: username@bank",
                path: ["upiId"],
            },
        )

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            panNo: "",
            fullName: "",
            mobileNumber: "",
            emailId: "",
            category: "individual",
            hasUPI: "YES",
            upiId: "",
            bankAccountNO: "",
            bankName: "",
            depositoryId: "CDSL",
            beneficiaryId: "",
            depositoryParticipantId: "",
            selectedBOID: "",
            lot: "1",
            quantity: 1,
            rate: selectedIPO?.maxpricerange ? Number.parseFloat(selectedIPO.maxpricerange) : 0,
            autoCutOff: true,
        },
        mode: "onChange",
    })

    const hasUPI = form.watch("hasUPI")
    const autoCutOff = form.watch("autoCutOff")
    const depositoryId = form.watch("depositoryId")
    const beneficiaryId = form.watch("beneficiaryId")
    const depositoryParticipantId = form.watch("depositoryParticipantId")
    const selectedLot = form.watch("lot")

    // Update selectedBOID when beneficiaryId or depositoryParticipantId changes
    useEffect(() => {
        if (depositoryId === "CDSL" && beneficiaryId) {
            setSelectedBOID(beneficiaryId)
            form.setValue("selectedBOID", beneficiaryId, { shouldValidate: false })
        } else if (depositoryId === "NSDL" && depositoryParticipantId && beneficiaryId) {
            const boid = `IN${depositoryParticipantId}${beneficiaryId}`
            setSelectedBOID(boid)
            form.setValue("selectedBOID", boid, { shouldValidate: false })
        }
    }, [depositoryId, beneficiaryId, depositoryParticipantId, form])

    // Initialize form with default values when IPO is selected
    useEffect(() => {
        if (selectedIPO && !formInitialized) {
            const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")
            const maxLotSize = Number.parseInt(selectedIPO.maxlotsize || "0")
            const maxPriceRange = Number.parseFloat(selectedIPO.maxpricerange || "0")

            const calculatedLots = hasUPI === "YES" ? Math.floor(500000 / (noOfEquitySharesBid * cutoffPrice)) : maxLotSize

            const lotOptionsArray = Array.from({ length: calculatedLots }, (_, i) => (i + 1).toString())
            const calculatedQuantity = noOfEquitySharesBid * 1 // Always use 1 as the default lot
            const calculatedAmount = calculatedQuantity * cutoffPrice

            setCalculatedAmount(calculatedAmount)
            setLotOptions(lotOptionsArray)

            // Ensure form field sync without triggering validation
            form.setValue("lot", "1", { shouldValidate: false })
            form.setValue("quantity", calculatedQuantity, { shouldValidate: false })

            if (autoCutOff) {
                form.setValue("rate", maxPriceRange, { shouldValidate: false })
            } else {
                form.setValue("rate", null, { shouldValidate: false })
            }

            setFormInitialized(true)
        }
    }, [selectedIPO, hasUPI, autoCutOff, form, formInitialized])

    // Update quantity and amount when lot changes
    useEffect(() => {
        if (selectedIPO && selectedLot) {
            const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")
            const newQuantity = noOfEquitySharesBid * Number.parseInt(selectedLot)
            const newAmount = newQuantity * cutoffPrice

            form.setValue("quantity", newQuantity, { shouldValidate: false })
            setCalculatedAmount(newAmount)
        }
    }, [selectedIPO, selectedLot, form])

    // Update rate when autoCutOff changes
    useEffect(() => {
        if (selectedIPO) {
            const maxPriceRange = Number.parseFloat(selectedIPO.maxpricerange || "0")
            if (autoCutOff) {
                form.setValue("rate", maxPriceRange, { shouldValidate: false })
            }
        }
    }, [autoCutOff, selectedIPO, form])

    // Update lot options when hasUPI changes
    useEffect(() => {
        if (selectedIPO) {
            const noOfEquitySharesBid = Number.parseInt(selectedIPO.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO.cutoffprice || "0")
            const maxLotSize = Number.parseInt(selectedIPO.maxlotsize || "0")

            const calculatedLots = hasUPI === "YES" ? Math.floor(500000 / (noOfEquitySharesBid * cutoffPrice)) : maxLotSize

            const lotOptionsArray = Array.from({ length: calculatedLots }, (_, i) => (i + 1).toString())
            setLotOptions(lotOptionsArray)

            // Always set lot to "1" when options change without triggering validation
            form.setValue("lot", "1", { shouldValidate: false })

            // Update quantity based on new lot value
            const calculatedQuantity = noOfEquitySharesBid * 1
            form.setValue("quantity", calculatedQuantity, { shouldValidate: false })
            setCalculatedAmount(calculatedQuantity * cutoffPrice)
        }
    }, [hasUPI, selectedIPO, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // Make sure selectedBOID is set correctly before opening modal
        if (depositoryId === "CDSL" && beneficiaryId) {
            form.setValue("selectedBOID", beneficiaryId, { shouldValidate: false })
        } else if (depositoryId === "NSDL" && depositoryParticipantId && beneficiaryId) {
            form.setValue("selectedBOID", `IN${depositoryParticipantId}${beneficiaryId}`, { shouldValidate: false })
        }

        // Open the confirmation modal
        setModalOpen(true)
    }

    const handleApplyIPO = async () => {
        setLoading(true)
        setError(null)
        const formValues = form.getValues()

        const data = [
            {
                boid: formValues.beneficiaryId,
                dpid: formValues.depositoryParticipantId || "",
                depository: formValues.depositoryId,
                companyname: selectedIPO?.companyname,
                ipocompanymasterId: ipoId,
                name: formValues.fullName,
                pan: formValues.panNo,
                upiId: formValues.upiId,
                lotsapplied: formValues.lot,
                clientId: "GUESTUSER",
                mobile: formValues?.mobileNumber,
                email: formValues?.emailId,
                applicationno: "",
                quantity: formValues.quantity.toString(),
                rate: formValues.autoCutOff ? selectedIPO?.maxpricerange : formValues.rate?.toString(),
                formtype: formValues.hasUPI === "YES" ? "online" : "offline",
                cuttoffflag: formValues.autoCutOff ? "1" : "0",
                category: selectedIPO?.category || "Retail",
                companySymbol: selectedIPO?.companysymbol,
                actionCode: "n",
                Exchange: selectedIPO?.companylogoex,
            },
        ]

        try {
            const response = await getIPOGuest({ data })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }
            if (response?.data?.data) {
                const responseData = response.data.data
                if (responseData[0]?.orderstatus === true) {
                    // localStorage.setItem("applicationno", responseData[0]?.applicationNo)
                    setLocalStorage("applicationno", responseData[0]?.applicationNo)
                    toast.success("IPO application submitted successfully.", { position: "top-center" })
                    setSelectedIPO(null)
                    setTimeout(() => {
                        router.push(getCompatibleUrl("/guestIPO"))
                    }, 3000)
                } else {
                    throw new Error(responseData[0]?.message || "Failed to submit IPO application.")
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred while submitting the application.")
            toast.error(error instanceof Error ? error.message : "An error occurred while submitting the application.", {
                position: "top-center",
            })
        } finally {
            setLoading(false)
            setModalOpen(false)
        }
    }

    const nextStep = () => {
        const fieldsToValidate = {
            1: ["panNo", "fullName", "mobileNumber", "emailId", "category"],
            2: ["hasUPI", ...(hasUPI === "YES" ? ["upiId"] : ["bankAccountNO", "bankName"])],
            3: ["depositoryId", "beneficiaryId", ...(depositoryId === "NSDL" ? ["depositoryParticipantId"] : [])],
        }[currentStep]

        // Only validate the fields for the current step
        form.trigger(fieldsToValidate as any).then((isValid) => {
            if (isValid) {
                // Save current form state before moving to next step
                const currentValues = form.getValues()
                setCurrentStep((prev) => {
                    const newStep = Math.min(prev + 1, totalSteps)
                    // Ensure form values are preserved when moving to next step
                    setTimeout(() => {
                        Object.entries(currentValues).forEach(([key, value]) => {
                            if (value !== undefined && value !== null) {
                                form.setValue(key as any, value, { shouldValidate: false })
                            }
                        })
                    }, 0)
                    return newStep
                })
            }
        })
    }

    const prevStep = () => {
        // Save current form state before moving to previous step
        const currentValues = form.getValues()
        setCurrentStep((prev) => {
            const newStep = Math.max(prev - 1, 1)
            // Ensure form values are preserved when moving to previous step
            setTimeout(() => {
                Object.entries(currentValues).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        form.setValue(key as any, value, { shouldValidate: false })
                    }
                })
            }, 0)
            return newStep
        })
    }

    // Add this useEffect to ensure depositoryId and lot are always set
    useEffect(() => {
        // Ensure depositoryId is set to CDSL by default
        if (!form.getValues("depositoryId")) {
            form.setValue("depositoryId", "CDSL", { shouldValidate: false })
        }

        // Ensure lot is always set to "1" by default
        if (!form.getValues("lot")) {
            form.setValue("lot", "1", { shouldValidate: false })
        }
    }, [form, currentStep])

    if (error) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="p-6">
                    <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                    <Button className="mt-4 mx-auto block" onClick={() => router.push(getCompatibleUrl("/guestIPO"))}>
                        Back to IPO List
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const renderStepIndicator = () => {
        return (
            <div className="flex items-center justify-center mb-6">
                <div className="flex items-center w-full max-w-3xl">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <div key={index} className="flex-1 relative">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto z-10 relative
                                    ${currentStep > index + 1
                                        ? "bg-green-500 text-white"
                                        : currentStep === index + 1
                                            ? "bg-primary text-white"
                                            : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                {index + 1}
                            </div>
                            <div className="text-xs text-center mt-1 font-medium">
                                {["Personal Info", "Payment Method", "Demat Account", "Order Details"][index]}
                            </div>
                            {index < totalSteps - 1 && (
                                <div
                                    className={`absolute top-4 left-1/2 w-full h-0.5 
                                        ${currentStep > index + 1 ? "bg-green-500" : "bg-gray-200"}`}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderPersonalInfoStep = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Personal Information</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="panNo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">PAN Number</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="ABCDE1234F" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Full Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="As per PAN Card" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Mobile Number</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="10-digit mobile number" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="emailId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Email ID</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="your@email.com" type="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem className="bg-muted/50 p-4 rounded-lg">
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Investor Category</FormLabel>
                        <RadioGroup
                            onValueChange={(value) => {
                                // Only update the category field, nothing else
                                field.onChange(value)
                            }}
                            value={field.value}
                            className="flex flex-row space-y-1 items-center gap-6"
                        >
                            <FormItem className="flex items-center justify-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="individual" />
                                </FormControl>
                                <FormLabel className="font-normal">Individual / HUF</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="shareholder" />
                                </FormControl>
                                <FormLabel className="font-normal">Shareholder</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )

    const renderPaymentMethodStep = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Payment Method</h3>
            </div>
            <FormField
                control={form.control}
                name="hasUPI"
                render={({ field }) => (
                    <FormItem className="bg-muted/50 p-4 rounded-lg">
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Method</FormLabel>
                        <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value)
                                // Only clear UPI ID when switching to NO, don't affect other fields
                                if (value === "NO" && form.getValues("upiId")) {
                                    form.setValue("upiId", "", { shouldValidate: false })
                                }
                            }}
                            value={field.value}
                            className="flex flex-col space-y-3 mt-2"
                        >
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                                <FormControl>
                                    <RadioGroupItem value="YES" />
                                </FormControl>
                                <div>
                                    <FormLabel className="font-medium">UPI Payment</FormLabel>
                                    <FormDescription>Pay using UPI ID linked to your bank account</FormDescription>
                                </div>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                                <FormControl>
                                    <RadioGroupItem value="NO" />
                                </FormControl>
                                <div>
                                    <FormLabel className="font-medium">Pre-Print Form (ASBA)</FormLabel>
                                    <FormDescription>Application Supported by Blocked Amount through your bank</FormDescription>
                                </div>
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
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">UPI ID</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} placeholder="username@bank" />
                            </FormControl>
                            <FormDescription>Enter your UPI ID in the format username@bank (e.g., johndoe@okicici)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {hasUPI === "NO" && (
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="bankAccountNO"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bank Account Number</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Your bank account number" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bank Name & Branch</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., HDFC Bank, Andheri Branch" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    )

    const renderDematAccountStep = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Demat Account Details</h3>
            </div>
            <FormField
                control={form.control}
                name="depositoryId"
                render={({ field }) => (
                    <FormItem className="bg-muted/50 p-4 rounded-lg">
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Depository Type</FormLabel>
                        <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value)
                                // Only reset relevant fields when changing depository type
                                if (value !== depositoryId) {
                                    form.setValue("beneficiaryId", "", { shouldValidate: false })
                                    if (value === "NSDL") {
                                        form.setValue("depositoryParticipantId", "", { shouldValidate: false })
                                    }
                                }
                            }}
                            value={field.value}
                            className="flex flex-col space-y-3 mt-2"
                        >
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                                <FormControl>
                                    <RadioGroupItem value="CDSL" />
                                </FormControl>
                                <div>
                                    <FormLabel className="font-medium">CDSL</FormLabel>
                                    <FormDescription>Central Depository Services Limited</FormDescription>
                                </div>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                                <FormControl>
                                    <RadioGroupItem value="NSDL" />
                                </FormControl>
                                <div>
                                    <FormLabel className="font-medium">NSDL</FormLabel>
                                    <FormDescription>National Securities Depository Limited</FormDescription>
                                </div>
                            </FormItem>
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {depositoryId === "CDSL" ? (
                <div className="bg-white border rounded-lg p-4">
                    <FormField
                        control={form.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Beneficiary ID (16-digit)
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="16-digit Beneficiary ID" maxLength={16} />
                                </FormControl>
                                <FormDescription>Enter your 16-digit CDSL Beneficiary ID</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            ) : (
                <div className="bg-white border rounded-lg p-4 space-y-4">
                    <FormField
                        control={form.control}
                        name="depositoryParticipantId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Depository Participant ID (8-digit)
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="8-digit DP ID" maxLength={8} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Beneficiary ID (8-digit)
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="8-digit Client ID" maxLength={8} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {depositoryParticipantId && beneficiaryId && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md">
                            <p className="text-sm font-medium">Your NSDL ID:</p>
                            <p className="text-lg font-mono mt-1">
                                {depositoryParticipantId}
                                {beneficiaryId}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    const renderOrderDetailsStep = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Order Details</h3>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">IPO Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="font-medium">{selectedIPO?.companyname || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Symbol</p>
                        <p className="font-medium">{selectedIPO?.companysymbol || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Price Range</p>
                        <p className="font-medium">
                            ₹{selectedIPO?.minpricerange} - ₹{selectedIPO?.maxpricerange}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Lot Size</p>
                        <p className="font-medium">{selectedIPO?.noofequitysharesbid || "0"}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="lot"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Lot</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="1">
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select lot" defaultValue="1">
                                            {field.value || "1"}
                                        </SelectValue>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {lotOptions.map((lot) => (
                                        <SelectItem key={lot} value={lot}>
                                            {lot}
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
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                                    disabled={true}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="bg-white border rounded-lg p-4 space-y-4">
                <FormField
                    control={form.control}
                    name="autoCutOff"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked)
                                        if (checked) {
                                            form.setValue("rate", Number(selectedIPO?.maxpricerange) || null, { shouldValidate: false })
                                        } else {
                                            form.setValue("rate", null, { shouldValidate: false })
                                        }
                                    }}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Auto Cut-off Pricing</FormLabel>
                                <FormDescription>Enable this to automatically use the cut-off price for the IPO.</FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bid Price</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || null)}
                                    value={field.value ?? ""}
                                    placeholder={`Enter a rate between ${selectedIPO?.minpricerange} & ${selectedIPO?.maxpricerange}`}
                                    disabled={autoCutOff}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount Payable</p>
                    <div className="font-bold text-2xl md:text-3xl text-primary">
                        <DecryptedText
                            animateOn="view"
                            revealDirection="center"
                            characters="12345678"
                            text={new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                            }).format(Number.parseFloat(calculatedAmount.toFixed(2)))}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderPersonalInfoStep()
            case 2:
                return renderPaymentMethodStep()
            case 3:
                return renderDematAccountStep()
            case 4:
                return renderOrderDetailsStep()
            default:
                return null
        }
    }

    return (
        <>
            <div className="space-y-4 max-w-4xl mx-auto">
                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-xl md:text-2xl">Apply for IPO</CardTitle>
                        <CardDescription>
                            {selectedIPO?.companyname
                                ? `Apply for ${selectedIPO.companyname} IPO`
                                : "Complete the form to apply for IPO"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {renderStepIndicator()}

                        <Form {...form}>
                            <form
                                onSubmit={(e) => {
                                    // Prevent automatic form submission
                                    e.preventDefault()
                                    if (currentStep === totalSteps) {
                                        form.handleSubmit(onSubmit)(e)
                                    }
                                }}
                            >
                                {renderStepContent()}

                                <div className="flex justify-between mt-8 gap-3">
                                    {currentStep > 1 ? (
                                        <Button type="button" variant="outline" onClick={prevStep}>
                                            Previous
                                        </Button>
                                    ) : (
                                        <Button type="button" variant="outline" onClick={() => router.push(getCompatibleUrl("/guestIPO"))}>
                                            Back to IPO List
                                        </Button>
                                    )}

                                    {currentStep < totalSteps ? (
                                        <Button type="button" onClick={nextStep}>
                                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                                            {hasUPI === "YES" ? "Submit Application" : "Print IPO Form"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {showSessionExpiredModal && <SessionExpiredModal />}

            <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Apply IPO Confirmation</DialogTitle>
                        <DialogDescription className="py-2">Are you sure you want to submit the IPO application?</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="text-muted-foreground">Company:</p>
                            <p className="font-medium">{selectedIPO?.companyname}</p>

                            <p className="text-muted-foreground">Applicant:</p>
                            <p className="font-medium">{form.getValues().fullName}</p>

                            <p className="text-muted-foreground">Lot Size:</p>
                            <p className="font-medium">{form.getValues().lot}</p>

                            <p className="text-muted-foreground">Quantity:</p>
                            <p className="font-medium">{form.getValues().quantity}</p>

                            <p className="text-muted-foreground">Amount:</p>
                            <p className="font-medium">₹{calculatedAmount.toFixed(2)}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApplyIPO} disabled={loading}>
                            {loading ? "Submitting..." : "Confirm & Submit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

