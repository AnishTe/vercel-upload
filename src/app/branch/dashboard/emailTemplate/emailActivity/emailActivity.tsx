"use client"
import { emailTemplateHistory, downloadAttachment } from "@/api/auth"
import type React from "react"

import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCallback, useState } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import dynamic from "next/dynamic"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})
import { Label } from "@/components/ui/label"
import { columns } from "./columns"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PDFViewerModal } from "./pdf-viewer-modal"
import { CSVViewerModal } from "./csv-viewer-modal"
import { FileX, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, subDays } from "date-fns"
import { Input } from "@/components/ui/input"

export default function EmailActivity() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<[] | null>(null)
    const [audience, setAudience] = useState("")

    const [pdfData, setPdfData] = useState<string | null>(null)
    const [pdfFilename, setPdfFilename] = useState("")
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

    const [csvData, setCsvData] = useState<string | null>(null)
    const [csvFilename, setCsvFilename] = useState("")
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)

    // Default dates: fromDate = 3 days ago, toDate = today
    const [fromDateStr, setFromDateStr] = useState(format(subDays(new Date(), 2), "yyyy-MM-dd"))
    const [toDateStr, setToDateStr] = useState(format(new Date(), "yyyy-MM-dd"))

    const handleSearch = async () => {
        if (!audience) {
            toast.error("Please select an audience")
            return
        }

        // Validate dates
        const fromDate = new Date(fromDateStr)
        const toDate = new Date(toDateStr)

        if (fromDate > toDate) {
            toast.error("From date cannot be after to date")
            return
        }

        setLoading(true)
        setError(null)
        setData(null)

        try {
            const response = await emailTemplateHistory({
                Audience: audience,
                fromDate: fromDateStr,
                toDate: toDateStr,
            })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData && parsedData.length > 0) {
                setData(parsedData)
            } else {
                setData([])
            }
        } catch (error: any) {
            setError("An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadAttachment = async (attachment: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await downloadAttachment({ attachment: attachment })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            // Handle the response with base64 content
            if (response.data.data && response.data.data.content) {
                const filename = response.data.data.filename || "document"
                const fileExtension = filename.split(".").pop()?.toLowerCase() || ""

                // Set the content and filename based on file type
                if (fileExtension === "csv") {
                    // Reset PDF state to avoid conflicts
                    setPdfData(null)
                    setIsPdfModalOpen(false)

                    // Set CSV data and open modal
                    setCsvData(response.data.data.content)
                    setCsvFilename(filename)
                    setIsCsvModalOpen(true)
                } else {
                    // Reset CSV state to avoid conflicts
                    setCsvData(null)
                    setIsCsvModalOpen(false)

                    // Set PDF data and open modal
                    setPdfData(response.data.data.content)
                    setPdfFilename(filename)
                    setIsPdfModalOpen(true)
                }
            } else {
                toast.error("No attachment content found")
                console.error("No content in attachment response")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while downloading the attachment.")
            toast.error("Failed to download attachment")
            console.error("Download error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        if (actionType === "atchbtn") {
            const attachment = row.original.attachment
            if (attachment) {
                handleDownloadAttachment(attachment)
            }
        }
    }, [])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">Email Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-2 mb-4">
                                <div className="flex-1 min-w-[160px] max-w-[200px]">
                                    <Label htmlFor="audience" className="text-xs mb-1 block">
                                        Audience
                                    </Label>
                                    <Select value={audience} onValueChange={setAudience}>
                                        <SelectTrigger id="audience" className="h-9">
                                            <SelectValue placeholder="Select" />
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

                                <div className="w-[160px]">
                                    <Label htmlFor="fromDate" className="text-xs mb-1 block">
                                        From
                                    </Label>
                                    <Input
                                        type="date"
                                        id="fromDate"
                                        value={fromDateStr}
                                        onChange={(e) => setFromDateStr(e.target.value)}
                                        disabled={loading}
                                        className="h-9"
                                    />
                                </div>

                                <div className="w-[160px]">
                                    <Label htmlFor="toDate" className="text-xs mb-1 block">
                                        To
                                    </Label>
                                    <Input
                                        type="date"
                                        id="toDate"
                                        value={toDateStr}
                                        onChange={(e) => setToDateStr(e.target.value)}
                                        disabled={loading}
                                        className="h-9"
                                    />
                                </div>

                                <Button onClick={handleSearch} disabled={loading} size="sm" className="h-9">
                                    {loading ? "Searching..." : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}

                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : (
                                <>
                                    {data === null ? (
                                        <p></p>
                                    ) : data.length > 0 ? (
                                        <DataTableArray
                                            columns={columns}
                                            data={data}
                                            showAllRows={true}
                                            filterColumn="clientId"
                                            filterPlaceholder="Filter ClientID..."
                                            getActionButtonDetails={getActionButtonDetails}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                            <div className="rounded-full bg-muted p-3 mb-4">
                                                <FileX className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">No records found</h3>
                                            <p className="text-muted-foreground mb-4 max-w-md">
                                                There are no records available for this criteria.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
            <PDFViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                pdfData={pdfData}
                filename={pdfFilename}
            />
            <CSVViewerModal
                isOpen={isCsvModalOpen}
                onClose={() => setIsCsvModalOpen(false)}
                csvData={csvData}
                filename={csvFilename}
            />
            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}