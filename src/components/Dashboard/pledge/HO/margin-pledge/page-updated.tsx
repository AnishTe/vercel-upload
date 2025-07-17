/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
import { Search, HandCoins, AlertCircle, FileX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CustomDialog from "@/components/ui/CustomDialog"
import { columns, type MarginPledgeHOEntry } from "./columns"
// import DataTable from "./DataTableNet"

import dynamic from "next/dynamic"
const DataTable = dynamic(() => import("../../../../DataTableNetInp"), {
  ssr: false,
})

const formatIndianCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value)
}

const AmountCell = ({ clientId, rowData }: { clientId: string; rowData: any }) => {
  const ogAmt = rowData.original.amount
  const freeQty = rowData.original.unpledgedQuantity
  const qtyPledge = rowData.inputs.unpledgedQuantityInp

  const calculatedAmount = ogAmt * qtyPledge / freeQty || 0

  return <span id={`amountCell_${rowData.original.isin}`}>
    {formatIndianCurrency(calculatedAmount)}
  </span>
}

export default function MarginPledgeHOUpdated() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
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
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Add useEffect to check for clientId in URL params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdFromUrl = urlParams.get("client")

    if (clientIdFromUrl) {
      setClientId(clientIdFromUrl)
      fetchData(clientIdFromUrl)
    }
  }, [])

  // Add fetchData function that accepts clientId parameter
  const fetchData = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const response = await marginPledgeHO({ clientId: id.trim() })
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
  }, [])

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

  useEffect(() => {
    if (!tableRef.current || !selectedRows || data.length === 0) return;

    const updateAmount = (clientId: string, lotValue: number, rowData: any) => {
      if (!rowData) {
        console.error("rowData is null or undefined. Cannot update amount.");
        return;
      }

      const ogAmt = rowData.amount;
      const freeQty = rowData.unpledgedQuantity;
      const qtyPledge = lotValue;

      if (typeof ogAmt !== "number" || typeof freeQty !== "number" || typeof qtyPledge !== "number") {
        console.error("Invalid data types. Cannot update amount.");
        return;
      }

      const calculatedAmount = (ogAmt * qtyPledge) / freeQty || 0;

      const amountCellId = `amountCell_${clientId}`;
      try {
        $(`#${amountCellId}`).text(calculatedAmount.toFixed(2));
      } catch (e) {
        console.error("Error updating amount cell:", e);
      }


    };

    const handleChange = function (this: HTMLInputElement) {
      const clientId = this.id.split("-")[1];
      const lotValue = Number(this.value) || 0;

      // Get nearest row and parse rowData
      const rowEl = $(this).closest("tr");
      const rowDataRaw = rowEl.attr("data-row-data");
      console.log(rowDataRaw)
      if (!rowDataRaw) return;

      try {
        const rowData = JSON.parse(rowDataRaw);
        updateAmount(clientId, lotValue, rowData);
      } catch (e) {
        console.error("Failed to parse rowData:", e);
      }
    };

    $(tableRef.current)
      .off("input", 'input[id^="quantity-"]')

    // Add the new handler
    $(tableRef.current).on("input", 'input[id^="quantity-"]', handleChange)

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("input", 'input[id^="quantity-"]');
      }
    };
  }, [data]);

  const fetchMarginPledgeData = async () => {
    if (!clientId.trim()) {
      toast.error("Please enter a Client ID")
      setData([])
      return
    }

    await fetchData(clientId)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchMarginPledgeData()
    }
  }



  const handleConfirm = async () => {
    setLoading(true)

    try {
      const record = selectedRows.map((row: any) => {
        const quantity = row.inputs.quantity || "";
        const isin = row.isin;

        const amountText = $(`#amountCell_${isin}`).text().replace(/[^0-9.]/g, "");
        const updatedAmount = parseFloat(amountText || "0").toFixed(2);

        return {
          clientid: row.clientId.toString() || "",
          boid: row.boID.toString() || "",
          isin: isin,
          quantity: quantity.toString(),
          amount: updatedAmount,
          segment: row.inputs.segment,
        };
      });


      console.log(record)

      const response = await applyMarginPledgeHO({ record: record })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }
      const responseData = JSON.parse(response.data.data)

      if (responseData.reqid) {
        // Store clientId and return URL in localStorage before redirecting
        localStorage.setItem("pledgeClientId", clientId)
        localStorage.setItem("pledgeReturnUrl", window.location.pathname)

        setRedirectUrl(responseData.url)
        setPledgeFormData({
          pledgedtls: responseData.pledgedtls,
          dpid: responseData.dpid,
          version: responseData.version,
          reqid: responseData.reqid,
        })
        // console.log(responseData.pledgedtls)
        // console.log(responseData.reqid)
        //setShowRedirectModal(true)
        setIsRedirecting(true)
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
    // if (showRedirectModal && redirectUrl && pledgeFormData) {
    if (isRedirecting && redirectUrl && pledgeFormData) {
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
            // setTimeout(() => {
            setIsRedirecting(false)
            // }, 5000)
          }
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isRedirecting, redirectUrl, pledgeFormData])
  //showRedirectModal

  const handleOpenApplyDialog = useCallback(
    (row: any) => {
      const selectedData = getSelectedRowsData()
      if (selectedData.length <= 1) return

      setSelectedRows(selectedData)
      setCurrentSegment(row.inputs?.segment || "CM")
      setShowApplyModal(true)
    },
    [getSelectedRowsData],
  )

  const applySegmentToSelectedRows = () => {
    if (!tableRef.current) return

    const tableElement = $(tableRef.current).find("table")
    if (!tableElement.length) {
      // console.error("Table not found inside tableRef")
      return
    }

    const dt = tableElement.DataTable()
    const selectedRowNodes = dt.rows({ selected: true }).nodes()

    $(selectedRowNodes).each(function () {
      const row = $(this)
      let segmentSelect = row.find('select[name="segment"]')

      if (row.hasClass("dtr-expanded")) {
        const childRow = row.next(".child")
        if (childRow.length) {
          segmentSelect = childRow.find('select[name="segment"]')
        }
      }

      if (segmentSelect.length) {
        segmentSelect.val(currentSegment)
        segmentSelect.trigger("change")
      }
    })

    toast.success(`Segment updated to ${currentSegment} for ${selectedRowNodes.length} rows`)
    setShowApplyModal(false)
  }

  const validateAllInputs = () => {
    let allValid = true
    $("input[name='quantity']").each(function () {
      const $input = $(this)
      const row = $input.closest("tr").hasClass("child") ? $input.closest("tr").prev() : $input.closest("tr")
      const rowData = JSON.parse(row.attr("data-row-data") || "{}")
      const inputValue = Number.parseInt($input.val() as string)
      const quantity = Number.parseInt(rowData.totalQuantity)

      // Clear previous error
      $input.removeClass("border-red-500")
      $input.next(".error-message").remove()

      if (isNaN(inputValue) || inputValue <= 0) {
        $input.addClass("border-red-500")
        $input.after(
          '<span class="error-message text-red-500" style="display: block;">*Quantity should not be blank or zero.</span>',
        )
        allValid = false
      } else if (inputValue > quantity) {
        $input.addClass("border-red-500")
        $input.after(
          `<span class="error-message text-red-500" style="display: block;">*Cannot pledge more than ${quantity} shares.</span>`,
        )
        allValid = false
      }
    })
    return allValid
  }

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

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 pb-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                <CardTitle>Margin Pledge</CardTitle>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Label htmlFor="clientId" className="whitespace-nowrap text-sm">
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
                        className="w-32 sm:w-40 md:w-48 h-9 bg-white text-black placeholder-gray-400 text-sm"
                      />
                      <Button onClick={fetchMarginPledgeData} size="sm" className="h-9 px-2 shrink-0">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

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
                          modalRef.current?.open()
                        } else {
                          toast.error("Please review the details before confirming.")
                        }
                      }}
                      className="h-9 whitespace-nowrap ml-auto sm:ml-0"
                    >
                      <HandCoins className="h-4 w-4 mr-2" />
                      Apply Pledge
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex justify-center">
                <div className="w-full max-w-full sm:max-w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <p className="sm:whitespace-nowrap">
                      <span className="font-semibold">Note:</span> Do not pledge stocks you plan to sell today or have
                      already sold. Pledging such stocks can lead to settlement issues or short delivery.
                    </p>
                  </div>
                </div>
              </div>

              {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : (
                <>
                  {data === null ? (
                    <p></p>
                  ) : data.length > 0 ? (
                    <div className="overflow-x-auto" ref={tableRef}>
                      <DataTable
                        columns={columns}
                        data={data}
                        showAllRows={true}
                        showPagination={false}
                        getActionButtonDetails={getActionButtonDetails}
                        selectableRows={true}
                      />
                    </div>
                  ) : (
                    hasSearched && (
                      <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                        <div className="rounded-full bg-muted p-3 mb-4">
                          <FileX className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No records found</h3>
                        <p className="text-muted-foreground mb-4 max-w-md">
                          There are no records available for this criteria.
                        </p>
                      </div>
                    )
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

        {/* Fixed overlay that will stay visible until page navigation */}
        {isRedirecting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Redirecting to CDSL page...</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please Wait! You will be redirected shortly.
                </p>
                <div className="flex justify-center mb-4">
                  <svg
                    className="animate-spin h-10 w-10 text-primary"
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
                </div>
              </div>
            </div>
          </div>
        )}
        <form
          name="frmpledge"
          id="pledgeForm"
          method="POST"
          action={redirectUrl}
          style={{ display: "none" }}
        //target="_blank"
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
