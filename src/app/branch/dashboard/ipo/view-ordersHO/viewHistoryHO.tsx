"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { columns } from "./columns"
import { toast } from "sonner"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { deleteOrderIPOHO, viewAppliedIPOClient, viewAppliedIPOHO } from "@/lib/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

import dynamic from "next/dynamic"
import { getCompatibleUrl } from "@/utils/url-helpers"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

export default function ViewOrders() {
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
    const [selectedRow, setSelectedRow] = useState<any>(null)
    const [rowsTable, setRowsTable] = useState<any>(null)
    const [isModalOpen, setModalOpen] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [ipoId, setIpoId] = useState<string | null>(null)

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
            const response = await viewAppliedIPOHO({ ipoId: ipoId })
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
        if (!selectedRow) return
        setLoading(true)
        setError(null)

        try {
            const response = await deleteOrderIPOHO({
                applicationno: selectedRow.applicationno.toString(),
                RowId: selectedRow.original.orderId
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
                    // setRowsTable(rowsTable.filter((row: any) => row.applicationno !== selectedRow.applicationno))
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
            setModalOpen(false)
            setSelectedRow(null)
        }
    }

    // const handleRowClick = (row: any) => {
    //     if (row.original.message) toast.success(row.original.message, { position: "top-center" })
    // }

    const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
        setSelectedRow(row)
        if (actionType === "delete") {
            setModalOpen(true);
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
                                    showPagination={false}
                                    viewColumns={false}
                                    downloadFileName="IPO-Orders"
                                    // onRowClick={handleRowClick}
                                    getActionButtonDetails={getActionButtonDetails}
                                />
                                // <DataTable columns={columnsWithDelete} data={rowsTable} showAllRows={true} />
                            )}
                            <Button onClick={() => router.push(getCompatibleUrl("/branch/dashboard/ipo"))} className="mt-4">
                                Back to IPO List
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}

            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                    <DialogContent
                        className="sm:max-w-[425px]"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault()
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Delete IPO Order?</DialogTitle>
                            <DialogDescription className="py-2 m-4 text-md">
                                Are you sure you want to delete <span className="font-bold">{selectedRow?.companyname || "this"}</span>{" "}
                                IPO order for <span className="font-bold">{selectedRow?.clientId || ""}</span>?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-3">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteOrder} disabled={loading}>
                                {loading ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

