"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusCircle, EyeIcon, Search, RefreshCw, BarChart3, CheckCircle2, AlertCircle } from "lucide-react"
import { getApplIsinMTFPledgeView, addAddApplIsinMTFPledge, editApplIsinMTFPledge } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import dynamic from "next/dynamic"
import { columns, type ApplicableIsinMTFPledge } from "./columns"
import { ApplicableIsinFormDialog, type ApplicableIsinFormValues } from "./modal"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function ApplicableIsinMTFPledge() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApplicableIsinMTFPledge[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIsin, setEditingIsin] = useState<ApplicableIsinMTFPledge | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const tableRef = useRef<HTMLDivElement>(null)

  const fetchApplicableIsins = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getApplIsinMTFPledgeView()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setData(parsedData)
      } else {
        throw new Error("Failed to fetch records")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
      toast.error("Failed to load applicable ISINs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplicableIsins()
  }, [fetchApplicableIsins])

  const handleAddApplicableIsin = async (formData: ApplicableIsinFormValues) => {
    try {
      const response = await addAddApplIsinMTFPledge({ data: [formData] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("ISIN added successfully")
          await fetchApplicableIsins()
        } else {
          toast.error("Failed to add ISIN. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to add ISIN")
      }
    } catch (error) {
      console.error("Error adding ISIN:", error)
      toast.error("An error occurred while adding the ISIN. Please try again later.")
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditApplicableIsin = async (formData: ApplicableIsinFormValues) => {
    if (!editingIsin) return

    try {
      const record = {
        ...formData,
        id: editingIsin.original.id,
      }

      const response = await editApplIsinMTFPledge({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("ISIN updated successfully")
          await fetchApplicableIsins()
        } else {
          toast.error("Failed to update ISIN. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to update ISIN")
      }
    } catch (error) {
      console.error("Error updating ISIN:", error)
      toast.error("An error occurred while updating the ISIN. Please try again later.")
    } finally {
      setIsDialogOpen(false)
      setEditingIsin(null)
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
            className="action-btn bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:shadow-md"
            data-action="edit"
            data-id={row.original.id.toString()}
            onClick={(e) => getActionButtonDetails(e, row.original, "edit")}
          >
            <EyeIcon className="h-4 w-4 mr-1" /> View <span className="mx-1">|</span> Edit
          </Button>
        </div>
      ),
    },
  ]

  const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
    if (actionType === "edit") {
      setEditingIsin(row)
      setIsDialogOpen(true)
    }
  }, [])

  // Filter data based on search term and active tab
  const filteredData = data.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      (item.symbolBSE && item.symbolBSE.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.symbolNSE && item.symbolNSE.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.securityName && item.securityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.isin.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && item.activeStatus === "ACTIVE"
    if (activeTab === "inactive") return matchesSearch && item.activeStatus === "INACTIVE"

    return matchesSearch
  })

  // Calculate statistics
  const totalCount = data.length
  const activeCount = data.filter((item) => item.activeStatus === "ACTIVE").length
  const inactiveCount = data.filter((item) => item.activeStatus === "INACTIVE").length

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Applicable ISIN for MTF Pledge</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add ISIN
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DataTableSkeleton columns={6} rows={10} />
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                  <Button variant="outline" onClick={fetchApplicableIsins} className="mt-4">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto" ref={tableRef}>
                    <DataTableArray
                      columns={columnsWithActions}
                      data={filteredData}
                      showAllRows={false}
                      showPagination={true}
                      getActionButtonDetails={getActionButtonDetails}
                      downloadCSV={true}
                      downloadExcel={true}
                      downloadPDF={false}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Add/Edit Dialog */}
      <ApplicableIsinFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingIsin(null)
        }}
        onSubmit={editingIsin ? handleEditApplicableIsin : handleAddApplicableIsin}
        initialData={editingIsin}
      />

      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}
