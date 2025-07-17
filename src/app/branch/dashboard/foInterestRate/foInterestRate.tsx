"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusCircle, EyeIcon, Download, FileSpreadsheet, FileIcon as FilePdf, Search, RefreshCw } from "lucide-react"
import { getFoInterestRate, addFoInterestRate, editFoInterestRate } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import dynamic from "next/dynamic"
import { columns, type FoInterestRate } from "./columns"
import { FoInterestRateFormDialog, type FoInterestRateFormValues } from "./modal"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function FoInterestRate() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FoInterestRate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFoInterestRate, setEditingFoInterestRate] = useState<FoInterestRate | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const fetchFoInterestRate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getFoInterestRate()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setData(parsedData)
      } else {
        throw new Error("Failed to fetch Records")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
      toast.error("Failed to load FO interest rates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFoInterestRate()
  }, [fetchFoInterestRate])

  const validateFormData = (data: FoInterestRateFormValues): boolean => {
    // Additional validation if needed
    if (data.rate <= 0) {
      toast.error("Interest rate must be greater than 0")
      return false
    }
    return true
  }

  const handleFoInterestRate = async (foInterestRateData: FoInterestRateFormValues) => {
    if (!validateFormData(foInterestRateData)) return

    try {
      const record = {
        ...foInterestRateData,
        rate: Number(foInterestRateData.rate).toString(),
      }

      const response = await addFoInterestRate({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("FO Interest Rate added successfully")
          await fetchFoInterestRate()
        } else {
          toast.error("Failed to add FO Interest Rate. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to add FO Interest Rate")
      }
    } catch (error) {
      console.error("Error adding FO Interest Rate:", error)
      toast.error("An error occurred while adding the FO Interest Rate. Please try again later.")
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditFoInterestRate = async (foInterestRateData: FoInterestRateFormValues) => {
    if (!editingFoInterestRate) return
    if (!validateFormData(foInterestRateData)) return

    try {
      const record = {
        ...foInterestRateData,
        rate: Number(foInterestRateData.rate).toString(),
        id: editingFoInterestRate.original.id.toString(),
      }

      const response = await editFoInterestRate({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("FO Interest Rate updated successfully")
          await fetchFoInterestRate()
        } else {
          toast.error("Failed to update FO Interest Rate. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to update FO Interest Rate")
      }
    } catch (error) {
      console.error("Error updating FO Interest Rate:", error)
      toast.error("An error occurred while updating the FO Interest Rate. Please try again later.")
    } finally {
      setIsDialogOpen(false)
      setEditingFoInterestRate(null)
    }
  }

  // Create the columns with the necessary props
  const columnsWithActions = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="action-btn bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors"
          data-action="modal"
          data-id={row.original.id?.toString() || ""}
          onClick={(e) => getActionButtonDetails(e, row.original, "modal")}
        >
          <EyeIcon className="h-4 w-4 mr-1.5" />
          <span>View</span> <span className="mx-1">|</span>{" "}
          <span>Edit</span>
        </Button>
      ),
    },
  ]

  const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
    if (actionType === "modal") {
      setEditingFoInterestRate(row)
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FO Interest Rate</CardTitle>

              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Rate
              </Button>
            </CardHeader>
            <CardContent>

              {loading ? (
                <DataTableSkeleton columns={5} rows={10} />
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                  <Button variant="outline" onClick={fetchFoInterestRate}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto" ref={tableRef}>
                  <DataTableArray
                    columns={columnsWithActions}
                    data={data}
                    showAllRows={false}
                    filterColumn="clientId"
                    showPagination={true}
                    getActionButtonDetails={getActionButtonDetails}
                    downloadCSV={false}
                    downloadExcel={false}
                    downloadPDF={false}
                  />
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
      <FoInterestRateFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingFoInterestRate(null)
        }}
        onSubmit={editingFoInterestRate ? handleEditFoInterestRate : handleFoInterestRate}
        initialData={editingFoInterestRate}
      />
      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}
