"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { CheckCircle, XCircle, PencilIcon } from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"
import { useIPO } from "@/contexts/IPOContext"
import { updateIpoMasterDetails } from "@/api/auth"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { getCompatibleUrl } from "@/utils/url-helpers"

const categorySchema = z
    .object({
        category: z.string(),
        ApplicationFormNoStart: z.string().optional(),
        ApplicationFormNoEnd: z.string().optional(),
    })
    .refine(
        (data) => {
            return (
                (!data.ApplicationFormNoStart && !data.ApplicationFormNoEnd) ||
                (data.ApplicationFormNoStart && data.ApplicationFormNoEnd)
            )
        },
        {
            message: "Both fields are required if one is filled",
            path: ["ApplicationFormNoStart", "ApplicationFormNoEnd"], // Apply error to both fields
        },
    )

const ipoSchema = z.object({
    companyname: z.string().min(1, { message: "Company name is required" }),
    ISIN: z.string().min(1, { message: "ISIN is required" }),
    CompanyAddress: z.string().min(1, { message: "Company address is required" }),
    TypeOfIssue: z.string().min(1, { message: "Type of issue is required" }),
    IssueSize: z.string().min(1, { message: "Issue size is required" }),
    MaxLotSize: z.string().min(0, { message: "Max lot size must be a non-negative number" }),
    RunningApplNo: z.string().optional(),
    categories: z.array(categorySchema),
})

type IPOFormData = z.infer<typeof ipoSchema>

