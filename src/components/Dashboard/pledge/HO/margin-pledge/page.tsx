/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import $ from "jquery"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { applyMarginPledgeHO, marginPledgeHO } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Label } from "@/components/ui/label"
import { Search, HandCoins, FileX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import dynamic from "next/dynamic"
import CustomDialog from "@/components/ui/CustomDialog"
import { columns, type MarginPledgeHOEntry } from "./columns"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
})

export default function MarginPledgeHO() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const [selectedRows, setSelectedRows] = useState<MarginPledgeHOEntry[]>([])
  const [showRedirectModal, setShowRedirectModal] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState("")
  const [pledgeFormData, setPledgeFormData] = useState<any>(null)
  const [clientId, setClientId] = useState("")
  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowsRef = useRef<any[]>([])
  const modalRef = useRef<any | null>(null)
  const [currentSegment, setCurrentSegment] = useState<string>("CM")
  const [showApplyModal, setShowApplyModal] = useState(false)

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

    return selectedData
  }, [])

  const fetchMarginPledgeData = async () => {
    if (!clientId.trim()) {
      toast.error("Please enter a Client ID")
      setData([])
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true);
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
      } else {
        setData([])
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

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const record = selectedRows.map((row: any) => ({
        clientid: row.original.clientId.toString() || "",
        boid: row.original.boID.toString() || "",
        isin: row.original.isin,
        quantity: row.inputs.quantity.toString() || "",
        amount: row.original.amount.toString() || "",
        segment: row.inputs.segment,
      }))

      const response = await applyMarginPledgeHO({ record: record })
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
      setModalOpen(false)
      modalRef.current?.close()
    }
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

  const handleOpenApplyDialog = useCallback(
    (row: any) => {
      const selectedData = getSelectedRowsData() // Fetch latest selected rows
      if (selectedData.length <= 1) return // Prevent opening if only one row is selected

      setSelectedRows(selectedData)
      setCurrentSegment(row.inputs?.segment || "CM") // Set segment of clicked row
      setShowApplyModal(true)
    },
    [getSelectedRowsData],
  )

  const applySegmentToSelectedRows = () => {
    if (!tableRef.current) return;

    const tableElement = $(tableRef.current).find("table"); // Find actual table
    if (!tableElement.length) {
      console.error("Table not found inside tableRef");
      return;
    }

    const dt = tableElement.DataTable(); // Initialize DataTable properly
    const selectedRowNodes = dt.rows({ selected: true }).nodes(); // ✅ Get selected rows

    $(selectedRowNodes).each(function () {
      const row = $(this);
      let segmentSelect = row.find('select[name="segment"]');

      // ✅ If row has a child row (responsive mode), find the segment select there
      if (row.hasClass("dtr-expanded")) {
        const childRow = row.next(".child"); // Get the child row (contains extra details)
        if (childRow.length) {
          segmentSelect = childRow.find('select[name="segment"]'); // Get from child row
        }
      }

      if (segmentSelect.length) {
        segmentSelect.val(currentSegment);
        segmentSelect.trigger("change");
      }
    });

    toast.success(`Segment updated to ${currentSegment} for ${selectedRowNodes.length} rows`);
    setShowApplyModal(false);
  };



  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    const updateButtons = () => {
      const selectedData = getSelectedRowsData()
      setSelectedRows(selectedData)

      const showButton = selectedData.length > 1

      // ✅ Select all rows, including responsive (`tr.child`)
      const allRowNodes = tableRef.current ? $(tableRef.current).find("tr, tr.child") : $()

      $(allRowNodes).each(function () {
        const row = $(this)
        const prevRow = row.prev() // ✅ Get previous row for reference

        // ✅ Find `#action-btn` inside both normal & responsive rows
        const applyButton = row.find("#action-btn")

        // ✅ Fix: Ensure `.prev()` only applies in responsive mode
        const isResponsive = row.hasClass("child") // ✅ Detect if row is responsive
        const isSelected = row.hasClass("selected") || (isResponsive && prevRow.hasClass("selected"))

        if (isSelected && showButton) {
          applyButton.removeClass("hidden") // ✅ Show button only in selected rows
        } else {
          applyButton.addClass("hidden") // ✅ Hide button in non-selected rows
        }
      })
    }

    $(tableRef.current).on("select.dt deselect.dt", updateButtons)
    // $(tableRef.current).on("select.dt", validateQuantity);

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("select.dt deselect.dt", updateButtons)
        // $(tableRef.current).off("select.dt", validateQuantity);
      }
    }
  }, [data, getSelectedRowsData])

  const getActionButtonDetails = useCallback(
    (event: React.MouseEvent, row: any, actionType: string) => {
      event.stopPropagation()
      setSelectedRows(row)

      if (actionType === "applySeg") {
        handleOpenApplyDialog(row)
      }
    },
    [handleOpenApplyDialog],
  )

  const validateInput = (input) => {
    const $input = $(input);
    const row = $input.closest("tr").hasClass("child") ? $input.closest("tr").prev() : $input.closest("tr");
    const rowData = JSON.parse(row.attr("data-row-data") || "{}");
    const inputValue = parseInt($input.val());
    const quantity = parseInt(rowData.totalQuantity);

    if (isNaN(inputValue) || inputValue <= 0) {
      // Invalid input value or no value entered
      showError($input, '*Quantity should not be blank or zero.');
      return false;
    } else if (inputValue > quantity) {
      // Invalid input value
      showError($input, `*Cannot pledge more than ${quantity} shares.`);
      return false;
    } else {
      // Valid input, update the "applied" property of the row data
      rowData.applied = inputValue;
      clearError($input);
      return true;
    }
  };

  const showError = ($input, message) => {
    $input.addClass("border-red-500");  // Keeps the input field border red
    if (!$input.next('.error-message').length) {
      $input.after(`<span class="error-message text-red-500" style="display: block;">${message}</span>`); // Apply shadcn's red color class (text-red-500)
    }
  };

  const clearError = ($input) => {
    $input.removeClass("border-red-500");
    $input.next('.error-message').remove();
  };


  const validateAllInputs = () => {
    let allValid = true;
    $("input[name='quantity']").each(function () {
      if (!validateInput(this)) {
        allValid = false;
      }
    });
    return allValid;
  };

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    $(tableRef.current).on("input", "input[name='quantity']", function () {
      validateInput(this);
    });

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("input", "input[name='quantity']")
      }
    }
  }, [data])

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
              <div className="flex justify-center mb-1">
                {data.length > 0 && (
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

                      selectedRowsRef.current = selectedData
                      setSelectedRows(selectedData)
                      if (validateAllInputs()) {
                        modalRef.current?.open();
                      } else {
                        toast.error("Please review the details before confirming.");
                      }
                    }}
                    className="w-auto px-6"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    Apply Pledge
                  </Button>
                )}
              </div>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : (
                <>
                  {data === null ? (
                    <p></p>
                  ) : data.length > 0 ? (
                    <div className="overflow-x-auto" ref={tableRef}>
                      <DataTableArray
                        columns={columns}
                        key="margin_pledge_table"
                        data={data}
                        showAllRows={true}
                        showPagination={true}
                        getActionButtonDetails={getActionButtonDetails}
                        selectableRows={true}
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

        <CustomDialog
          ref={modalRef}
          title="Confirm Pledge ?"
          onConfirm={handleConfirm}
          confirmLoading={loading}
          confirmText="Confirm"
        >
          <div className="space-y-4">
            <p className="text-base font-medium">Are you sure you want to pledge the following shares?</p>

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
                  {selectedRows && selectedRows.length > 0 ? (
                    selectedRows.map((share, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{share.scriptName}</TableCell>
                        <TableCell className="font-medium">{share.inputs?.quantity || "-"}</TableCell>
                        <TableCell className="font-medium">{share.inputs?.segment || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No shares selected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-sm text-muted-foreground mt-2">
              <p>Please review the details before confirming.</p>
            </div>
          </div>
        </CustomDialog>

        {showSessionExpiredModal && <SessionExpiredModal />}

        {showRedirectModal && (
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
        )}
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
      </DashboardLayout>

      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Segment to Selected Rows</DialogTitle>
            <DialogDescription>
              This will apply the segment <strong>{currentSegment}</strong> to all {selectedRows.length} selected rows.
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
    </>
  )
}

