"use client"
import { repledge, cancelPledgeOrder, generateRepledgeFile } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useCallback, useRef } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2, AlertCircle, FileX } from "lucide-react"
import { columns, type AvailableRepledgeStocksEntry } from "./columns"
import { FileIcon } from "lucide-react"
import $ from "jquery"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import dynamic from "next/dynamic"
import CustomDialog from "@/components/ui/CustomDialog"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
})

export default function RepledgePage() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedRows, setSelectedRows] = useState<AvailableRepledgeStocksEntry[]>([])
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowsRef = useRef<any[]>([])
  //   var selectedRows = selectedRowsRef.current;
  const modalRef = useRef<any | null>(null) // Using ref instead of state

  const [activeTab, setActiveTab] = useState("repledgeStocks")

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

  const availableRepledgeStocks = async () => {
    setLoading(true)
    try {
      const response = await repledge()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setData(parsedData)
      } else {
        throw new Error("Failed to fetch Repledge Stocks :(")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    availableRepledgeStocks()
  }, [])

  const handleGenerateFile = async () => {
    try {
      const response = await generateRepledgeFile()
      if (!validateToken(response)) {
        setShowSessionExpiredModal(true)
        return
      }

      const dataObject = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
      if (dataObject.zipfile) {
        const zipFileLink = dataObject.zipfile
        //downloadZipFile(zipFileLink)

        // function downloadZipFile() {
        //   const zipDownloadLink = document.createElement("a")
        //   zipDownloadLink.href = zipFileLink
        //   zipDownloadLink.setAttribute("download", getFileNameFromUrl(zipFileLink))
        //   zipDownloadLink.style.display = "none"
        //   document.body.appendChild(zipDownloadLink)
        //   zipDownloadLink.click()
        //   document.body.removeChild(zipDownloadLink)
        // }



        if (dataObject.fileGenerationStatus === true) {
          downloadZipFile(zipFileLink)
          toast.success(dataObject.message)
        } else {
          toast.error(dataObject.message)
        }
      } else {
        toast.error("Missing zip file link in the response")
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Failed to generate file"}`)
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

  const handleDeleteOrders = useCallback(async () => {
    const rowsToDelete = selectedRows.length > 0 ? selectedRows : selectedRowsRef.current
    if (isDeleting || rowsToDelete.length === 0) {
      toast.error("Please select orders to delete.")
      return
    }

    setIsDeleting(true)
    try {
      const record = rowsToDelete.map((order) => ({
        clientId: order.original.clientId.toString(),
        orderStatus: order.original.orderStatus,
        isin: order.original.isin,
        id: order.original.id.toString(),
      }))

      const response = await cancelPledgeOrder({ data: record })
      if (!validateToken(response)) {
        setShowSessionExpiredModal(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item: any) => item.updateStatus === true)
        if (allSuccessful) {
          toast.success("Orders deleted successfully.")
          await availableRepledgeStocks()
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
  }, [selectedRows, isDeleting])

  useEffect(() => {
    if (activeTab === "repledgeStocks" && tableRef.current && !$.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable() // Reinitialize if needed
    }
  }, [activeTab])

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    const $table = $(tableRef.current)

    // Remove any existing event listeners to prevent duplicates
    $table.off("select.dt")

    $table.on("select.dt", (e, dt, type, indexes) => {
      if (type === "row") {
        // If only one row is selected, use the original logic
        if (indexes.length === 1) {
          const index = indexes[0]
          const rowData = dt.row(index).data()
          const rowNode = dt.row(index).node()

          // 🚫 Prevent selection if order status is CDSL SUCCESS or CDSL FAIL
          if (["CDSL SUCCESS", "CDSL FAIL"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - Please only select orders with the 'WITH PESB' status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }

          // 🚫 Prevent selection if order status is CANCELLED
          if (["CANCELLED"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - The order is already cancelled. Please only select orders with the 'WITH PESB' order status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }

          if (["WITH PESB"].includes(rowData.original.orderStatus)) {
            $(rowNode).find(".rowCheckbox").prop("checked", true)
            $(rowNode).data("shouldCheck", true)
          }
        }
        // For multiple rows selected at once, group ALL warnings into a single toast
        else {
          // Track all invalid selections in a single array
          const invalidSelections: (string | number)[] = []

          indexes.forEach((index) => {
            const rowData = dt.row(index).data()
            const rowNode = dt.row(index).node()

            // Check if order status is invalid (CDSL SUCCESS, CDSL FAIL, or CANCELLED)
            if (["CDSL SUCCESS", "CDSL FAIL", "CANCELLED"].includes(rowData?.original?.orderStatus)) {
              $(rowNode).data("suppressCheckbox", true)
              dt.row(index).deselect()
              invalidSelections.push(rowData?.original?.clientId || "this client")
              $(rowNode).find(".rowCheckbox").prop("checked", false)
            } else if (["WITH PESB"].includes(rowData?.original?.orderStatus)) {
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
                `Cannot select orders for clients: ${firstThree.join(", ")} and ${remaining} more - Please only select orders with the 'WITH PESB' status.`,
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (tableRef.current) {
        $table.off("select.dt") // Remove event listener when unmounting
      }
    }
  }, [data, activeTab]) // ✅ Now includes activeTab

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">Repledge</CardTitle>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <p>
                  <span className="font-semibold">NOTE:</span> Kindly remove only the orders with the &apos;WITH
                  PESB&apos; order status.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex space-x-2 w-full xs:w-auto sm:w-auto justify-around xs:justify-end sm:justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => {
                    const selectedData = getSelectedRowsData()
                    if (selectedData.length === 0) {
                      toast.error("Please select at least one order to delete")
                      return
                    }

                    // Only if validation passes, set the selected rows and open the dialog
                    selectedRowsRef.current = selectedData
                    setSelectedRows(selectedData)
                    modalRef.current?.open()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
                <Button
                  onClick={handleGenerateFile}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={data.length === 0}
                  size="sm"
                >
                  <FileIcon className="mr-2 h-4 w-4" /> Generate File
                </Button>
              </div>

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
                  <p className="text-muted-foreground mb-4 max-w-md">
                    There are no records available for this criteria.
                  </p>
                </div>
              ) : (
                <>
                  {/* <div className="flex flex-col xs:flex-row sm:flex-row justify-between items-start xs:items-end sm:items-center space-y-2 xs:space-y-0 sm:space-y-0"> */}
                  {/* <div className="">

                    </div> */}
                  {/* <div className="flex space-x-2 w-full xs:w-auto sm:w-auto justify-between xs:justify-end sm:justify-end"> */}

                  {/* <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 xs:flex-none sm:flex-none"
                        onClick={() => {
                          const selectedData = getSelectedRowsData();
                          if (selectedData.length === 0) {
                            toast.error(
                              "Please select at least one order to delete"
                            );
                            return;
                          }

                          // Only if validation passes, set the selected rows and open the dialog
                          selectedRowsRef.current = selectedData;
                          setSelectedRows(selectedData);
                          modalRef.current?.open();
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Order
                      </Button>
                      <Button
                        onClick={handleGenerateFile}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        disabled={data.length === 0}
                        size="sm"
                      >
                        <FileIcon className="mr-2 h-4 w-4" /> Generate File
                      </Button> */}
                  {/* </div> */}
                  {/* </>
                    )} */}
                  {/* </div> */}

                  <div className="overflow-x-auto mt-0" ref={tableRef}>
                    <DataTableArray
                      columns={columns}
                      data={data}
                      showAllRows={true}
                      showPagination={true}
                      selectableRows={true}
                      filterColumn="clientId"
                      filterPlaceholder="Filter ClientID..."
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* <CustomDialog
        ref={modalRef}
        title="Confirm Delete"
        onConfirm={handleDeleteOrders}
        confirmLoading={isDeleting}
        confirmText="Delete"
      >
        <div className="py-2">
          <p>Are you sure you want to delete the selected order(s)?</p>
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
          <p className="text-base font-medium">Are you sure you want to delete the selected order(s)?</p>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">ClientId</TableHead>
                  <TableHead className="w-1/4">Segment</TableHead>
                  <TableHead className="w-1/4">Order Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRows && selectedRows.length > 0 ? (
                  selectedRows.map((share, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{share.clientId}</TableCell>
                      <TableCell className="font-medium">{share.original?.segment || "-"}</TableCell>
                      <TableCell className="font-medium">{share.original?.orderStatus || "-"}</TableCell>
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

      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}
