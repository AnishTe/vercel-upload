/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import $ from "jquery"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileX, PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { CalendarRange, Building, IndianRupee } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  ongoingBuyback,
  getCDSLOtherBuybackOrders,
  applyforCDSLOtherBuybackHO,
  deleteCDSLOtherBuybackOrdersHO,
  generateCDSLOtherBuybackFile,
} from "@/api/auth"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { ConfirmModal, PlaceOrderModal } from "./modal"
import { GenerateFileDialog } from "./generate_file_modal"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { columns, type CDSLOtherBuybackOrdersHO } from "./columns"
import { BuildingIcon, FileIcon, LibraryIcon } from "lucide-react"

import dynamic from "next/dynamic"
import CustomDialog from "@/components/ui/CustomDialog"
import BuybackDetails from "@/components/BuybackDetails"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
})

interface TemplateOption {
  scrip: string
  value: string
  isin: string
  fromdate: string
  todate: string
  buybackprice: number
  nsesettno: string
  bsesettno: string
}

interface OrderData {
  quantity: string
  clientId: string
  boid: string
  scrip: string
  isin: string
  buybackid: string
  branchcode: string
  dpid: string | null
  orderType: string
}

export default function CDSLOtherBuyback() {
  const [activeTab, setActiveTab] = useState("orders")
  const [data, setData] = useState<CDSLOtherBuybackOrdersHO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const [buybackCompanyOptions, setBuybackCompanyOptions] = useState<TemplateOption[]>([])
  const [selectedBuybackId, setSelectedBuybackId] = useState<string>("")
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<TemplateOption | null>(null)
  const [placeOrderModalOpen, setPlaceOrderModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [orderToConfirm, setOrderToConfirm] = useState<OrderData | null>(null)

  const [selectedRows, setSelectedRows] = useState<CDSLOtherBuybackOrdersHO[]>([])
  const [generateFileModalOpen, setGenerateFileModalOpen] = useState(false)
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<CDSLOtherBuybackOrdersHO | null>(null)

  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowsRef = useRef<any[]>([])
  const modalRef = useRef<any | null>(null) // Using ref instead of state

  // const getSelectedRowsData = () => {
  //   if (!tableRef.current) return []

  //   const dt = $(tableRef.current).find("table").DataTable()
  //   const selectedRows = dt.rows({ selected: true }).nodes() // Get selected row nodes
  //   const selectedData = dt
  //     .rows({ selected: true })
  //     .data()
  //     .toArray()
  //     .map((row, index) => {
  //       const rowNode = selectedRows[index] // Get actual row DOM node

  //       // Extract inputs inside the row
  //       const inputs = $(rowNode).find("input, select, textarea")
  //       const formData: Record<string, any> = {} // Object to store input values

  //       inputs.each(function () {
  //         const fieldName = $(this).attr("id") || $(this).attr("name") || $(this).attr("data-id") // Identify input field
  //         if (fieldName) {
  //           formData[fieldName] = $(this).val() // Store input value
  //         }
  //       })

  //       return {
  //         ...row, // Keep original row data
  //         inputs: formData, // Attach extracted input values
  //       }
  //     })

  //   // Store persistently
  //   return selectedData
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
    selectedRowsRef.current = selectedData
    return selectedData
  }, [])

  const getTemplateNames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ongoingBuyback()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setBuybackCompanyOptions(
          parsedData.map((company: any) => ({
            scrip: company.scrip,
            value: company.buybackid.toString(),
            isin: company.isin,
            fromdate: company.fromdate,
            todate: company.todate,
            buybackprice: company.buybackprice,
            nsesettno: company.nsesettno,
            bsesettno: company.bsesettno,
          })),
        )
      } else {
        throw new Error(parsedData["Error Description"] || "Failed to fetch template data.")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getTemplateNames()
  }, [getTemplateNames])

  const fetchBuybackData = useCallback(async (isin: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getCDSLOtherBuybackOrders({ isin })
      if (!validateToken(response)) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
      setData(parsedData && Array.isArray(parsedData) && parsedData.length > 0 ? parsedData : [])
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCompanySelect = (value: string) => {
    if (!value || value === "NONE") {
      toast.error("Please select a company.")
      setSelectedBuybackId("")
      setData([])
      setSelectedCompanyDetails(null)
      return
    }

    setSelectedBuybackId(value)
    const selectedCompany = buybackCompanyOptions.find((company) => company.value === value)
    if (selectedCompany) {
      setSelectedCompanyDetails(selectedCompany)
      fetchBuybackData(selectedCompany.isin)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const company = selectedCompanyDetails
      // if (!company?.isin) {
      //   toast.error("Please select a company first.")
      //   return
      // }
      if (!orderToConfirm) {
        throw new Error("No order to confirm")
      }

      const response = await applyforCDSLOtherBuybackHO({ data: [orderToConfirm] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const responseData = response.data
      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item: any) => item.status === true)
        if (allSuccessful) {
          toast.success("Order Placed successfully!")
          //setSelectedRows([])
          // Refresh the data only after a successful application
          if (company?.isin) {
            await fetchBuybackData(company.isin)
          }
        } else {
          toast.error("Buyback application failed. Please check and try again.")
        }
      } else {
        toast.error("Failed to apply for buyback. Please try again.")
      }
    } catch (error) {
      console.error("Error during buyback application:", error)
      toast.error("An error occurred while applying for buyback. Please try again later.")
    } finally {
      setLoading(false)
      setConfirmModalOpen(false)
      setPlaceOrderModalOpen(false)
      setOrderToConfirm(null)
    }
  }

  const handlePlaceOrder = async (formData: any) => {
    const orderData: OrderData = {
      quantity: formData.quantity,
      clientId: formData.clientId,
      scrip: selectedCompanyDetails?.scrip || "",
      isin: selectedCompanyDetails?.isin || "",
      buybackid: selectedBuybackId,
      branchcode: formData.branchCode,
      boid: formData.depositoryType === "CDSL" ? formData.cdslBoId : formData.boId,
      dpid: formData.depositoryType === "CDSL" ? "" : `IN${formData.dpId}`,
      orderType: formData.depositoryType === "CDSL" ? "CDSL OTHER" : "NSDL OTHER"
    }
    console.log(orderData)
    setOrderToConfirm(orderData)
    setConfirmModalOpen(true)
    setPlaceOrderModalOpen(false)
  }

  const handleDeleteOrders = useCallback(async () => {
    // const selectedRows = selectedRowsRef.current
    const rowsToDelete = selectedRows.length > 0 ? selectedRows : selectedRowsRef.current
    if (isDeleting || rowsToDelete.length === 0) {
      toast.error("Please select orders to delete.")
      return
    }

    setIsDeleting(true)
    try {
      const company = selectedCompanyDetails
      const buybackId = selectedBuybackId
      if (!company?.scrip || !buybackId) {
        toast.error("Please select a company first.")
        return
      }

      // Format the records for the API call
      const records = rowsToDelete.map((order) => ({
        boid: order.boid,
        dpid: order.dpid,
        scrip: company.scrip,
        isin: order.original.isin,
        buybackid: Number.parseInt(selectedBuybackId),
        clientId: order.clientId.toString(),
        id: order.original.id,
      }))

      // Make the API call
      const response = await deleteCDSLOtherBuybackOrdersHO({ data: records })

      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const responseData = response.data
      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item: any) => item.status === true)
        if (allSuccessful) {
          toast.success("Orders deleted successfully.")
          await fetchBuybackData(company.isin)
        } else {
          toast.error("Failed to delete order. Please check and try again.")
        }
      } else {
        toast.error("Some orders failed to delete.")
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Unknown error"}`)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmDialogOpen(false)
      modalRef.current?.close()
    }
  }, [selectedBuybackId, isDeleting, selectedCompanyDetails, fetchBuybackData, orderToDelete])

  const handleGenerateFile = async (data: { exchange: "NSE" | "BSE"; orderType: "CDSL OTHER" | "NSDL OTHER" }) => {
    try {
      setLoading(true)
      const response = await generateCDSLOtherBuybackFile({
        isin: selectedCompanyDetails?.isin || "",
        exchange: data.exchange,
        orderType: data.orderType
      })

      if (response.data && response.data.data && response.data.data.zipfile) {
        const zipFileLink = response.data.data.zipfile
        downloadZipFile(zipFileLink)
        toast.success("File generated successfully!")
        // Immediately refresh data after successful file generation
        if (selectedCompanyDetails?.isin) {
          await fetchBuybackData(selectedCompanyDetails.isin)
        }
      } else {
        toast.error("Failed to generate file. Please try again.")
      }
    } catch (error) {
      console.error("Error generating file:", error)
      toast.error("An error occurred while generating the file. Please try again later.")
    } finally {
      setLoading(false)
      setGenerateFileModalOpen(false) // Close the modal after operation
    }
  }

  function downloadZipFile(url: string) {
    const link = document.createElement("a")
    link.href = url
    link.download = getFileNameFromUrl(url)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function getFileNameFromUrl(url: string) {
    const parts = url.split("/")
    return parts[parts.length - 1]
  }


  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    const $table = $(tableRef.current)
    $table.off("select.dt")

    $table.on("select.dt", (e, dt, type, indexes) => {
      if (type === "row") {
        // If only one row is selected, use the original logic
        if (indexes.length === 1) {
          const index = indexes[0]
          const rowData = dt.row(index).data()
          const rowNode = dt.row(index).node()

          if (["PROCESSED"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - Please only select orders with the 'APPLIED' status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }

          if (["CANCELLED"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - The order is already cancelled. Please only select orders with the 'APPLIED' order status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }
        } else if (indexes.length > 1) {
          // For multiple rows selected at once, group ALL warnings into a single toast
          // Track all invalid selections in a single array
          const invalidSelections: (string | number)[] = []

          indexes.forEach((index) => {
            const rowData = dt.row(index).data()
            const rowNode = dt.row(index).node()

            // Check if order status is invalid (PROCESSED or CANCELLED)
            if (["PROCESSED", "CANCELLED"].includes(rowData.original.orderStatus)) {
              $(rowNode).data("suppressCheckbox", true)
              dt.row(index).deselect()
              invalidSelections.push(rowData.original.clientId || "this client")
              $(rowNode).find(".rowCheckbox").prop("checked", false)
            } else if (["APPLIED"].includes(rowData.original.orderStatus)) {
              $(rowNode).find(".rowCheckbox").prop("checked", true)
              $(rowNode).data("shouldCheck", true)
            }
          })

          // Show a single warning for all invalid selections
          if (invalidSelections.length > 0) {
            const firstThree = invalidSelections.slice(0, 3)
            const remaining = invalidSelections.length - 3

            if (remaining > 0) {
              toast.warning(
                `Cannot select orders for clients: ${firstThree.join(", ")} and ${remaining} more - Please only select orders with the 'APPLIED' status.`,
                {
                  position: "top-center",
                  duration: 5000,
                },
              )
            } else {
              toast.warning(
                `Cannot select order${firstThree.length > 1 ? "s" : ""} for ${firstThree.join(", ")} - Please only select orders with the 'APPLIED' status.`,
                {
                  position: "top-center",
                  duration: 5000,
                },
              )
            }
          }
        }
      }
    })

    return () => {
      if (tableRef.current) {
        $table.off("select.dt")
      }
    }
  }, [data])


  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>External DP / NSDL Buyback <span className="text-sm text-muted"> (covers NSDL, other CDSL DP, and Non-POA)</span></CardTitle>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <p>
              <span className="font-semibold">NOTE:</span> On End Date Cut_Off
              time to place order is 12:00 PM.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Company Selection Section */}
          <div className="bg-slate-50 rounded-md p-1 mb-2">
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <div className="w-full md:w-auto md:mr-auto">
                {/* <div className="text-sm font-medium mb-1">Select Company</div> */}
                <div className="relative w-full md:w-[260px]">
                  <Select value={selectedBuybackId} onValueChange={handleCompanySelect}>
                    <SelectTrigger className="w-full bg-white h-9">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Select a company</SelectItem>
                      {buybackCompanyOptions.map((company) => (
                        <SelectItem key={company.value} value={company.value}>
                          {company.scrip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCompanyDetails && (
                <>
                  <Button
                    onClick={() => setPlaceOrderModalOpen(true)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    size="sm"
                  >
                    {" "}
                    <PlusCircle className="h-4 w-4" />
                    Place Order
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const selectedData = getSelectedRowsData()
                      if (selectedData.length === 0) {
                        toast.error("Please select at least one order to delete")
                        return
                      }
                      selectedRowsRef.current = selectedData
                      setSelectedRows(selectedData)
                      modalRef.current?.open()
                    }}
                    //disabled={selectedRows.length === 0}
                    className="whitespace-nowrap"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                  </Button>
                  <Button
                    onClick={() => setGenerateFileModalOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white"

                    size="sm"
                  >
                    <FileIcon className="mr-2 h-4 w-4" /> Generate File
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Company Details Section */}
          {/* {selectedCompanyDetails && (
            <div className="mb-0 border rounded-md p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-blue-100 p-1 rounded-md">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Company</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedCompanyDetails.scrip}</span>
                      {selectedCompanyDetails.isin && selectedCompanyDetails.isin !== "-" && (
                        <Badge variant="outline" className="text-xs">
                          {selectedCompanyDetails.isin}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-green-100 p-1 rounded-md">
                    <CalendarRange className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="font-medium text-sm">
                      {selectedCompanyDetails.fromdate && selectedCompanyDetails.fromdate !== "-"
                        ? selectedCompanyDetails.fromdate
                        : "N/A"}
                      {" - "}
                      {selectedCompanyDetails.todate && selectedCompanyDetails.todate !== "-"
                        ? selectedCompanyDetails.todate
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-purple-100 p-1 rounded-md">
                    <IndianRupee className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Price & Settlement No</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">
                        ₹{selectedCompanyDetails.buybackprice > 0 ? selectedCompanyDetails.buybackprice : "N/A"}
                      </span>

                      {selectedCompanyDetails.nsesettno && selectedCompanyDetails.nsesettno !== "-" && (
                        <Badge variant="secondary" className="text-xs">
                          NSE: {selectedCompanyDetails.nsesettno}
                        </Badge>
                      )}
                      {selectedCompanyDetails.bsesettno && selectedCompanyDetails.bsesettno !== "-" && (
                        <Badge variant="secondary" className="text-xs">
                          BSE: {selectedCompanyDetails.bsesettno}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}
          <BuybackDetails selectedCompanyDetails={selectedCompanyDetails} />

          {selectedBuybackId && selectedBuybackId !== "NONE" && (
            <>
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <FileX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No records found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto" ref={tableRef}>
                    <DataTableArray
                      key="buyback_table"
                      columns={columns}
                      data={data}
                      // onSelectedRowsChange={handleSelectedRowsChange}
                      selectableRows={true}
                      showPagination={true}
                      filterColumn="clientId"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {placeOrderModalOpen && (
        <PlaceOrderModal
          isOpen={placeOrderModalOpen}
          onClose={() => setPlaceOrderModalOpen(false)}
          onSubmit={handlePlaceOrder}
          companyDetails={selectedCompanyDetails}
        />
      )}

      {confirmModalOpen && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false)
            setOrderToConfirm(null)
          }}
          onConfirm={handleConfirm}
          title="Confirm Order"
          description="Are you sure you want to place this buyback order?"
        />
      )}

      <GenerateFileDialog
        isOpen={generateFileModalOpen}
        onOpenChange={setGenerateFileModalOpen}
        onGenerateFile={handleGenerateFile}
        dataAvailable={data.length > 0}
      />

      {/* <CustomDialog
        ref={modalRef}
        title="Confirm Delete"
        onConfirm={handleDeleteOrders}
        confirmLoading={isDeleting}
        confirmText="Delete"
      >
        <div className="py-2">
          <p>Are you sure you want to delete the selected buyback order(s)?</p>
          <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
        </div>
      </CustomDialog> */}

      <CustomDialog
        ref={modalRef}
        title="Confirm Delete ?"
        // onClose={() => modalRef.current?.close()}
        onConfirm={handleDeleteOrders}
        confirmLoading={isDeleting}
        confirmText="Delete"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-base font-medium">Are you sure you want to delete the selected buyback order(s)?</p>

            {selectedCompanyDetails && (
              <div className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-md">
                <div className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span className="font-semibold">{selectedCompanyDetails.scrip}</span>

                  {selectedCompanyDetails.buybackprice > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <LibraryIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                      <span className="text-sm text-muted-foreground">ISIN:</span>
                      <Badge variant="secondary" className="font-medium">
                        {selectedCompanyDetails.isin}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">ClientId</TableHead>
                  <TableHead className="w-1/4">Applied Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRows && selectedRows.length > 0 ? (
                  selectedRows.map((share, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{share.clientId}</TableCell>
                      <TableCell className="font-medium">{share.original?.quantity || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No scrip selected
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
    </DashboardLayout>
  )
}

