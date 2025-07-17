/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import $ from "jquery"
// import "datatables.net"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { applyIPOBranch, getboidforclientBranch } from "@/lib/auth"
import { columns } from "./columns"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { useRouter, useSearchParams } from "next/navigation"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { useIPO } from "@/contexts/IPOContext"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import CustomDialog, { type CustomDialogRef } from "@/components/ui/CustomDialog"
import IPOFormModal from "./ipo-form-modal"
import { setLocalStorage } from "@/utils/localStorage"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

// Format number into Indian numbering format
const formatIndianCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(value)
}

const LotSelect = ({ selectedIPO, clientId }: { selectedIPO: any; clientId: string }) => {
    if (!selectedIPO) return
    const selectednoofshares = Number.parseInt(selectedIPO?.noofequitysharesbid || "0")
    const selectedcutofprice = Number.parseFloat(selectedIPO?.cutoffprice || "0")

    const lots = Math.floor(500000 / (selectednoofshares * selectedcutofprice)) || 0
    const lotOptionsArray = Array.from({ length: lots }, (_, i) => (i + 1).toString())

    return (
        <select
            name="lotDrp"
            id={`lotDropdown_${clientId}`}
            aria-label="Select Lot"
            className="w-[100px] p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            defaultValue="1"
        >
            {lotOptionsArray?.map((lot) => (
                <option key={lot} value={lot}>
                    {lot}
                </option>
            ))}
        </select>
    )
}

const AmountCell = ({ clientId, selectedIPO }: { clientId: string; selectedIPO: any }) => {
    const selectednoofshares = Number.parseInt(selectedIPO?.noofequitysharesbid || "0")
    const selectedcutofprice = Number.parseFloat(selectedIPO?.cutoffprice || "0")
    const calculatedAmount = 1 * selectednoofshares * selectedcutofprice || 0

    return <span id={`amountCell_${clientId}`}>{formatIndianCurrency(calculatedAmount)}</span>
}

