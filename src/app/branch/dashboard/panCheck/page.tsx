/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { z } from "zod"
import { format } from "date-fns"
import { CheckCircle, HelpCircle, XCircle, Printer } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { pancheck } from "@/lib/auth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Define the form schema with validations
const formSchema = z.object({
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format. Should be like ABCDE1234F"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    // .regex(/^\D*$/, "Numbers are not allowed"),
    dob: z.date({
        required_error: "Date of birth is required",
    }),
})

type FormValues = z.infer<typeof formSchema>

// Update the VerificationResultData type to handle boolean values
type VerificationResultData = {
    aadhaar_seeding_status: string | boolean
    name_as_per_pan_match: string | boolean
    category: string
    status: string
    date_of_birth_match: string | boolean
    checked_at: string
    pan?: string
}

export default function PANCheckForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [verificationResult, setVerificationResult] = useState<null | {
        success: boolean
        message: string
        data?: VerificationResultData
    }>(null)
    const [dateInputValue, setDateInputValue] = useState("")
    const [showResults, setShowResults] = useState(false)
    const printableAreaRef = useRef<HTMLDivElement>(null)

    // Refs for focus management
    const panInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const dobInputRef = useRef<HTMLInputElement>(null)
    const submitButtonRef = useRef<HTMLButtonElement>(null)

    // Initialize the form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pan: "",
            name: "",
        },
        mode: "onBlur",
    })

    // Calculate form completion percentage
    const calculateCompletion = () => {
        const fields = ["pan", "name", "dob"] as const
        const validFields = fields.filter((field) => {
            const state = form.getFieldState(field)
            return state.isDirty && !state.invalid
        })
        return Math.round((validFields.length / fields.length) * 100)
    }

    const formCompletion = calculateCompletion()

    // Parse date from yyyy-MM-dd (HTML input format) to Date object
    const parseDateFromInput = (dateString: string) => {
        if (!dateString) return null
        try {
            const [year, month, day] = dateString.split("-")
            if (!year || !month || !day) return null
            return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        } catch (error) {
            console.error("Error parsing date:", error)
            return null
        }
    }

    // Format date to yyyy-MM-dd for HTML input
    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return ""
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    // Capitalize first letter of a string
    const capitalizeFirstLetter = (string: string) => {
        return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase()
    }

    // Update the onSubmit function to handle the actual API response structure
    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true)
        setVerificationResult(null)
        setShowResults(false)

        try {
            // Format the date to dd/MM/yyyy for API
            const formattedDob = format(data.dob, "dd/MM/yyyy")

            // Make the API call
            const response = await pancheck({
                pan: data.pan,
                name: data.name,
                dob: formattedDob,
            })

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            // Check if the response has the expected structure
            if (response.data && response.data.data) {
                if (response.data.data.status === "SUCCESS") {
                    // Extract the verification data from the response
                    const responseData = response.data.data.data || response.data.data

                    // Create a properly formatted verification result
                    const verificationData: VerificationResultData = {
                        aadhaar_seeding_status: responseData.aadhaar_seeding_status,
                        name_as_per_pan_match: responseData.name_as_per_pan_match,
                        category: responseData.category,
                        status: responseData.status,
                        date_of_birth_match: responseData.date_of_birth_match,
                        checked_at: responseData.checked_at || format(new Date(), "dd/MM/yyyy HH:mm:ss"),
                        pan: responseData.pan || data.pan,
                    }

                    setVerificationResult({
                        success: true,
                        message: "PAN details have been verified successfully.",
                        data: verificationData,
                    })

                    setShowResults(true)

                    toast("Verification Successful", {
                        description: "PAN details have been verified successfully.",
                    })
                } else if (response.data.data.status === "FAILED") {
                    let errorMessage = "PAN verification failed."

                    if (typeof response.data.data.message === "object" && response.data.data.message.message) {
                        errorMessage = response.data.data.message.message
                    } else if (typeof response.data.data.message === "string") {
                        errorMessage = response.data.data.message
                    }

                    setVerificationResult({ success: false, message: errorMessage })

                    toast("Verification Failed", { description: errorMessage })
                } else {
                    setVerificationResult({
                        success: false,
                        message: "Failet to check PAN details.",
                    })

                    toast("Verification Failed", {
                        description: "Failet to check PAN details.",
                    })
                }
            } else {
                throw new Error("Invalid response format from server")
            }
        } catch (error) {
            console.error("Error:", error)

            setVerificationResult({
                success: false,
                message: error instanceof Error ? error.message : "An error occurred during verification",
            })

            toast("Verification Failed", {
                description: error instanceof Error ? error.message : "An error occurred during verification",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getFieldStatus = (fieldName: keyof FormValues) => {
        const fieldState = form.getFieldState(fieldName)
        // Only show status icon if the field has been touched
        if (fieldState.isDirty) {
            return fieldState.invalid ? (
                <XCircle className="h-5 w-5 text-red-500" />
            ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
            )
        }
        return null // Don't show any icon for untouched fields
    }

    const getFieldHint = (fieldName: "pan" | "name" | "dob") => {
        switch (fieldName) {
            case "pan":
                return "PAN should be in format ABCDE1234F (5 letters, 4 numbers, 1 letter)"
            case "name":
                return "Enter your full name as it appears on your PAN card"
            case "dob":
                return "Enter your date of birth"
        }
    }

    // Update the form value when the date input changes
    useEffect(() => {
        if (form.getValues().dob) {
            setDateInputValue(formatDateForInput(form.getValues().dob))
        }
    }, [form.getValues().dob])

    // Clear form fields
    const clearFields = () => {
        form.reset({
            pan: "",
            name: "",
            dob: undefined,
        })
        setDateInputValue("")
        setShowResults(false)
        setVerificationResult(null)
    }

    // Print functionality
    const handlePrint = () => {
        if (!printableAreaRef.current) return

        const printContent = printableAreaRef.current.innerHTML
        const originalContent = document.body.innerHTML

        // Create a new window for printing
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            toast("Print Error", {
                description: "Unable to open print window. Please check your browser settings.",
            })
            return
        }

        // Add print-specific styles
        printWindow.document.write(`
            <html>
                <head>
                    <title>PAN Verification</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: black;
                            background-color: white;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        .form-data {
                            margin-bottom: 20px;
                        }
                        .form-data div {
                            margin-bottom: 10px;
                        }
                        .label {
                            font-weight: bold;
                            display: inline-block;
                            width: 150px;
                        }
                        .value {
                            font-weight: 600;
                        }
                        .font-bigger {
                            font-size: 1.3em;
                            font-weight: bold;
                        }
                        .font-semibigger {
                            font-size: 1.1em;
                            font-weight: 600;
                        }
                        h1, h2, h3, h4 {
                            margin-top: 0;
                        }
                        @media print {
                            body {
                                margin: 0;
                                padding: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <h2>PAN Verification</h2>
                    <div class="form-data">
                        <div><span class="label">PAN:</span> <span class="value">${form.getValues().pan}</span></div>
                        <div><span class="label">Name on Card:</span> <span class="value">${form.getValues().name}</span></div>
                        <div><span class="label">Date of Birth:</span> <span class="value">${form.getValues().dob ? format(form.getValues().dob, "dd/MM/yyyy") : ""}</span></div>
                    </div>
                    ${verificationResult && verificationResult.data
                ? `
        <table>
            <thead>
                <tr>
                    <th><span class="font-bigger">Aadhaar Seeding Status</span></th>
                    <th><span class="font-bigger">Name as per PAN Match</span></th>
                    <th><span class="font-bigger">Category</span></th>
                    <th><span class="font-bigger">Status</span></th>
                    <th><span class="font-bigger">Date of Birth Match</span></th>
                    <th><span class="font-bigger">Checked At</span></th>
                </tr>
            </thead>
            <tbody>
                <tr class="font-semibigger">
                    <td>${typeof verificationResult.data.aadhaar_seeding_status === "boolean"
                    ? verificationResult.data.aadhaar_seeding_status
                        ? "Yes"
                        : "No"
                    : verificationResult.data.aadhaar_seeding_status
                }</td>
                    <td>${typeof verificationResult.data.name_as_per_pan_match === "boolean"
                    ? verificationResult.data.name_as_per_pan_match
                        ? "Yes"
                        : "No"
                    : verificationResult.data.name_as_per_pan_match
                }</td>
                    <td>${capitalizeFirstLetter(verificationResult.data.category)}</td>
                    <td>${capitalizeFirstLetter(verificationResult.data.status)}</td>
                    <td>${typeof verificationResult.data.date_of_birth_match === "boolean"
                    ? verificationResult.data.date_of_birth_match
                        ? "Yes"
                        : "No"
                    : verificationResult.data.date_of_birth_match
                }</td>
                    <td>${verificationResult.data.checked_at}</td>
                </tr>
            </tbody>
        </table>
    `
                : ""
            }
                </body>
            </html>
        `)

        // Print and close the window
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    return (
        <>
            <DashboardLayout>
                <div className="container mx-auto px-4 py-6 max-w-5xl" ref={printableAreaRef}>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-2">PAN Verification</h1>
                        <p className="text-muted-foreground">Verify your PAN details for KYC compliance</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="shadow-md">
                            <CardHeader className="border-b pb-4">
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        <CardTitle className="text-xl font-bold">PAN Check</CardTitle>
                                        <CardDescription className="mt-1">
                                            Please enter PAN along with required details to verify
                                        </CardDescription>
                                    </div>
                                    {showResults && (
                                        <Button size="sm" onClick={handlePrint} className="flex items-center gap-1">
                                            <Printer className="h-4 w-4" />
                                            Print
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="pan"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-slate-700 font-medium">PAN Number *</FormLabel>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            tabIndex={-1} // Remove from tab order
                                                                        >
                                                                            <HelpCircle className="h-4 w-4" />
                                                                            <span className="sr-only">PAN format help</span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{getFieldHint("pan")}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="ABCDE1234F"
                                                                    maxLength={10}
                                                                    {...field}
                                                                    ref={(e) => {
                                                                        // This properly merges the refs
                                                                        panInputRef.current = e
                                                                        if (typeof field.ref === "function") {
                                                                            field.ref(e)
                                                                        } else if (field.ref) {
                                                                            ; (field.ref as React.MutableRefObject<HTMLInputElement | null>).current = e
                                                                        }
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.toUpperCase()
                                                                        field.onChange(value)
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab" && !e.shiftKey) {
                                                                            // Move focus to name input on Tab
                                                                            if (nameInputRef.current) {
                                                                                e.preventDefault()
                                                                                nameInputRef.current.focus()
                                                                            }
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        field.onBlur()
                                                                        // Validate on blur
                                                                        const value = e.target.value
                                                                        if (value && value.length > 0) {
                                                                            if (value.length < 10) {
                                                                                form.setError("pan", {
                                                                                    type: "manual",
                                                                                    message: "PAN number must be 10 characters",
                                                                                })
                                                                            } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                                                                                form.setError("pan", {
                                                                                    type: "manual",
                                                                                    message: "Invalid PAN format. Should be like ABCDE1234F",
                                                                                })
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`${form.formState.errors.pan ? "border-red-500 focus-visible:ring-red-500" : ""} pr-10`}
                                                                />
                                                                <div className="absolute inset-y-0 right-3 flex items-center">
                                                                    {getFieldStatus("pan")}
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-slate-700 font-medium">Name on Card *</FormLabel>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            tabIndex={-1} // Remove from tab order
                                                                        >
                                                                            <HelpCircle className="h-4 w-4" />
                                                                            <span className="sr-only">Name format help</span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{getFieldHint("name")}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="Enter your full name"
                                                                    {...field}
                                                                    ref={(e) => {
                                                                        nameInputRef.current = e
                                                                        if (typeof field.ref === "function") {
                                                                            field.ref(e)
                                                                        } else if (field.ref) {
                                                                            ; (field.ref as React.MutableRefObject<HTMLInputElement | null>).current = e
                                                                        }
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value
                                                                        field.onChange(value)
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab" && !e.shiftKey) {
                                                                            // Move focus to DOB input on Tab
                                                                            if (dobInputRef.current) {
                                                                                e.preventDefault()
                                                                                dobInputRef.current.focus()
                                                                            }
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        field.onBlur()
                                                                        // Validate on blur
                                                                        const value = e.target.value
                                                                        if (value) {
                                                                            if (value.length < 2) {
                                                                                form.setError("name", {
                                                                                    type: "manual",
                                                                                    message: "Name must be at least 2 characters",
                                                                                })
                                                                            } else {
                                                                                form.clearErrors("name")
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`${form.formState.errors.name ? "border-red-500 focus-visible:ring-red-500" : ""} pr-10`}
                                                                />
                                                                <div className="absolute inset-y-0 right-3 flex items-center">
                                                                    {getFieldStatus("name")}
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="dob"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-slate-700 font-medium">PAN DOB *</FormLabel>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" tabIndex={-1}>
                                                                            <HelpCircle className="h-4 w-4" />
                                                                            <span className="sr-only">DOB requirements help</span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{getFieldHint("dob")}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="date"
                                                                    max={format(new Date(), "yyyy-MM-dd")}
                                                                    {...field}
                                                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                                    onChange={(e) => {
                                                                        const date = e.target.value ? new Date(e.target.value) : null
                                                                        field.onChange(date)
                                                                    }}
                                                                    ref={(e) => {
                                                                        dobInputRef.current = e
                                                                        if (typeof field.ref === "function") {
                                                                            field.ref(e)
                                                                        } else if (field.ref) {
                                                                            ; (field.ref as React.MutableRefObject<HTMLInputElement | null>).current = e
                                                                        }
                                                                    }}
                                                                    className={`${form.formState.errors.dob ? "border-red-500 focus-visible:ring-red-500" : ""} pr-10`}
                                                                />
                                                                <div className="absolute inset-y-0 right-3 flex items-center">
                                                                    {getFieldStatus("dob")}
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="flex justify-center gap-4 mt-6">
                                            <Button
                                                ref={submitButtonRef}
                                                type="submit"
                                                className="px-8"
                                                disabled={isSubmitting || !form.formState.isValid || formCompletion < 100}
                                            >
                                                {isSubmitting ? "Verifying..." : "Submit"}
                                            </Button>
                                            <Button type="button" variant="outline" className="px-8" onClick={clearFields}>
                                                Clear
                                            </Button>
                                        </div>

                                        <div className="text-sm text-muted-foreground mt-4">Note: All fields are mandatory to enter*</div>
                                    </form>
                                </Form>

                                {verificationResult && verificationResult.success === false && (
                                    <Alert variant="destructive" className="mt-6">
                                        <AlertTitle>Verification Failed</AlertTitle>
                                        <AlertDescription>{verificationResult.message}</AlertDescription>
                                    </Alert>
                                )}

                                {showResults && verificationResult && verificationResult.data && (
                                    <div className="mt-8">
                                        <Table>
                                            <TableHeader className="bg-slate-100 border">
                                                <TableRow className="border-b-2 border-slate-200">
                                                    <TableHead className="font-bold text-base border">Aadhaar Seeding Status</TableHead>
                                                    <TableHead className="font-bold text-base border">Name as per PAN Match</TableHead>
                                                    <TableHead className="font-bold text-base border">Category</TableHead>
                                                    <TableHead className="font-bold text-base border">Status</TableHead>
                                                    <TableHead className="font-bold text-base border">Date of Birth Match</TableHead>
                                                    <TableHead className="font-bold text-base border">Checked At</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-medium text-base border">
                                                        {typeof verificationResult.data.aadhaar_seeding_status === "boolean"
                                                            ? verificationResult.data.aadhaar_seeding_status
                                                                ? "Yes"
                                                                : "No"
                                                            : verificationResult.data.aadhaar_seeding_status}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-base border">
                                                        {typeof verificationResult.data.name_as_per_pan_match === "boolean"
                                                            ? verificationResult.data.name_as_per_pan_match
                                                                ? "Yes"
                                                                : "No"
                                                            : verificationResult.data.name_as_per_pan_match}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-base border">
                                                        {capitalizeFirstLetter(verificationResult.data.category)}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-base border">
                                                        {capitalizeFirstLetter(verificationResult.data.status)}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-base border">
                                                        {typeof verificationResult.data.date_of_birth_match === "boolean"
                                                            ? verificationResult.data.date_of_birth_match
                                                                ? "Yes"
                                                                : "No"
                                                            : verificationResult.data.date_of_birth_match}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-base border">
                                                        {verificationResult.data.checked_at}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

