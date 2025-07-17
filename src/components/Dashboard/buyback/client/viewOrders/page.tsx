"use client"
import { useCallback, useRef } from "react"
import { viewClientOrders, deleteOrders } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"
import { ArrowLeft, FileX, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import CustomDialog from "@/components/ui/CustomDialog"
import type { ViewBuybackOrders } from "./columns"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { useUser } from "@/contexts/UserContext"
import { useSearchParams } from "next/navigation"

export default function ViewOrders() {
  const router = useRouter()
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ViewBuybackOrders[]>([])
  const [orderToDelete, setOrderToDelete] = useState<ViewBuybackOrders | null>(null)
  const deleteDialogRef = useRef<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const confirmDeleteOrder = useCallback(async (order: ViewBuybackOrders) => {
    try {
      setLoading(true)

      // Assuming there's a deleteOrders API function
      const record = {
        boid: order.boid,
        scrip: order.Scrip,
        isin: order.isin,
        buybackid: Number.parseInt(order.buybackId),
        clientId: order.clientId.toString(),
        quantity: order.quantity.toString(),
        applied: order.applied.toString(),
        id: order.id,
      }

      const response = await deleteOrders({ data: [record] })

      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data
      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item: any) => item.status === true)
        if (allSuccessful) {
          toast.success(`Order deleted successfully`)

          await viewBuybackOrders()
        } else {
          toast.error("Failed to delete order. Please check and try again.")
        }
      } else {
        toast.error(`Failed to delete order: ${response.data.message || "Unknown error"}`)
      }
    } catch (error: any) {
      console.error("Error deleting order:", error)
      toast.error(`An error occurred while deleting the order: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
      setOrderToDelete(null)
      deleteDialogRef.current?.close()
    }
  }, [])

  const handleDeleteOrder = useCallback((order: ViewBuybackOrders) => {
    const orderStatus = order.orderStatus?.toLowerCase() || ""

    if (orderStatus === "processed") {
      toast.error("Cannot delete a processed order", {
        description: "Orders that have been processed cannot be deleted.",
      })
      return
    }

    if (orderStatus === "cancelled") {
      toast.error("Cannot delete a cancelled order", {
        description: "Orders that have been cancelled cannot be deleted.",
      })
      return
    }

    if (orderStatus === "applied") {
      // Show confirmation dialog for applied orders
      setOrderToDelete(order)
      deleteDialogRef.current?.open()
    } else {
      // For any other status, proceed with deletion
      confirmDeleteOrder(order)
    }
  }, [confirmDeleteOrder])

  const viewBuybackOrders = useCallback(async (clientId = "") => {
    console.log(clientId)
    setLoading(true)
    setError(null)
    try {
      // const response = await viewClientOrders({
      //   clientId: clientId.toString(),
      // })
      const response = await viewClientOrders({ _t: new Date().getTime() })
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        // Add onDelete handler to each row
        const dataWithActions = parsedData.map((item: any) => ({
          ...item,
          onDelete: handleDeleteOrder,
        }))
        setData(dataWithActions)
      } else {
        throw new Error("Failed to fetch Records :(")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [handleDeleteOrder])

  useEffect(() => {
    viewBuybackOrders()
  }, [viewBuybackOrders])

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    if (!status) return "-"

    // Convert status to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase()

    let badgeClass = ""

    // Handle specific status values
    if (statusLower === "processed") {
      badgeClass = "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
    } else if (statusLower === "applied") {
      badgeClass = "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
    } else if (statusLower === "cancelled") {
      badgeClass = "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
    } else {
      badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
    }

    return <Badge className={badgeClass}>{status}</Badge>
  }

  // Render a card for each order
  const renderOrderCard = (order: ViewBuybackOrders, index: number) => {
    return (
      <div
        key={`order-${order.id}-${index}`}
        className="rounded-md mb-2 border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
      >
        <div className="p-3">
          {isMobile ? (
            // Mobile Layout
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{order.Scrip}</span>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        {order.clientId}
                      </Badge>
                      <span className="mx-1 text-gray-400">•</span>
                      <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-700 border-gray-200">
                        BOID: {order.boid}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>{renderStatusBadge(order.orderStatus)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-800 font-medium">Total Qty:</span>{" "}
                  <span className="font-medium text-gray-900">{order.quantity}</span>
                </div>
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-800 font-medium">Applied Qty:</span>{" "}
                  <span className="font-medium text-gray-900">{order.applied}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Time: {order.appliedDate ? format(new Date(order.appliedDate), "yyyy-MM-dd HH:mm:ss") : "-"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => order.onDelete && order.onDelete(order)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            // Desktop Layout - Using grid to evenly distribute content
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Left section - Client Info */}
              <div className="col-span-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{order.Scrip}</span>
                  <div className="flex items-center mt-1 space-x-1">
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {order.clientId}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-700 border-gray-200">
                      BOID: {order.boid}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Middle section - Quantities */}
              <div className="col-span-3 flex items-center space-x-3">
                <div className="text-xs bg-gray-50 px-2 py-1 rounded-md">
                  <span className="text-gray-800 font-medium">Total Qty:</span>{" "}
                  <span className="font-medium text-gray-900">{order.quantity}</span>
                </div>
                <div className="text-xs bg-gray-50 px-2 py-1 rounded-md">
                  <span className="text-gray-800 font-medium">Applied Qty:</span>{" "}
                  <span className="font-medium text-gray-900">{order.applied}</span>
                </div>
              </div>

              {/* Status section */}
              <div className="col-span-2 flex justify-center">{renderStatusBadge(order.orderStatus)}</div>

              {/* Right section - Date and Actions */}
              <div className="col-span-4 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Time: {order.appliedDate ? format(new Date(order.appliedDate), "yyyy-MM-dd HH:mm:ss") : "-"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => order.onDelete && order.onDelete(order)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 p-0 h-8 w-8"
                  onClick={() => router.push(getCompatibleUrl("/client/dashboard/buyback"))}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                <CardTitle className={isMobile ? "text-base" : "text-lg"}>View Buyback Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : (
                <>
                  {data === null ? (
                    <p>No data available</p>
                  ) : data.length > 0 ? (
                    <div className="space-y-1">{data.map((order, index) => renderOrderCard(order, index))}</div>
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

      {/* Confirmation Dialog for Deleting Applied Orders */}
      <CustomDialog
        ref={deleteDialogRef}
        title="Confirm Delete Order"
        onConfirm={() => orderToDelete && confirmDeleteOrder(orderToDelete)}
        confirmText="Delete"
        confirmLoading={loading}
      >
        <div className="space-y-4">
          <p className="text-sm">Are you sure you want to delete this order? This action cannot be undone.</p>

          {orderToDelete && (
            <div className="bg-gray-50 p-3 rounded-md text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Client ID:</span> {orderToDelete.clientId}
                </div>
                <div>
                  <span className="font-medium">BOID:</span> {orderToDelete.boid}
                </div>
                <div>
                  <span className="font-medium">Applied Quantity:</span> {orderToDelete.applied}
                </div>
                <div>
                  <span className="font-medium">Applied Date:</span>{" "}
                  {orderToDelete.appliedDate ? format(new Date(orderToDelete.appliedDate), "yyyy-MM-dd HH:mm:ss") : "-"}
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-700 text-xs">
            <p>Note: Only orders with "Applied" status can be deleted.</p>
          </div>
        </div>
      </CustomDialog>

      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}
