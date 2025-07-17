"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { columns } from "./columns"
import { toast } from "sonner"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { deleteOrderIPOBranch, viewAppliedIPOBranch } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

import dynamic from "next/dynamic"
import { getCompatibleUrl } from "@/utils/url-helpers"
import CustomDialog, { type CustomDialogRef } from "@/components/ui/CustomDialog"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function ViewOrders() {
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [rowsTable, setRowsTable] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [ipoId, setIpoId] = useState<string | null>(null)
    const modalRef = useRef<CustomDialogRef | null>(null)

    // Change the type to a single object instead of an array
    const selectedRowsRef = useRef<any>(null)

    useEffect(() => {
        const searchParamsipoId = searchParams.get("ipoId")
        if (searchParamsipoId) {
            setIpoId(searchParamsipoId)
            // Don't use setTimeout here, it's causing issues with state updates
        } else {
            return router.push(getCompatibleUrl(`/branch/dashboard/ipo`))
        }
    }, [router, searchParams])

    const fetchAppliedIPOData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await viewAppliedIPOBranch({ ipoId: ipoId })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            if (response.data && response.data?.data) {
                setRowsTable(response.data.data?.bidDetails)
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }, [ipoId])

    // Add a separate useEffect that watches for ipoId changes
    useEffect(() => {
        if (ipoId) {
            fetchAppliedIPOData()
        }
    }, [fetchAppliedIPOData, ipoId])

    const handleDeleteOrder = async () => {
        // Use the ref value instead of the state
        const rowToDelete = selectedRowsRef.current
        if (!rowToDelete) return

        setLoading(true)
        setError(null)

        try {
            const response = await deleteOrderIPOBranch({
                applicationno: rowToDelete.applicationno.toString(),
                RowId: rowToDelete.original.orderId,
            })

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            if (response?.data?.data) {
                const data = response.data.data
                if (data?.orderDeletedStatus === true) {
                    toast.success("IPO application deleted successfully.", { position: "top-center" })
                    // setRowsTable(rowsTable.filter((row: any) => row.applicationno !== rowToDelete.applicationno))
                    await fetchAppliedIPOData()
                }
            } else {
                throw new Error("Invalid API response format.")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred while deleting the order.", {
                position: "top-center",
            })
        } finally {
            setLoading(false)
            modalRef.current?.close()
            // Clear the ref after operation is complete
            selectedRowsRef.current = null
        }
    }

    // const handleRowClick = (row: any) => {
    //     if (row.original.message) toast.success(row.original.message, { position: "top-center" })
    // }

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        if (actionType === "delete") {
            // Store the row in the ref as a single object, not an array
            selectedRowsRef.current = row
            modalRef.current?.open()
        }
    }, [])

    const columnsWithDelete = columns
        .filter((column) => column.id !== "actions")
        .concat({
            id: "actions",
            accessorKey: "",
            header: "Actions",
            cell: ({ row }: { row: any }) => {
                const disable = row?.original?.applicationstatus === "CANCELLED" || row?.original?.applicationstatus === "FAILED"
                return (
                    <Button variant="destructive" className="action-btn" data-action="delete" disabled={disable}>
                        Delete
                    </Button>
                )
            },
        })

    // Function to render dialog content to avoid re-renders
    const renderDialogContent = () => {
        const row = selectedRowsRef.current
        return (
            <>
                Are you sure you want to delete <span className="font-bold">{row?.companyname || "this"}</span> IPO order <span className="font-bold">{row?.clientId || ""}</span>?
            </>
        )
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>View Applied IPO Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <DataTableSkeleton rows={10} columns={4} />
                            ) : error ? (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : (
                                <DataTableArray
                                    columns={columnsWithDelete}
                                    data={rowsTable}
                                    showAllRows={true}
                                    viewColumns={false}
                                    showPagination={false}
                                    downloadFileName="IPO-Orders"
                                    // onRowClick={handleRowClick}
                                    getActionButtonDetails={getActionButtonDetails}
                                />
                            )}
                            <Button onClick={() => router.push(getCompatibleUrl("/branch/dashboard/ipo"))} className="mt-4">
                                Back to IPO List
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}

            <CustomDialog
                ref={modalRef}
                title="Delete IPO Order?"
                onConfirm={handleDeleteOrder}
                confirmLoading={loading}
                confirmText="Delete"
            >
                {renderDialogContent()}
            </CustomDialog>
        </>
    )
}

