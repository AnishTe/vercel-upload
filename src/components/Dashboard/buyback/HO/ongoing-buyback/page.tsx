"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { EyeIcon, PlusCircle } from "lucide-react"
import { ongoingBuybacksConfig, addBuyback, editBuyback } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
// import { DataTable } from "@/components/DataTable"
import { columns, type OngoingBuybackConfig } from "./columns"
import { BuybackFormDialog } from "./modal"
import dynamic from "next/dynamic";
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
});
import { toast } from "sonner"

export default function OngoingBuybackPage() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OngoingBuybackConfig[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [editingBuyback, setEditingBuyback] = useState<any | null>(null)


  const fetchOngoingBuyback = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ongoingBuybacksConfig()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setData(parsedData)
      } else {
        throw new Error("Failed to fetch Buyback Records")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOngoingBuyback()
  }, [fetchOngoingBuyback])

  const handleAddBuyback = async (buybackData) => {
    try {
      const record = {
        todate: buybackData.todate,
        nsesettno: buybackData.nsesettno,
        bsesettno: buybackData.bsesettno,
        bsescripcode: buybackData.bsescripcode,
        scrip: buybackData.scrip,
        buybackprice: buybackData.buybackprice.toString(),
        isin: buybackData.isin,
        fromdate: buybackData.fromdate,
        activestatus: buybackData.activestatus,
        nsescripcode: buybackData.nsescripcode
      }

      const response = await addBuyback({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Buyback added successfully")
          await fetchOngoingBuyback()
        } else {
          toast.error("Failed to add buyback. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to add buyback")
      }
    } catch (error) {
      console.error("Error adding buyback:", error)
      toast.error("An error occurred while adding the buyback. Please try again later.")
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditBuyback = async (buybackData) => {
    if (!editingBuyback) return

    try {
      const record = {
        todate: buybackData.todate,
        nsesettno: buybackData.nsesettno,
        bsesettno: buybackData.bsesettno,
        buybackid: editingBuyback.buybackid.toString(),
        bsescripcode: buybackData.bsescripcode,
        scrip: buybackData.scrip,
        buybackprice: buybackData.buybackprice.toString(),
        isin: buybackData.isin,
        fromdate: buybackData.fromdate,
        activestatus: buybackData.activestatus,
        nsescripcode: buybackData.nsescripcode
      }

      const response = await editBuyback({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Buyback updated successfully")
          await fetchOngoingBuyback()
        } else {
          toast.error("Failed to update buyback. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to update buyback")
      }
    } catch (error) {
      console.error("Error updating buyback:", error)
      toast.error("An error occurred while updating the buyback. Please try again later.")
    } finally {
      setIsDialogOpen(false)
      setEditingBuyback(null)
    }
  }

  // Create the columns with the necessary props
  const columnsWithActions = [
    ...columns,
    {
      id: "actions",
      header: "Actions",

      // cell: ({ row }) => {
      //   let buttonHTML = "";
      //       buttonHTML = `<button type="button" 
      //       title="Open Modal"
      //       class="text-blue-500 hover:text-blue-700 action-btn "
      //       data-action="modal"
      //       data-id="${row.original.id || ''}"
      //   >
      //       Edit 
      //   </button>`;

      //   return  `<div class="flex items-center gap-2">
      //       ${buttonHTML}
      //     </div>`
      // }

      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="action-btn bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
            data-action="modal"
            data-id={`${row.original.id} || ''`}
          >
            <EyeIcon className="h-4 w-4" /> View <span className="mx-1">|</span> Edit
          </Button>
        </div>
      ),
    },
  ]


  const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
    event.stopPropagation()
    if (actionType === "modal") {
      setSelectedRow(row)
      setEditingBuyback(row)
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>Ongoing Buybacks</CardTitle>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" /> ADD BUYBACK
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : (
                <DataTableArray columns={columnsWithActions} data={data} showPagination={true} showAllRows={true} filterColumn="scrip" getActionButtonDetails={getActionButtonDetails} />
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <BuybackFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingBuyback(null)
        }}
        onSubmit={editingBuyback ? handleEditBuyback : handleAddBuyback}
        initialData={editingBuyback}
      />

      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}

