"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusCircle } from "lucide-react"
import { empDetails, addEmployee, editEmployee, changeEmployeePassword } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { columns, type Employee } from "./columns"
import { EmployeeFormDialog, type EmployeeFormValues } from "./modal"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import {
  EyeIcon
} from "lucide-react";

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
  loading: () => <DataTableSkeleton columns={4} rows={10} />,
})
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export default function EmployeeManagementPage() {
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Employee[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [popoverData, setPopoverData] = useState<any | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({
    x: 0,
    y: 0,
    side: "bottom" as "left" | "right" | "bottom",
  })
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const tableRef = useRef(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await empDetails()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData) {
        setData(parsedData)
      } else {
        throw new Error("Failed to fetch Employee Records")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handlePasswordChange = async (passwordData: {
    id: string
    userNameEmployee: string
    newPassword: string
    confirmPassword: string
  }) => {
    try {
      const response = await changeEmployeePassword({
        data: [
          {
            userNameEmployee: passwordData.userNameEmployee,
            password: passwordData.confirmPassword,
            id: passwordData.id,
          },
        ],
      })

      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Password changed successfully")
        } else {
          toast.error("Failed to Password changed. Please check and try again.")
        }
      } else {
        toast.error(response.data.message || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("An error occurred while changing the password. Please try again later.")
    }
  }

  const handleAddEmployee = async (employeeData: EmployeeFormValues) => {
    try {
      const record = {
        branchCode: employeeData.branchCode,
        branchName: employeeData.branchName,
        address: employeeData.address,
        city: employeeData.city,
        state: employeeData.state,
        zipCode: employeeData.zipCode,
        telNo: employeeData.telNo,
        emailId: employeeData.emailId,
        branchHead: employeeData.branchHead,
        branchUserId: employeeData.branchUserId,
        mainSub: employeeData.mainSub || "",
        mainBranchCode: employeeData.mainBranchCode || "",
        activeStatus: employeeData.activeStatus,
        accountLocked: employeeData.accountLocked,
        password: employeeData.confirmPassword,
        accountType: employeeData.accountType,
      }

      const response = await addEmployee({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Employee added successfully")
          await fetchEmployees()
        } else {
          toast.error("Failed to add employee. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to add employee")
      }
    } catch (error) {
      console.error("Error adding employee:", error)
      toast.error("An error occurred while adding the employee. Please try again later.")
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditEmployee = async (employeeData: EmployeeFormValues) => {
    if (!editingEmployee) return

    try {
      const record = {
        branchCode: employeeData.branchCode,
        branchName: employeeData.branchName,
        address: employeeData.address,
        city: employeeData.city,
        state: employeeData.state,
        zipCode: employeeData.zipCode,
        telNo: employeeData.telNo,
        emailId: employeeData.emailId,
        branchHead: employeeData.branchHead,
        branchUserId: employeeData.branchUserId,
        mainSub: employeeData.mainSub || "",
        mainBranchCode: employeeData.mainBranchCode || "",
        activeStatus: employeeData.activeStatus,
        accountLocked: employeeData.accountLocked,
        accountType: employeeData.accountType,
        id: editingEmployee.original.id,
      }

      const response = await editEmployee({ data: [record] })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpired(true)
        return
      }

      const responseData = response.data

      if (responseData && responseData.data && responseData.data.length > 0) {
        const allSuccessful = responseData.data.every((item) => item.status === true)
        if (allSuccessful) {
          toast.success("Employee updated successfully")
          await fetchEmployees()
        } else {
          toast.error("Failed to update employee. Please check and try again.")
        }
      } else {
        toast.error(responseData.message || "Failed to update employee")
      }
    } catch (error) {
      console.error("Error updating employee:", error)
      toast.error("An error occurred while updating the employee. Please try again later.")
    } finally {
      setIsDialogOpen(false)
      setEditingEmployee(null)
    }
  }

  const getActionButtonDetails = useCallback((event: React.MouseEvent, row: any, actionType: string) => {
    event.stopPropagation() // Prevents row click from interfering
    setSelectedRow(row)

    if (actionType === "view") {
      const buttonElement = event.currentTarget as HTMLElement
      const rect = buttonElement.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const isMobile = viewportWidth <= 640

      // For mobile, always show at the bottom
      let side: "left" | "right" | "bottom" = isMobile ? "bottom" : "bottom"

      // For desktop, determine the best side to show the popover
      if (!isMobile) {
        // If button is close to the right edge, position popover to the left
        if (rect.right > viewportWidth - 320) {
          side = "left"
        }
        // If button is close to the left edge, position popover to the right
        else if (rect.left < 320) {
          side = "right"
        }
      }

      setPopoverPosition({
        x: isMobile ? viewportWidth / 2 : rect.left,
        y: rect.bottom,
        side,
      })

      setTimeout(() => {
        setPopoverData(row)
        setIsPopoverOpen(true)
      }, 0)
    } else if (actionType === "modal") {
      setEditingEmployee(row)
      setIsDialogOpen(true)
    }
  }, [])

  // Close popover on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isPopoverOpen) {
        setIsPopoverOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isPopoverOpen])

  // Close popover on resize
  useEffect(() => {
    const handleResize = () => {
      if (isPopoverOpen) {
        setIsPopoverOpen(false)
      }
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isPopoverOpen])

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
            data-id={`${row.original.id} || ''`}
          >
            <EyeIcon className="h-4 w-4" /> View <span className="mx-1">|</span> Edit
          </Button>
          {/* <Button variant="outline" size="sm" className="action-btn bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700" data-action="view">
            View
          </Button> */}
        </div>
      ),
    },
  ]

  // Calculate popover trigger position based on side
  const getTriggerStyle = () => {
    switch (popoverPosition.side) {
      case "left":
        return {
          top: popoverPosition.y,
          left: popoverPosition.x - 10, // Slight offset
          transform: "translateX(-100%)",
        }
      case "right":
        return {
          top: popoverPosition.y,
          left: popoverPosition.x + 10, // Slight offset
        }
      default: // bottom
        return {
          top: popoverPosition.y,
          left: popoverPosition.x,
        }
    }
  }

  return (
    <>
      <DashboardLayout>
        <div className="space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" /> ADD EMPLOYEE
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : (
                <DataTableArray
                  columns={columnsWithActions}
                  data={data}
                  showAllRows={true}
                  showPagination={true}
                  filterColumn="branchName"
                  getActionButtonDetails={getActionButtonDetails}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <EmployeeFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingEmployee(null)
        }}
        onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
        onPasswordChange={handlePasswordChange}
        initialData={editingEmployee}
      />

      {isPopoverOpen && popoverData && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div ref={triggerRef} className="absolute" style={getTriggerStyle()} />
          </PopoverTrigger>
          <PopoverContent
            className="w-[95vw] max-w-[420px]"
            side={window.innerWidth <= 640 ? "bottom" : popoverPosition.side}
            align="start"
            sideOffset={5}
            avoidCollisions={true}
          >
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-lg leading-none">More Details</h4>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsPopoverOpen(false)}>
                  <span className="sr-only">Close</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              </div>
              <div className="space-y-3">
                {popoverData.branchHead && (
                  <div className="bg-muted/50 p-2 rounded-md">
                    <div className="font-semibold text-sm break-words" title={popoverData.branchHead}>
                      {popoverData.branchHead}
                    </div>
                    <div className="text-xs text-muted-foreground">Branch Head</div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Address</div>
                  <div className="text-sm break-words" title={popoverData.address || ""}>
                    {popoverData.address || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">City</div>
                    <div className="text-sm break-words" title={popoverData.city || ""}>
                      {popoverData.city || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">State</div>
                    <div className="text-sm break-words" title={popoverData.state || ""}>
                      {popoverData.state || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Zip Code</div>
                    <div className="text-sm break-words" title={popoverData.zipCode || ""}>
                      {popoverData.zipCode || "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Main Sub</div>
                    <div className="text-sm break-words" title={popoverData.mainSub || ""}>
                      {popoverData.mainSub || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Main Branch Code</div>
                    <div className="text-sm break-words" title={popoverData.mainBranchCode || ""}>
                      {popoverData.mainBranchCode || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {showSessionExpired && <SessionExpiredModal />}
    </>
  )
}

