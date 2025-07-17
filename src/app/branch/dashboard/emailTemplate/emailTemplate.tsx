"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { emailTemplate, sendEmailTemplate, createEmailTemplate, getSendgridApiKey } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { toast } from "sonner"
import { CreateTemplateDialog } from "./create-template-dialog"
import { PlusCircle, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

interface TemplateOption {
    id: string
    name: string
}

interface AccountStatus {
    account_type: string
    can_send_email: boolean
    limit_reached: number
    total_limit: number
    status_message: string
}

interface AccountType {
    id: string
    name: string
}

const isValidEmail = (email: string) => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

export default function EmailTemplate() {
    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [sendTo, setSendTo] = useState<string>("")
    const [fromEmail, setFromEmail] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false)
    const [subject, setSubject] = useState("")
    const [textContent, setTextContent] = useState("")
    const [audienceFile, setAudienceFile] = useState<File | null>(null)
    const [attachment, setAttachment] = useState<File | null>(null)
    const [currentEmailInput, setCurrentEmailInput] = useState("")
    const [showFileUpload, setShowFileUpload] = useState(false)
    const [emailTarget, setEmailTarget] = useState("")
    const [apTemplateId, setApTemplateId] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [scheduledDateTime, setScheduledDateTime] = useState<string>("")
    const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
    const [selectedAccountType, setSelectedAccountType] = useState<string>("")
    const [accountStatusData, setAccountStatusData] = useState<AccountStatus[]>([])
    const [currentAccountStatus, setCurrentAccountStatus] = useState<AccountStatus | null>(null)
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

    const getTemplateNames = useCallback(async () => {
        if (!selectedAccountType) return

        setIsLoadingTemplates(true)
        setError(null)
        try {
            const requestBody = { accountType: selectedAccountType }
            const response = await emailTemplate(requestBody)
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (response.data.data) {
                setTemplateOptions(
                    parsedData.templates.map((template: any) => ({
                        id: template.id,
                        name: template.name,
                    })),
                )
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch template data.")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
            toast.error(error.message || "Failed to load templates")
        } finally {
            setIsLoadingTemplates(false)
        }
    }, [selectedAccountType])

    const getAccountTypes = async () => {
        setLoading(true)
        try {
            const response = await getSendgridApiKey()
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            if (response?.data?.data) {
                const accountStatus = response?.data?.data?.account_status

                // Store complete account status data
                setAccountStatusData(accountStatus)

                // Create account type options for dropdown
                const accountTypeOptions = accountStatus.map((account: AccountStatus) => ({
                    id: account.account_type,
                    name: account.account_type,
                }))
                setAccountTypes(accountTypeOptions)

                // Auto-select PRIMARY if it exists, otherwise select the first available
                const primaryAccount = accountStatus.find((account: AccountStatus) => account.account_type === "PRIMARY")
                const accountToSelect = primaryAccount || accountStatus[0]

                if (accountToSelect) {
                    // Use setTimeout to ensure the state updates properly
                    setTimeout(() => {
                        setSelectedAccountType(accountToSelect.account_type)
                        setCurrentAccountStatus(accountToSelect)
                    }, 100)
                }

                // Display status messages if any
                accountStatus.forEach((account: AccountStatus) => {
                    if (account.status_message && account.status_message.trim()) {
                        toast.info(`${account.account_type}: ${account.status_message}`)
                    }
                })
            }
        } catch (error: any) {
            console.error("Failed to fetch account types:", error)
            setError("Failed to load account types: " + (error.message || "Unknown error"))
            toast.error("Failed to load account types")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getAccountTypes()
    }, [])

    useEffect(() => {
        if (selectedAccountType && accountStatusData.length > 0) {
            // Clear existing templates when account type changes
            setTemplateOptions([])
            setSelectedTemplateId("")

            // Update current account status
            const accountStatus = accountStatusData.find((account) => account.account_type === selectedAccountType)
            setCurrentAccountStatus(accountStatus || null)

            // Auto-load templates for the selected account type
            getTemplateNames()
        }
    }, [accountStatusData, getTemplateNames, selectedAccountType]) // Remove accountStatusData from dependencies to prevent loops

    useEffect(() => {
        setShowFileUpload(["kyc_update", "email_list", "clientid_list", "branchcode_list"].includes(sendTo))
    }, [sendTo])

    const getISTDateTime = () => {
        const now = new Date()

        // Convert to IST timezone
        const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })

        // Convert back to Date object
        const istDate = new Date(istTime)

        // Format the date and time
        const year = istDate.getFullYear()
        const month = String(istDate.getMonth() + 1).padStart(2, "0") // Months are 0-based
        const day = String(istDate.getDate()).padStart(2, "0")
        const hours = String(istDate.getHours()).padStart(2, "0")
        const minutes = String(istDate.getMinutes()).padStart(2, "0")
        const seconds = String(istDate.getSeconds()).padStart(2, "0")

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Clear previous errors
        setError(null)

        // Form validation
        if (!selectedAccountType) {
            const errorMsg = "Please select an Account Type."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if (currentAccountStatus && !currentAccountStatus.can_send_email) {
            const errorMsg = "Email sending is not allowed for the selected account type."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        // Add this new validation
        if (currentAccountStatus && currentAccountStatus.limit_reached >= currentAccountStatus.total_limit) {
            const errorMsg = "Email limit reached. Please update your account to continue sending emails."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if ((!selectedTemplateId && selectedTemplateId !== "NONE") || !sendTo) {
            const errorMsg = "Please select both Template Name and Audience options."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if (selectedTemplateId === "NONE" && !subject) {
            const errorMsg = "Please enter a subject when no template is selected."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if (selectedTemplateId === "NONE" && !attachment) {
            const errorMsg = "Please attach a file when no template is selected."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if (sendTo === "Text" && !textContent.trim()) {
            const errorMsg = "Please enter at least one email address."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        if (emailTarget && !apTemplateId) {
            const errorMsg = "Please select a template for AP notification."
            setError(errorMsg)
            toast.error(errorMsg)
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            const dataObject = {
                fromEmail: fromEmail || "",
                accountType: selectedAccountType,
                templateId: selectedTemplateId === "NONE" ? "" : selectedTemplateId,
                templateName:
                    selectedTemplateId === "NONE"
                        ? "NONE"
                        : templateOptions.find((template) => template.id === selectedTemplateId)?.name || "",
                subject: selectedTemplateId === "NONE" ? subject : "",
                Audience: sendTo,
                emailList:
                    sendTo === "Text"
                        ? textContent
                            .split(",")
                            .map((email) => email.trim())
                            .filter(Boolean)
                        : [],
                EmailTarget: emailTarget,
                templateIdForAP: emailTarget ? apTemplateId : "",
                templateNameForAP: emailTarget
                    ? templateOptions.find((template) => template.id === apTemplateId)?.name || ""
                    : "",
                scheduledDatetime: scheduledDateTime || "",
            }
            const jsonString = JSON.stringify(dataObject)

            // Convert JSON to Blob and set content type to application/json
            const jsonBlob = new Blob([jsonString], { type: "application/json" })

            formData.append("data", jsonBlob)
            formData.append("Attachment", attachment ? attachment : new Blob([], { type: "application/octet-stream" }))
            formData.append("file", audienceFile ? audienceFile : new Blob([], { type: "application/octet-stream" }))

            const response = await sendEmailTemplate(formData)
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            if (response?.data?.data?.status === "success") {
                toast.success(response?.data?.data?.message || "Email template sent successfully.")
                setSelectedTemplateId("")
                setSendTo("")
                setAttachment(null)
                setTextContent("")
                setSubject("")
                setScheduledDateTime("")
                setFromEmail("")
                const attachmentElement = document.getElementById("attachment") as HTMLInputElement | null
                if (attachmentElement) {
                    attachmentElement.value = ""
                }
                setShowFileUpload(false)
                setEmailTarget("")
                setApTemplateId("")
            } else {
                throw new Error(response?.data?.message || "Failed to send email template")
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred while sending the email template."
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTemplate = async (templateData: {
        name: string
        subject: string
        message: string
        accountType: string
    }) => {
        try {
            const response = await createEmailTemplate({
                Template_Name: templateData.name,
                Subject: templateData.subject,
                Message: templateData.message,
                accountType: templateData.accountType,
            })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            if (response?.data?.data?.status === "success") {
                toast.success(`Email template ${response?.data?.data?.name} created successfully!`)
                getTemplateNames()
            } else {
                throw new Error(response?.data?.data?.message || "Failed to create email template :(")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred while creating the email template.")
        }
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader className="flex justify-between items-center ">
                            <CardTitle>Send Email Template</CardTitle>
                            <Button
                                onClick={() => setIsCreateTemplateDialogOpen(true)}
                                variant="secondary"
                                className="w-auto"
                                disabled={!selectedAccountType}
                            >
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Create Template
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {/* Account Status Display */}
                            {currentAccountStatus && (
                                <div className="mb-6 p-5 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    {/* <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Overview</h3>
                                        <div className="flex items-center gap-2">
                                            {currentAccountStatus.can_send_email ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Inactive</span>
                                                </>
                                            )}
                                        </div>
                                    </div> */}

                                    <div className="space-y-4">
                                        {/* Account Info Row */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Account Type: </span>
                                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {currentAccountStatus.account_type}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Email Usage: </span>
                                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {currentAccountStatus.limit_reached.toLocaleString()} /{" "}
                                                    {currentAccountStatus.total_limit.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                                <span>Usage Progress</span>
                                                <span>
                                                    {((currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-300 ${currentAccountStatus.limit_reached >= currentAccountStatus.total_limit
                                                        ? "bg-red-600"
                                                        : (currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100 >= 90
                                                            ? "bg-red-500"
                                                            : (currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100 >= 75
                                                                ? "bg-yellow-500"
                                                                : (currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100 >= 50
                                                                    ? "bg-green-500"
                                                                    : "bg-emerald-500"
                                                        }`}
                                                    style={{
                                                        width: `${Math.min((currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100, 100)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            {currentAccountStatus.limit_reached >= currentAccountStatus.total_limit && (
                                                <p className="text-xs text-red-600 font-medium">
                                                    Limit reached. Please update your account to continue sending emails.
                                                </p>
                                            )}
                                            {currentAccountStatus.limit_reached < currentAccountStatus.total_limit &&
                                                (currentAccountStatus.limit_reached / currentAccountStatus.total_limit) * 100 >= 90 && (
                                                    <p className="text-xs text-red-600 font-medium">
                                                        Warning: You are about to reach your email limit.
                                                    </p>
                                                )}
                                        </div>

                                        {/* Status Message */}
                                        {currentAccountStatus.status_message && (
                                            <div
                                                className={`p-3 rounded-lg border-l-4 ${currentAccountStatus.can_send_email
                                                    ? "bg-blue-50 border-blue-400 dark:bg-blue-950/20"
                                                    : "bg-red-50 border-red-400 dark:bg-red-950/20"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle
                                                        className={`h-4 w-4 mt-0.5 ${currentAccountStatus.can_send_email ? "text-blue-600" : "text-red-600"
                                                            }`}
                                                    />
                                                    <div
                                                        className={`text-sm ${currentAccountStatus.can_send_email
                                                            ? "text-blue-800 dark:text-blue-200"
                                                            : "text-red-800 dark:text-red-200"
                                                            }`}
                                                    >
                                                        <span className="font-medium">Notice:</span> {currentAccountStatus.status_message}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-4">
                                <div className="flex justify-center">
                                    <div className="w-full max-w-lg space-y-4">
                                        {/* Account Type Field - First Priority */}
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="accountType"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Account Type *
                                            </label>
                                            <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                                                <SelectTrigger id="accountType">
                                                    <SelectValue placeholder="Select account type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accountTypes.map((accountType) => (
                                                        <SelectItem key={accountType.id} value={accountType.id}>
                                                            {accountType.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* From Email: Field */}
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="fromEmail"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                From Email:
                                            </label>
                                            <Select value={fromEmail} onValueChange={setFromEmail}>
                                                <SelectTrigger id="fromEmail">
                                                    <SelectValue placeholder="Select a Email type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="research@pesbl.co.in">research@pesbl.co.in</SelectItem>
                                                    <SelectItem value="info@pesbl.co.in">info@pesbl.co.in</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Template Name Field */}
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="templateName"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                            >
                                                Template Name
                                                {isLoadingTemplates && <Loader2 className="h-4 w-4 animate-spin" />}
                                            </label>
                                            <Select
                                                value={selectedTemplateId}
                                                onValueChange={setSelectedTemplateId}
                                                disabled={!selectedAccountType || isLoadingTemplates}
                                            >
                                                <SelectTrigger id="templateName">
                                                    <SelectValue
                                                        placeholder={
                                                            !selectedAccountType
                                                                ? "Select account type first"
                                                                : isLoadingTemplates
                                                                    ? "Loading templates..."
                                                                    : "Select a template"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NONE">NONE</SelectItem>
                                                    {templateOptions.map((template) => (
                                                        <SelectItem key={template.id} value={template.id}>
                                                            {template.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selectedTemplateId === "NONE" && (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="subject"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Subject *
                                                </label>
                                                <textarea
                                                    id="subject"
                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Enter subject"
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {/* From To Field */}
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="sendTo"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Audience *
                                            </label>
                                            <Select value={sendTo} onValueChange={setSendTo}>
                                                <SelectTrigger id="sendTo">
                                                    <SelectValue placeholder="Select audience" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All">All</SelectItem>
                                                    <SelectItem value="Text">Text</SelectItem>
                                                    <SelectItem value="kyc_update">KYC Update</SelectItem>
                                                    <SelectItem value="email_list">Email List</SelectItem>
                                                    <SelectItem value="clientid_list">Client List</SelectItem>
                                                    <SelectItem value="branchcode_list">Branch List</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {showFileUpload && (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="fileUpload"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    File Upload
                                                </label>
                                                <input
                                                    type="file"
                                                    id="fileUpload"
                                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    onChange={(e) => {
                                                        const selectedFile = e.target.files?.[0] || null
                                                        setAudienceFile(selectedFile)
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {["kyc_update", "clientid_list"].includes(sendTo) && (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="emailTarget"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Email Target:
                                                </label>
                                                <Select value={emailTarget} onValueChange={setEmailTarget}>
                                                    <SelectTrigger id="emailTarget">
                                                        <SelectValue placeholder="Select a Email Target" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="only_Clients">Only Clients</SelectItem>
                                                        <SelectItem value="only_AP">Only AP</SelectItem>
                                                        <SelectItem value="Both">Both</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {emailTarget && (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="apTemplateName"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Template Name for AP
                                                </label>
                                                <Select value={apTemplateId} onValueChange={setApTemplateId}>
                                                    <SelectTrigger id="apTemplateName">
                                                        <SelectValue placeholder="Select a template for AP" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {templateOptions
                                                            .filter((template) => template.name !== "NONE")
                                                            .map((template) => (
                                                                <SelectItem key={template.id} value={template.id}>
                                                                    {template.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {sendTo === "Text" && (
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="textContent"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Email Addresses *
                                                </label>
                                                <div className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-background">
                                                    {textContent
                                                        .split(",")
                                                        .filter((email) => email.trim())
                                                        .map((email, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                                                            >
                                                                <span>{email.trim()}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newEmails = textContent.split(",").filter((_, i) => i !== index)
                                                                        setTextContent(newEmails.join(","))
                                                                    }}
                                                                    className="ml-2 text-secondary-foreground hover:text-primary-foreground"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    <input
                                                        type="text"
                                                        className="flex-grow min-w-[200px] bg-transparent focus:outline-none"
                                                        placeholder="Enter email addresses (press Enter or comma to add)"
                                                        value={currentEmailInput}
                                                        onChange={(e) => {
                                                            setCurrentEmailInput(e.target.value)
                                                            if (e.target.value.endsWith(",")) {
                                                                const emailToAdd = e.target.value.slice(0, -1).trim()
                                                                if (isValidEmail(emailToAdd)) {
                                                                    setTextContent((prev) => (prev ? `${prev},${emailToAdd}` : emailToAdd))
                                                                    setCurrentEmailInput("")
                                                                } else {
                                                                    toast.error("Please enter a valid email address.")
                                                                }
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault()
                                                                const newEmail = currentEmailInput.trim()
                                                                if (newEmail && isValidEmail(newEmail)) {
                                                                    setTextContent((prev) => (prev ? `${prev},${newEmail}` : newEmail))
                                                                    setCurrentEmailInput("")
                                                                } else if (newEmail) {
                                                                    toast.error("Please enter a valid email address.")
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label
                                                htmlFor="attachment"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {selectedTemplateId === "NONE" ? "Attachment (required)" : "Attachment (optional)"}
                                            </label>
                                            <input
                                                type="file"
                                                id="attachment"
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                onChange={(e) => {
                                                    const selectedFile = e.target.files?.[0] || null
                                                    setAttachment(selectedFile)
                                                }}
                                                required={selectedTemplateId === "NONE"}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label
                                                htmlFor="scheduleDateTime"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Schedule Message (Optional)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="datetime-local"
                                                    id="scheduleDateTime"
                                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={scheduledDateTime}
                                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Leave empty to send immediately</p>
                                        </div>

                                        <div className="space-y-2 flex justify-end p-4">
                                            <Button
                                                type="submit"
                                                className="w-auto"
                                                disabled={
                                                    loading ||
                                                    isUploading ||
                                                    (!!currentAccountStatus && !currentAccountStatus.can_send_email) ||
                                                    (!!currentAccountStatus &&
                                                        currentAccountStatus.limit_reached >= currentAccountStatus.total_limit)
                                                }
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : isUploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : currentAccountStatus &&
                                                    currentAccountStatus.limit_reached >= currentAccountStatus.total_limit ? (
                                                    "Limit Reached"
                                                ) : (
                                                    "Submit"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
            <CreateTemplateDialog
                isOpen={isCreateTemplateDialogOpen}
                onClose={() => setIsCreateTemplateDialogOpen(false)}
                onSubmit={handleCreateTemplate}
                accountTypes={accountTypes}
                defaultAccountType={selectedAccountType}
            />
            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}
