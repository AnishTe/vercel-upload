"use client"
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Search, HandCoins, PlusCircle, ArrowUpDown, FileX } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { applyMarginPledgeHO, marginPledgeHO } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { DataTable } from "./data-table"
import type { ColumnDef } from "@tanstack/react-table"

export type MarginPledgeHOEntry = {
    scriptName: string
    boID: string
    isin: string
    totalQuantity: number
    unpledgedQuantity: number
    pledgeQuantity: number
    amount: number
    segment: string
    quantity: number
    clientId: string
}

export default function MarginPledge() {
    const [data, setData] = useState<MarginPledgeHOEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [clientId, setClientId] = useState("")
    const [rowSelection, setRowSelection] = useState({})
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [showRedirectModal, setShowRedirectModal] = useState(false)
    const [redirectUrl, setRedirectUrl] = useState("")
    const [pledgeFormData, setPledgeFormData] = useState<any>(null)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [currentSegment, setCurrentSegment] = useState<string>("CM")
    const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})
    const [formData, setFormData] = useState<Record<number, { quantity: string; segment: string }>>({})
    const isMobile = useMediaQuery("(max-width: 640px)")

    // Create refs for input fields to maintain focus
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
    // Create a ref to store form data without causing re-renders
    const formDataRef = useRef<Record<number, { quantity: string; segment: string }>>({})

    // Define columns for the DataTable
    const columns: ColumnDef<MarginPledgeHOEntry>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
        },
        {
            accessorKey: "scriptName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Scrip Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "boID",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    BOID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "isin",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    ISIN
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "totalQuantity",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Total Quantity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "unpledgedQuantity",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Free Quantity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "pledgeQuantity",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Pledged Quantity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            id: "quantityToPledge",
            header: "Quantity to Pledge",
            cell: ({ row }) => {
                const rowIndex = row.index
                const unpledgedQty = row.original.unpledgedQuantity
                const initialValue = row.original.quantity || row.original.unpledgedQuantity || ""

                // Ensure ref is initialized
                if (!formDataRef.current[rowIndex]) {
                    formDataRef.current[rowIndex] = {
                        quantity: initialValue.toString(),
                        segment: row.original.segment || "CM",
                    }
                }


                const value = formDataRef.current[rowIndex]?.quantity || ""

                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const inputVal = e.target.value
                    const numVal = Number(inputVal)

                    // Update ref
                    formDataRef.current[rowIndex].quantity = inputVal

                    // ✅ Validate onChange
                    if (inputVal === "" || isNaN(numVal) || numVal <= 0) {
                        setValidationErrors((prev) => ({
                            ...prev,
                            [rowIndex]: "Quantity should not be blank or zero",
                        }))
                    } else if (numVal > unpledgedQty) {
                        setValidationErrors((prev) => ({
                            ...prev,
                            [rowIndex]: `Cannot pledge more than ${unpledgedQty} shares`,
                        }))
                    } else {
                        setValidationErrors((prev) => {
                            const newErrors = { ...prev }
                            delete newErrors[rowIndex]
                            return newErrors
                        })
                    }
                }

                const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
                    const inputVal = e.target.value

                    // Final update to form state (optional)
                    setFormData((prev) => ({
                        ...prev,
                        [rowIndex]: {
                            ...prev[rowIndex],
                            quantity: inputVal,
                        },
                    }))
                }

                return (
                    <div className="relative">
                        <input
                            name="quantity"
                            id={`quantity-${rowIndex}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Pledge Quantity"
                            className={`w-full p-2 transition-all duration-200 border rounded-md ${validationErrors[rowIndex] ? "border-red-500" : "border-gray-300"
                                }`}
                            value={value}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {validationErrors[rowIndex] && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors[rowIndex]}
                            </span>
                        )}
                    </div>
                )
            },
        }
        ,
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            id: "segment",
            header: "Segment",
            cell: ({ row }) => {
                const rowIndex = row.index
                const initialSegment = row.original.segment || "CM"

                return (
                    <div className="flex justify-center align-center gap-1">
                        <select
                            id={`segment-${rowIndex}`}
                            name="segment"
                            title="segment"
                            value={formData[rowIndex]?.segment || formDataRef.current[rowIndex]?.segment || initialSegment}
                            className="p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
                            onClick={(e) => {
                                // Prevent event propagation to avoid row selection issues
                                e.stopPropagation()
                            }}
                            onChange={(e) => {
                                const newValue = e.target.value

                                // Update both the ref and the state
                                if (!formDataRef.current[rowIndex]) {
                                    formDataRef.current[rowIndex] = {
                                        quantity: row.original.quantity?.toString() || row.original.unpledgedQuantity?.toString() || "",
                                        segment: newValue,
                                    }
                                } else {
                                    formDataRef.current[rowIndex].segment = newValue
                                }

                                setFormData((prev) => ({
                                    ...prev,
                                    [rowIndex]: {
                                        ...prev[rowIndex],
                                        segment: newValue,
                                    },
                                }))
                            }}
                        >
                            <option value="CM">CASH</option>
                            <option value="FO">FO</option>
                            <option value="CO">MCX</option>
                            <option value="CD">CDS</option>
                        </select>

                        {Object.keys(rowSelection).length > 1 && row.getIsSelected() && (
                            <Button
                                size="sm"
                                id="action-btn"
                                className="px-2 py-1 h-8 text-xs"
                                title="Apply same segment to all"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentSegment(
                                        formData[rowIndex]?.segment || formDataRef.current[rowIndex]?.segment || initialSegment,
                                    )
                                    setShowApplyModal(true)
                                }}
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    useEffect(() => {
        // Initialize form data when data is loaded or clientId changes
        const initialFormData: Record<number, { quantity: string; segment: string }> = {}
        data.forEach((row, index) => {
            initialFormData[index] = {
                quantity: (row.quantity || row.unpledgedQuantity || "").toString(),
                segment: row.segment || "CM",
            }
        })
        setFormData(initialFormData)
        formDataRef.current = { ...initialFormData }
    }, [data])

    const fetchMarginPledgeData = async () => {
        if (!clientId.trim()) {
            toast.error("Please enter a Client ID")
            setData([])
            return
        }

        setLoading(true)
        setError(null)
        setHasSearched(true)
        try {
            const response = await marginPledgeHO({ clientId: clientId.trim() })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData && Object.keys(parsedData).length > 0) {
                setData(parsedData)
                setValidationErrors({})
                setRowSelection({})
            } else {
                setData([])
                setFormData({})
                formDataRef.current = {}
                setValidationErrors({})
                setRowSelection({})
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            fetchMarginPledgeData()
        }
    }

    const getSelectedRowsData = () => {
        const selectedRows: MarginPledgeHOEntry[] = []

        Object.keys(rowSelection).forEach((index) => {
            if (rowSelection[index]) {
                const rowIndex = Number(index)
                const rowData = data[rowIndex]
                // Use both formData and formDataRef to ensure we have the latest values
                const rowFormData = formDataRef.current[rowIndex] || formData[rowIndex]

                if (rowData && rowFormData) {
                    selectedRows.push({
                        ...rowData,
                        quantity: Number(rowFormData.quantity),
                        segment: rowFormData.segment,
                    })
                }
            }
        })

        return selectedRows
    }

    const validateAllInputs = () => {
        const newErrors: Record<number, string> = {}
        let hasErrors = false

        Object.keys(rowSelection).forEach((index) => {
            if (rowSelection[index]) {
                const rowIndex = Number(index)
                const rowData = data[rowIndex]
                // Use both formData and formDataRef to ensure we have the latest values
                const rowFormData = formDataRef.current[rowIndex] || formData[rowIndex]
                const numValue = Number(rowFormData?.quantity)

                if (!rowFormData || rowFormData.quantity === "" || isNaN(numValue) || numValue <= 0) {
                    newErrors[rowIndex] = "Quantity should not be blank or zero"
                    hasErrors = true
                } else if (numValue > rowData.unpledgedQuantity) {
                    newErrors[rowIndex] = `Cannot pledge more than ${rowData.unpledgedQuantity} shares`
                    hasErrors = true
                }
            }
        })

        setValidationErrors(newErrors)
        return !hasErrors
    }

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const selectedRows = getSelectedRowsData()
            const record = selectedRows.map((row) => ({
                clientid: row.clientId?.toString() || "",
                boid: row.boID?.toString() || "",
                isin: row.isin,
                quantity: row.quantity?.toString() || "",
                amount: row.amount?.toString() || "",
                segment: row.segment,
            }))

            const response = await applyMarginPledgeHO({ record })
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            const responseData = JSON.parse(response.data.data)

            if (responseData.reqid) {
                setRedirectUrl(responseData.url)
                setPledgeFormData({
                    pledgedtls: responseData.pledgedtls,
                    dpid: responseData.dpid,
                    version: responseData.version,
                    reqid: responseData.reqid,
                })
                setShowRedirectModal(true)
            } else {
                throw new Error(response?.data?.data?.error || "Failed to pledge stock :(")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred while pledge the stock :(")
        } finally {
            setLoading(false)
            setConfirmModalOpen(false)
        }
    }

    const applySegmentToSelectedRows = () => {
        const updatedFormData = { ...formData }
        const updatedFormDataRef = { ...formDataRef.current }

        Object.keys(rowSelection).forEach((index) => {
            if (rowSelection[index]) {
                const rowIndex = Number(index)

                // Update both state and ref
                updatedFormData[rowIndex] = {
                    ...updatedFormData[rowIndex],
                    segment: currentSegment,
                }

                if (!updatedFormDataRef[rowIndex]) {
                    updatedFormDataRef[rowIndex] = {
                        quantity: data[rowIndex].quantity?.toString() || data[rowIndex].unpledgedQuantity?.toString() || "",
                        segment: currentSegment,
                    }
                } else {
                    updatedFormDataRef[rowIndex].segment = currentSegment
                }
            }
        })

        setFormData(updatedFormData)
        formDataRef.current = updatedFormDataRef
        toast.success(`Segment updated to ${currentSegment} for ${Object.keys(rowSelection).length} rows`)
        setShowApplyModal(false)
    }

    useEffect(() => {
        if (showRedirectModal && redirectUrl && pledgeFormData) {
            const timer = setTimeout(() => {
                const form = document.getElementById("pledgeForm") as HTMLFormElement
                if (form) {
                    form.pledgeDtls.value = pledgeFormData.pledgedtls
                    form.dpid.value = pledgeFormData.dpid
                    form.version.value = pledgeFormData.version
                    form.reqid.value = pledgeFormData.reqid

                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
                    if (submitButton) {
                        submitButton.click()
                        setShowRedirectModal(false)
                    }
                }
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showRedirectModal, redirectUrl, pledgeFormData])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                            <CardTitle>Margin Pledge</CardTitle>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-2 w-full">
                                    <Label htmlFor="clientId" className="whitespace-nowrap">
                                        ClientID:
                                    </Label>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            id="clientId"
                                            type="text"
                                            placeholder="Enter Client ID"
                                            value={clientId}
                                            onChange={(e) => setClientId(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="flex-1 bg-white text-black placeholder-gray-400"
                                        />
                                        <Button onClick={fetchMarginPledgeData} size="sm" className="shrink-0">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {data.length > 0 && (
                                <div className="mb-4">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const selectedData = getSelectedRowsData()

                                            if (selectedData.length === 0) {
                                                toast.error("Please select at least one")
                                                return
                                            }

                                            if (selectedData.length > 49) {
                                                toast.error("Please select less than 50 items.")
                                                return
                                            }

                                            if (validateAllInputs()) {
                                                setConfirmModalOpen(true)
                                            } else {
                                                toast.error("Please review the details before confirming.")
                                            }
                                        }}
                                        className="w-auto px-6"
                                    >
                                        <HandCoins className="h-4 w-4 mr-2" />
                                        Apply Pledge
                                    </Button>
                                </div>
                            )}

                            {error && <p className="text-red-500 mb-4">{error}</p>}

                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : (
                                <>
                                    {data === null ? (
                                        <p></p>
                                    ) : data.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <DataTable
                                                columns={columns}
                                                data={data}
                                                searchPlaceholder="Search all columns..."
                                                enableRowSelection={true}
                                                rowSelection={rowSelection}
                                                onRowSelectionChange={setRowSelection}
                                            />
                                        </div>
                                    ) : (
                                        hasSearched && <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                            <div className="rounded-full bg-muted p-3 mb-4">
                                                <FileX className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">No records found</h3>
                                            <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Pledge ?</DialogTitle>
                            <DialogDescription>Are you sure you want to pledge the following shares?</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/3">Script Name</TableHead>
                                            <TableHead className="w-1/4">Quantity</TableHead>
                                            <TableHead className="w-1/4">Segment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getSelectedRowsData().map((share, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{share.scriptName}</TableCell>
                                                <TableCell className="font-medium">{share.quantity}</TableCell>
                                                <TableCell className="font-medium">{share.segment}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="text-sm text-muted-foreground mt-2">
                                <p>Please review the details before confirming.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </div>
                                ) : (
                                    "Confirm"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {showSessionExpiredModal && <SessionExpiredModal />}

                <Dialog open={showRedirectModal} onOpenChange={() => setShowRedirectModal(false)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Redirecting to CDSL page...</DialogTitle>
                            <DialogDescription>Please Wait!</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center">
                            <svg
                                className="animate-spin h-8 w-8 text-primary"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        </div>
                    </DialogContent>
                </Dialog>

                <form
                    name="frmpledge"
                    id="pledgeForm"
                    method="POST"
                    action={redirectUrl}
                    style={{ display: "none" }}
                    target="_blank"
                >
                    <input type="hidden" name="pledgeDtls" />
                    <input type="hidden" name="dpid" />
                    <input type="hidden" name="version" />
                    <input type="hidden" name="reqid" />
                    <button type="submit">Submit Pledge</button>
                </form>

                <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Apply Segment to Selected Rows</DialogTitle>
                            <DialogDescription>
                                This will apply the segment <strong>{currentSegment}</strong> to all {Object.keys(rowSelection).length}{" "}
                                selected rows.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={applySegmentToSelectedRows}>Apply to All</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </>
    )
}
