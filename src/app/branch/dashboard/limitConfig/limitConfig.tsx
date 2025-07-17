"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusCircle, EyeIcon, Download, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { getLimitConfig, addLimitConfig, editLimitConfig } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"

import dynamic from "next/dynamic"
import { columns, type LimitConfig } from "./columns"
import { LimitConfigFormDialog, type LimitConfigFormValues } from "./modal"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function LimitConfig() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LimitConfig[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLimitConfig, setEditingLimitConfig] = useState<LimitConfig | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const fetchLimitConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLimitConfig()
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
      toast.error("Failed to load limit configurations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLimitConfig()
  }, [fetchLimitConfig])

  const validateFormData = (data: LimitConfigFormValues): boolean => {
    // Check if at least one segment is selected
    if (!data.applyToCash && !data.applyToFo && !data.applyToMcx && !data.applyToCds) {
      toast.error("Please select at least one segment")
      return false
    }
    return true
  }

  const handleAddLimitConfig = async (limitConfigData: LimitConfigFormValues) => {
    if (!validateFormData(limitConfigData)) return

    try {
      // Convert boolean values to string "0" or "1"
      const formattedData = {
        ...limitConfigData,
        applyToCash: limitConfigData.applyToCash ? "1" : "0",
        applyToFo: limitConfigData.applyToFo ? "1" : "0",
        applyToMcx: limitConfigData.applyToMcx ? "1" : "0",
        applyToCds: limitConfigData.applyToCds ? "1" : "0",
      }

      const response = await addLimitConfig({ data: [formattedData] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Limit Configuration added successfully")
          await fetchLimitConfig()
        } else {
          toast.error("Failed to add Limit Configuration. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to add Limit Configuration")
      }
    } catch (error) {
      console.error("Error adding Limit Configuration:", error)
      toast.error("An error occurred while adding the Limit Configuration. Please try again later.")
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditLimitConfig = async (limitConfigData: LimitConfigFormValues) => {
    if (!editingLimitConfig) return
    if (!validateFormData(limitConfigData)) return

    try {
      // Convert boolean values to string "0" or "1"
      const record = {
        ...limitConfigData,
        id: editingLimitConfig.original.id.toString(),
        applyToCash: limitConfigData.applyToCash ? "1" : "0",
        applyToFo: limitConfigData.applyToFo ? "1" : "0",
        applyToMcx: limitConfigData.applyToMcx ? "1" : "0",
        applyToCds: limitConfigData.applyToCds ? "1" : "0",
      }

      const response = await editLimitConfig({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Limit Configuration updated successfully")
          await fetchLimitConfig()
        } else {
          toast.error("Failed to update Limit Configuration. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to update Limit Configuration")
      }
    } catch (error) {
      console.error("Error updating Limit Configuration:", error)
      toast.error("An error occurred while updating the Limit Configuration. Please try again later.")
    } finally {
      setIsDialogOpen(false)
      setEditingLimitConfig(null)
    }
  }

  // Create the columns with the necessary props
  const columnsWithActions = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="action-btn bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
            data-action="modal"
            data-id={row.original.id.toString()}
            onClick={(e) => getActionButtonDetails(e, row.original, "modal")}
          >
            <EyeIcon className="h-4 w-4 mr-1" /> View <span className="mx-1">|</span> Edit
          </Button>
        </div>
      ),
    },
  ]

  const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
    if (actionType === "modal") {
      setEditingLimitConfig(row)
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Limit Configuration</CardTitle>
              <div className="flex items-center gap-2">

                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Limit
                </Button>
              </div>
            </CardHeader>
            <CardContent>

              {loading ? (
                <DataTableSkeleton columns={8} rows={10} />
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                  <Button variant="outline" onClick={fetchLimitConfig}>
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
      <LimitConfigFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingLimitConfig(null)
        }}
        onSubmit={editingLimitConfig ? handleEditLimitConfig : handleAddLimitConfig}
        initialData={editingLimitConfig}
      />
      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}
