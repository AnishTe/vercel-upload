"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { EyeIcon, PlusCircle } from "lucide-react"
import { ongoingRightsIssueConfig, addRightsIssue, editRightsIssue } from "@/api/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"

import dynamic from "next/dynamic"
import { columns, OngoingRightsIssueConfig } from "./columns"
import { RightsIssueFormDialog, RightsIssueFormValues } from "./modal"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function RightsIssue() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<OngoingRightsIssueConfig[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRightsIssue, setEditingRightsIssue] = useState<OngoingRightsIssueConfig | null>(null)
    const tableRef = useRef<HTMLDivElement>(null)

    const fetchOngoingRightIssue = useCallback(async () => {
        setLoading(true)
        try {
            const response = await ongoingRightsIssueConfig()
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData) {
                setData(parsedData)
            } else {
                throw new Error("Failed to fetch Right Issue Records")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOngoingRightIssue()
    }, [fetchOngoingRightIssue])

    const handleAddRightsIssue = async (rightsIssueData: RightsIssueFormValues) => {
        try {
            const record = {
                ...rightsIssueData,
                price: Number(rightsIssueData.price).toString(),
            }
            const response = await addRightsIssue({ data: [record] })
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const responseData = response.data

            if (responseData && responseData.data && responseData.data.length > 0) {
                const allSuccessful = responseData.data.every((item) => item.status === true)
                if (allSuccessful) {
                    toast.success("Rights Issue added successfully")
                    await fetchOngoingRightIssue()
                } else {
                    toast.error("Failed to add rights issue. Please check and try again.")
                }
            } else {
                toast.error(responseData.message || "Failed to add rights issue")
            }
        } catch (error) {
            console.error("Error adding rights issue:", error)
            toast.error("An error occurred while adding the rights issue. Please try again later.")
        } finally {
            setIsDialogOpen(false)
        }
    }

    const handleEditRightsIssue = async (rightsIssueData: RightsIssueFormValues) => {
        if (!editingRightsIssue) return

        try {
            const record = {
                ...rightsIssueData,
                price: Number(rightsIssueData.price).toString(),
                rightsissueid: editingRightsIssue.rightsissueid.toString(),
            }

            const response = await editRightsIssue({ data: [record] })
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const responseData = response.data

            if (responseData && responseData.data && responseData.data.length > 0) {
                const allSuccessful = responseData.data.every((item) => item.status === true)
                if (allSuccessful) {
                    toast.success("Rights Issue updated successfully")
                    await fetchOngoingRightIssue()
                } else {
                    toast.error("Failed to update rights issue. Please check and try again.")
                }
            } else {
                toast.error(responseData.message || "Failed to update rights issue")
            }
        } catch (error) {
            console.error("Error updating rights issue:", error)
            toast.error("An error occurred while updating the rights issue. Please try again later.")
        } finally {
            setIsDialogOpen(false)
            setEditingRightsIssue(null)
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
                    // onClick={() => {
                    //   setEditingRightsIssue(row.original)
                    //   setIsDialogOpen(true)
                    // }}
                    >
                        <EyeIcon className="h-4 w-4" /> View <span className="mx-1">|</span> Edit
                    </Button>
                </div>
            ),
        },
    ]

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        if (actionType === "modal") {
            setEditingRightsIssue(row)
            setIsDialogOpen(true)
        }
    }, [])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle>Rights Issue</CardTitle>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <PlusCircle className="h-4 w-4" /> ADD RIGHTS ISSUE
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <DataTableSkeleton columns={4} rows={10} />
                            ) : error ? (
                                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                            ) : (
                                <div className="overflow-x-auto" ref={tableRef}>
                                    <DataTableArray columns={columnsWithActions} data={data} showAllRows={true} filterColumn="scrip" showPagination={true} getActionButtonDetails={getActionButtonDetails} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            <RightsIssueFormDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false)
                    setEditingRightsIssue(null)
                }}
                onSubmit={editingRightsIssue ? handleEditRightsIssue : handleAddRightsIssue}
                initialData={editingRightsIssue}
            />

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