export default function UpdateDetails() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [isFormDirty, setIsFormDirty] = useState(false)
    const { selectedIPO, setSelectedIPO } = useIPO()
    const [machineIP, setMachineIP] = useState("")
    const router = useRouter()

    // Track default values dynamically
    const [initialValues, setInitialValues] = useState(() => ({
        CompanyAddress: selectedIPO?.companyAddress || "",
        RunningApplNo: "",
        TypeOfIssue: selectedIPO?.typeofissue || "",
        IssueSize: selectedIPO?.issuesize || "",
        MaxLotSize: selectedIPO?.maxlotsize || "",
        companyname: selectedIPO?.companyname || "",
        ISIN: selectedIPO?.isin || "",
        categories: (selectedIPO?.categories as []) || [],
    }))

    const form = useForm<IPOFormData>({
        resolver: zodResolver(ipoSchema),
        defaultValues: initialValues,
        mode: "onChange", // Enable validation on change
    })

    // Reset form when selectedIPO changes
    useEffect(() => {
        const updatedValues = {
            CompanyAddress: selectedIPO?.companyAddress || "",
            RunningApplNo: "",
            TypeOfIssue: selectedIPO?.typeofissue || "",
            IssueSize: selectedIPO?.issuesize || "",
            MaxLotSize: selectedIPO?.maxlotsize || "",
            companyname: selectedIPO?.companyname || "",
            ISIN: selectedIPO?.isin || "",
            categories: (selectedIPO?.categories as []) || [],
        }

        setInitialValues(updatedValues)
        form.reset(updatedValues)
        setIsFormDirty(false)
    }, [selectedIPO, form])

    useEffect(() => {
        const subscription = form.watch((value) => {
            const isDirty = JSON.stringify(value) !== JSON.stringify(initialValues)
            setIsFormDirty(isDirty)
        })
        return () => subscription.unsubscribe()
    }, [form, form.watch, initialValues])

    useEffect(() => {
        const index = form.watch("categories")?.findIndex((cat) => cat.category === selectedIPO?.category)
        if (index !== -1) {
            form.setValue(`categories.${index}.ApplicationFormNoStart`, selectedIPO?.applicationformnostart ?? undefined)
            form.setValue(`categories.${index}.ApplicationFormNoEnd`, selectedIPO?.applicationformnoend ?? undefined)
        }
    }, [selectedIPO, form])

    useEffect(() => {
        fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => {
                setMachineIP(data.ip)
            })
            .catch((error) => console.error("Error fetching IP address:", error))
    }, [])

    // Check if the form is valid
    const isFormValid = form.formState.isValid

    // Function to validate categories
    const validateCategories = () => {
        const categories = form.getValues("categories") || []

        // If NSE, we don't need to validate categories
        if (selectedIPO?.companylogoex === "NSE") {
            return true
        }

        // For non-NSE, check if at least one category has both start and end values
        return categories.some((cat) => cat.ApplicationFormNoStart && cat.ApplicationFormNoEnd)
    }

    const onSubmit = async (values: IPOFormData) => {
        // Additional validation for categories
        if (selectedIPO?.companylogoex !== "NSE" && !validateCategories()) {
            toast.error("At least one category must have both start and end application form numbers.")
            return
        }

        try {
            const commonData = {
                companyname: values.companyname,
                ISIN: values.ISIN,
                CompanyAddress: values.CompanyAddress,
                TypeOfIssue: values.TypeOfIssue,
                IssueSize: values.IssueSize,
                MaxLotSize: values.MaxLotSize,
                MachineIP: machineIP,
            }

            const requestData = values.categories
                .filter((category) => category.ApplicationFormNoStart && category.ApplicationFormNoEnd)
                .map((category) => ({
                    ...commonData,
                    Category: category.category,
                    ApplicationFormNoStart: category.ApplicationFormNoStart,
                    ApplicationFormNoEnd: category.ApplicationFormNoEnd,
                    RunningApplNo: category.ApplicationFormNoStart,
                    Status: "Active",
                }))

            const response = await updateIpoMasterDetails({ data: requestData })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = response.data.data

            if (parsedData?.status === "success") {
                toast.success("IPO details updated successfully.")
                setSelectedIPO(null)
                setIsFormDirty(false)
                setMachineIP("")
                router.push(getCompatibleUrl("/branch/dashboard/ipo"))
            } else {
                throw new Error(parsedData?.error || "Failed to update IPO details")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred while updating the IPO details.")
        }
    }

    const renderField = (name: string, label: string, type = "text", required = true) => {
        // Get the error for this field
        const error = form.formState.errors
        const fieldError = name.includes(".")
            ? name.split(".").reduce((obj, key) => obj && obj[key], form.formState.errors)
            : form.formState.errors[name]

        const isDirty = form.formState.dirtyFields[name as keyof typeof form.formState.dirtyFields]

        return (
            <div className="space-y-2">
                <Label htmlFor={name} className={`text-sm font-medium ${fieldError ? "text-red-500" : ""}`}>
                    {label} {required && "*"}
                </Label>
                <div className="relative">
                    <Controller
                        name={name as any}
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type={type}
                                className={`pr-10 ${fieldError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                                value={field.value?.toString() || ""}
                                min={type === "number" ? 0 : undefined}
                            />
                        )}
                    />
                    <PencilIcon className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                {fieldError && (
                    <p className="text-sm text-red-500 mt-1">
                        {typeof fieldError.message === "string" ? fieldError.message : "This field is required"}
                    </p>
                )}
            </div>
        )
    }

    // Check if any category has validation errors
    const hasCategoryErrors = form.formState.errors.categories ? true : false


    // Add this useEffect after the other useEffect hooks
    useEffect(() => {
        // Trigger validation when form is dirty
        if (isFormDirty) {
            form.trigger()
        }
    }, [isFormDirty, form])


    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Update IPO Details: {selectedIPO?.companyname}</CardTitle>
                        </CardHeader>

                        <div className="flex flex-wrap items-center justify-center gap-6 space-y-2 sm:space-y-0 p-6">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Exchange:</span>
                                <Badge variant="outline" className="text-sm py-1">
                                    {selectedIPO?.companylogoex || "N/A"}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Status:</span>
                                {selectedIPO?.status === "Active" ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span
                                    className={`text-sm font-medium ${selectedIPO?.status === "Active" ? "text-green-500" : "text-red-500"}`}
                                >
                                    {selectedIPO?.status || "Unknown"}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            {!isFormValid && isFormDirty && form.formState.submitCount > 0 && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-6 mb-4">
                                    <p className="font-medium">Please fix the following errors:</p>
                                    <ul className="list-disc list-inside text-sm mt-1">
                                        {Object.keys(form.formState.errors).map((key) => (
                                            <li key={key}>
                                                {key === "categories" ? "Category information is incomplete" : `${key} is required`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 container mx-auto py-8">
                                {renderField("companyname", "Company Name")}
                                {renderField("ISIN", "ISIN")}
                                {renderField("CompanyAddress", "Company Address")}
                                {renderField("TypeOfIssue", "Type of Issue")}
                                {renderField("IssueSize", "Issue Size")}
                                {renderField("MaxLotSize", "Max Lot Size", "number")}
                            </CardContent>

                            {selectedIPO?.companylogoex !== "NSE" && (
                                <div className="container mx-auto px-6 mb-6">
                                    <h3 className="font-semibold text-lg mb-4">Category Information</h3>
                                    {hasCategoryErrors && (
                                        <div className="text-red-500 mb-4 text-sm">
                                            At least one category must have both start and end application form numbers.
                                        </div>
                                    )}

                                    {form.watch("categories")?.map((category, index) => (
                                        <div
                                            key={index}
                                            className="space-y-4 flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl p-4 mx-auto border rounded-md mb-4"
                                        >
                                            <h3 className="font-semibold w-full sm:w-auto">{category.category}:</h3>
                                            <div className="w-full sm:w-auto">
                                                {renderField(
                                                    `categories.${index}.ApplicationFormNoStart`,
                                                    "Application Form No. Start",
                                                    "text",
                                                    false,
                                                )}
                                            </div>
                                            <div className="w-full sm:w-auto">
                                                {renderField(
                                                    `categories.${index}.ApplicationFormNoEnd`,
                                                    "Application Form No. End",
                                                    "text",
                                                    false,
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4 flex flex-col sm:flex-row items-center justify-between container w-full max-w-2xl p-4 mx-auto">
                                <Button
                                    type="submit"
                                    className="w-full md:w-auto mx-auto"
                                    disabled={!isFormDirty || (!isFormValid && form.formState.submitCount > 0)}
                                >
                                    {form.formState.isSubmitting ? "Submitting..." : "Submit Changes"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}