export default function ApplyClientIPODetails() {
    const [ipoId, setIpoId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState([])
    const { selectedIPO, setSelectedIPO } = useIPO()
    const tableRef = useRef<HTMLDivElement>(null)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [isModalOpen, setModalOpen] = useState(false)
    const selectedRowsRef = useRef<any[]>([])
    const modalRef = useRef<CustomDialogRef | null>(null) // Using ref instead of state
    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({})
    const [upiSuggestions, setUpiSuggestions] = useState<Record<string, string>>({})

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

    useEffect(() => {
        const fetchData = async () => {
            if (!ipoId) return
            setLoading(true)
            setError(null)
            try {
                const response = await getboidforclientBranch({ ipoId: ipoId })
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }
                const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
                if (parsedData && parsedData.clientDetails) {
                    setData(parsedData.clientDetails)

                    const suggestions: Record<string, string> = {}
                    const showStates: Record<string, boolean> = {}

                    parsedData.clientDetails.forEach((client) => {
                        if (client.upiId) {
                            suggestions[client.client_id] = client.upiId
                            showStates[client.client_id] = true
                        }
                    })

                    setUpiSuggestions(suggestions)
                    setShowSuggestions(showStates)
                } else {
                    throw new Error("Failed to fetch Branch Holding data")
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : "An error occurred while fetching data.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [ipoId])

    useEffect(() => {
        if (!tableRef.current || !selectedIPO || data.length === 0) return
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

        // Function to calculate and update the amount
        const updateAmount = (clientId: string, lotValue: number) => {
            const noOfEquitySharesBid = Number.parseInt(selectedIPO?.noofequitysharesbid || "0")
            const cutoffPrice = Number.parseFloat(selectedIPO?.cutoffprice || "0")
            const calculatedAmount = lotValue * noOfEquitySharesBid * cutoffPrice
            $(`#amountCell_${clientId}`).text(formatIndianCurrency(calculatedAmount))
        }

        // Attach event listener for change event
        $(tableRef.current)
            .off("change", '[id^="lotDropdown_"]')
            .on("change", '[id^="lotDropdown_"]', function () {
                const clientId = $(this).attr("id")?.split("_")[1] || ""
                const selectedLotValue = Number($(this).val()) || 1
                updateAmount(clientId, selectedLotValue)
            })

        // Initial calculation on page load
        $('[id^="lotDropdown_"]').each(function () {
            const clientId = $(this).attr("id")?.split("_")[1] || ""
            const selectedLotValue = Number($(this).val()) || 1
            updateAmount(clientId, selectedLotValue)
        })

        $(tableRef.current).on("select.dt", (e, dt, type, indexes) => {
            if (type === "row") {
                indexes.forEach((index) => {
                    const rowData = dt.row(index).data()
                    const rowNode = dt.row(index).node()
                    const upiInput = $(rowNode).find("input[name='upiId']") // Get UPI input field
                    const upiIdValue = upiInput.val()?.toString().trim() // Get trimmed UPI value

                    // 🚫 Prevent selection if not allowed
                    if (rowData?.original?.ipoAppliedStatus?.allowToApply === false) {
                        dt.row(index).deselect()
                        toast.error(
                            `Client ${rowData.original.clientName || "this client"}-${rowData.original.client_id || ""} has already applied for this ${rowData?.original?.ipoAppliedStatus?.companyName || ""} IPO. Please
                                check in View Orders for details.`,
                            {
                                position: "top-center",
                                duration: 3000,
                            },
                        )

                        $(rowNode).find(".rowCheckbox").prop("checked", false)
                        return
                    }

                    // 🚫 Prevent selection if UPI ID is invalid
                    if (!upiIdValue || !upiRegex.test(upiIdValue)) {
                        dt.row(index).deselect()
                        toast.error("Invalid UPI ID. Please enter a valid UPI ID before selecting.", {
                            position: "top-center",
                            duration: 3000,
                        })

                        $(rowNode).find(".rowCheckbox").prop("checked", false)
                        upiInput.addClass("border-red-500") // Highlight the invalid input field
                    } else {
                        upiInput.removeClass("border-red-500") // Remove error styling if valid
                    }
                })
            }
        })

        return () => {
            if (tableRef.current) {
                $(tableRef.current).off("change", '[id^="lotDropdown_"]')
                $(tableRef.current).off("select.dt")
            }
        }
    }, [data, selectedIPO])

    const enhancedColumns = useMemo(() => {
        return columns.map((column) => {
            if (column.id === "amount") {
                return {
                    ...column,
                    cell: ({ row }) => {
                        const clientId = row.original.client_id
                        return <AmountCell clientId={clientId} selectedIPO={selectedIPO} />
                    },
                }
            }
            if (column.id === "lot") {
                return {
                    ...column,
                    cell: ({ row }) => {
                        const clientId = row.original.client_id
                        return <LotSelect selectedIPO={selectedIPO} clientId={clientId} />
                    },
                }
            }
            return column
        })
    }, [selectedIPO])

    // const getSelectedRowsData = () => {
    //     if (!tableRef.current) return []

    //     const dt = $(tableRef.current).find("table").DataTable()
    //     const selectedRows = dt.rows({ selected: true }).nodes() // Get selected row nodes
    //     const selectedData = dt
    //         .rows({ selected: true })
    //         .data()
    //         .toArray()
    //         .map((row, index) => {
    //             const rowNode = selectedRows[index] // Get actual row DOM node

    //             // Extract inputs inside the row
    //             const inputs = $(rowNode).find("input, select, textarea")
    //             const formData: Record<string, any> = {} // Object to store input values

    //             inputs.each(function () {
    //                 const fieldName = $(this).attr("id") || $(this).attr("name") || $(this).attr("data-id") // Identify input field
    //                 if (fieldName) {
    //                     formData[fieldName] = $(this).val() // Store input value
    //                 }
    //             })

    //             return {
    //                 ...row, // Keep original row data
    //                 inputs: formData, // Attach extracted input values
    //             }
    //         })


    //     return selectedData
    // }

    const getSelectedRowsData = useCallback(() => {
        if (!tableRef.current) return []

        const dt = $(tableRef.current).find("table")
        if (!dt) return []

        const dataTable = dt.DataTable() // Initialize DataTable instance
        const selectedRows = dataTable.rows({ selected: true }).nodes()
        const selectedData = dataTable
            .rows({ selected: true })
            .data()
            .toArray()
            .map((row, index) => {
                const rowNode = $(selectedRows[index])
                const childRow = rowNode.next("tr.child")
                const formData: Record<string, any> = {}

                const inputContainer = rowNode.add(childRow) // ✅ handle both visible and hidden fields
                const inputs = inputContainer.find("input, select, textarea")

                inputs.each(function () {
                    const fieldName = $(this).attr("name") || $(this).attr("data-id")
                    if (fieldName) {
                        formData[fieldName] = (this as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value
                    }
                })

                return { ...row, inputs: formData }
            })
        selectedRowsRef.current = selectedData // Store persistently
        setSelectedRows(selectedData) // Update state to trigger re-render
        return selectedData
    }, [])

    const handleApplyIPO = async () => {
        // Use the stored selected rows from the ref
        const selectedRows = selectedRowsRef.current
        if (selectedRows.length === 0) {
            toast.error("Please select at least one client", { position: "top-center" })
            setModalOpen(false)
            return
        }

        setLoading(true)
        setError(null)

        const applicationsData = selectedRows.map((row) => {
            const clientId = row.client_id
            const lopApplied = row.inputs.lotDrp || 1
            const dpDetails = row.original.boidsDetails?.find((boidObj) => boidObj.boid === row.inputs.boid)
            const dpId = dpDetails?.dpid || ""
            const upiId = row.inputs.upiId
            return {
                boid: row.inputs.boid,
                dpid: dpId || "",
                depository: dpDetails.depository || "CDSL",
                companyname: selectedIPO?.companyname,
                ipocompanymasterId: ipoId,
                name: row.clientName,
                upiId: upiId || "",
                lotsapplied: lopApplied || 1,
                clientId: clientId.toString(),
                mobile: row.original.mobile || "",
                pan: row.pan || "",
                email: row.original.email || "",
                applicationno: "",
                quantity: (lopApplied * Number.parseInt(selectedIPO?.noofequitysharesbid || "0")).toString(),
                rate: selectedIPO?.cutoffprice || "0",
                formtype: upiId ? "online" : "offline",
                cuttoffflag: "0",
                category: selectedIPO?.category || "Retail",
                companySymbol: selectedIPO?.companysymbol,
                actionCode: "n",
                Exchange: selectedIPO?.companylogoex,
            }
        })

        try {
            const response = await applyIPOBranch({ data: applicationsData })
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

                    setTimeout(() => {
                        router.push(getCompatibleUrl("/branch/dashboard/ipo"))
                        setSelectedIPO(null)
                    }, 3000)
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
            setLoading(false)
            setModalOpen(false)
            modalRef.current?.close()
        }
    }

    function openModal() {
        const selectedData = getSelectedRowsData()

        if (selectedData.length === 0) {
            toast.error("Please select at least one client", { position: "top-center" })
            return
        }

        // UPI Regex Validation
        // const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/i

        // Find invalid UPI rows
        const invalidRows = selectedData.filter((row) => {
            // const upiIdValue = row.inputs[`upiId_${row.client_id}`]?.trim() // Get UPI ID value
            const upiIdValue = row.inputs[`upiId`]?.trim()
            // return !upiIdValue || !upiRegex.test(upiIdValue) // Check if empty or invalid
            return !upiIdValue // Check if empty or invalid
        })

        if (invalidRows.length > 0) {
            toast.error(
                <div>
                    <strong>Invalid UPI ID:</strong>
                    <ul className="mt-2">
                        {invalidRows.map((row, index) => (
                            <li key={index} className="text-red-500">
                                • {row.clientName || row.client_id || "Unknown Client"}: Invalid UPI ID
                            </li>
                        ))}
                    </ul>
                </div>,
                { position: "top-center", duration: 4000 },
            )
            return // Stop modal from opening
        }

        // Store selected data and open modal
        selectedRowsRef.current = selectedData
        setSelectedRows(selectedData) // Update state for rendering
        modalRef.current?.open()
    }

    const validateUpiId = (input) => {
        const $input = $(input)
        const upiId = $input.val().trim()
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/ // Pattern: username@bank

        if (!upiId) {
            showError($input, "*UPI ID should not be blank.")
            return false
        } else if (!upiRegex.test(upiId)) {
            showError($input, "*Invalid UPI ID format. Example: user@upi")
            return false
        } else {
            clearError($input)
            return true
        }
    }

    const showError = ($input, message) => {
        $input.addClass("border-red-500")
        if (!$input.next(".error-message").length) {
            $input.after(`<span class="error-message text-red-500" style="display: block;">${message}</span>`)
        }
    }

    const clearError = ($input) => {
        $input.removeClass("border-red-500")
        $input.next(".error-message").remove()
    }

    useEffect(() => {
        if (!tableRef.current || data.length === 0) return;

        let blurTimeout: ReturnType<typeof setTimeout> | null = null;

        // Handle input for validation
        $(tableRef.current).on("input", "input[name='upiId']", function () {
            validateUpiId(this);
        });

        // Handle focus on the input field
        $(tableRef.current).on("focus", "input[name='upiId']", function () {
            // Cancel any blur timeout if pending
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }

            $(".upi-suggestion-dropdown").remove(); // Remove any previous suggestions

            const $input = $(this);
            const clientData = $input.closest("tr").data("row-data");
            const upiValue = $input.val();
            const suggestion = upiSuggestions[clientData.client_id];

            // Show suggestions if there's no value and suggestion exists
            if (!upiValue && suggestion) {
                const offset = $input.offset()!;
                const height = $input.outerHeight()!;
                const $dropdown = $(`
                    <div class="upi-suggestion-dropdown absolute z-50 bg-white dark:bg-background border rounded-md shadow-md p-1 dark:border-slate-700" style="min-width: ${$input.outerWidth()}px;">
                        <div class="cursor-pointer p-1.5 hover:bg-muted rounded flex items-center gap-2 text-sm">
                            <svg class="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clip-rule="evenodd" />
                            </svg>
                            ${suggestion}
                        </div>
                    </div>
                `);

                // Position the dropdown properly relative to the input
                $dropdown.css({
                    top: offset.top + height,
                    left: offset.left,
                    position: "absolute"
                });

                $dropdown.find("div").on("click", () => {
                    $input.val(suggestion).trigger("input");
                    $dropdown.remove();
                });

                // Append dropdown inside the body
                $("body").append($dropdown);
            }
        });

        // Handle blur event to hide suggestions
        $(tableRef.current).on("blur", "input[name='upiId']", function () {
            blurTimeout = setTimeout(() => {
                $(".upi-suggestion-dropdown").remove();
                blurTimeout = null;
            }, 200);
        });

        // Cleanup event listeners
        return () => {
            if (tableRef.current) {
                $(tableRef.current).off("input", "input[name='upiId']");
                $(tableRef.current).off("focus", "input[name='upiId']");
                $(tableRef.current).off("blur", "input[name='upiId']");
            }
        };
    }, [data]);

    // Cleanup for clicks outside, ESC key, and scroll event to close dropdown
    useEffect(() => {
        const cleanupOnClickOutside = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target && !$(target).closest(".upi-suggestion-dropdown, input[name='upiId']").length) {
                $(".upi-suggestion-dropdown").remove();
            }
        };

        const cleanupOnEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") $(".upi-suggestion-dropdown").remove();
        };

        const cleanupOnScroll = () => {
            $(".upi-suggestion-dropdown").remove(); // Close dropdown on scroll
        };

        // Attach event listeners for mouse click, ESC key, and scroll
        document.addEventListener("mousedown", cleanupOnClickOutside);
        document.addEventListener("keydown", cleanupOnEsc);
        document.addEventListener("scroll", cleanupOnScroll); // Listen for scroll event

        return () => {
            document.removeEventListener("mousedown", cleanupOnClickOutside);
            document.removeEventListener("keydown", cleanupOnEsc);
            document.removeEventListener("scroll", cleanupOnScroll);
        };
    }, []);


    useEffect(() => {
        if (!tableRef.current) return

        $(tableRef.current).on("select.dt deselect.dt", () => {
            // Update selectedRowsRef when selection changes
            getSelectedRowsData()
        })

        return () => {
            if (tableRef.current) {
                $(tableRef.current).off("select.dt deselect.dt")
            }
        }
    }, [data])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Apply for Client IPO: {selectedIPO?.companyname}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={openModal}>Apply for IPO</Button>
                                <IPOFormModal disabled={selectedRows.length > 0} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                            ) : (
                                <div ref={tableRef}>
                                    <DataTableArray
                                        columns={enhancedColumns}
                                        data={data}
                                        showPagination={true}
                                        selectableRows={true}
                                        viewColumns={false}
                                        onRowRender={(row, rowElement) => {
                                            // Store row data in a data attribute for easy access
                                            $(rowElement).attr("data-row-data", JSON.stringify(row))
                                        }}
                                        selectAllCheckbox={false}
                                    />
                                    <Button onClick={() => router.push(getCompatibleUrl("/branch/dashboard/ipo"))} className="mt-4">
                                        Back to IPO List
                                    </Button>
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
                            <DialogTitle>Apply IPO Confirmation?</DialogTitle>
                            <DialogDescription className="py-2">
                                Are you sure you want to submit the IPO application?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={handleApplyIPO} disabled={loading}>
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <CustomDialog ref={modalRef} title="Apply IPO Confirmation?" onConfirm={handleApplyIPO} confirmLoading={loading}>
                <div className="space-y-4">
                    <p>Are you sure you want to submit the IPO application for the following clients?</p>

                    {selectedRows.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left">Client ID</th>
                                        <th className="p-2 text-left">Client Name</th>
                                        <th className="p-2 text-left">Lots</th>
                                        <th className="p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRows.map((row, index) => {
                                        const clientId = row.client_id
                                        const lotValue = Number(row.inputs[`lotDrp`] || 1)
                                        const noOfEquitySharesBid = Number.parseInt(selectedIPO?.noofequitysharesbid || "0")
                                        const cutoffPrice = Number.parseFloat(selectedIPO?.cutoffprice || "0")
                                        const calculatedAmount = lotValue * noOfEquitySharesBid * cutoffPrice

                                        return (
                                            <tr key={index} >
                                                <td className="p-2">{clientId}</td>
                                                <td className="p-2">{row.clientName || clientId}</td>
                                                <td className="p-2">{lotValue}</td>
                                                <td className="p-2 text-right">{formatIndianCurrency(calculatedAmount)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        This action will submit the IPO application for {selectedRows.length} selected client(s).
                    </p>
                </div>
            </CustomDialog>
        </>
    )
}
