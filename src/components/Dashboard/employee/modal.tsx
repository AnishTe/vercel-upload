"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import * as z from "zod"
import { useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Employee } from "./columns"

const employeeSchema = z
  .object({
    branchCode: z.union([z.string().min(1, "Branch Code is required"), z.number()]).transform((val) => val?.toString()),
    branchName: z.string().min(1, "Branch Name is required"),
    branchHead: z.string().min(1, "Branch Head is required"),
    branchUserId: z.string().min(1, "Branch User ID is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
    confirmPassword: z.string().optional(),
    accountType: z.string().min(1, "Account Type is required"),
    emailId: z.string().email("Invalid email address"),
    telNo: z
      .union([z.string(), z.number()])
      .transform((val) => val?.toString())
      .refine((val) => /^[0-9]{10}$/.test(val || ""), {
        message: "Phone number must be exactly 10 digits",
      }),
    activeStatus: z.enum(["Active", "Inactive"]),
    address: z.string().min(1, "Address is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    zipCode: z
      .union([z.string(), z.number()])
      .transform((val) => val?.toString())
      .pipe(z.string().regex(/^\d{6}$/, "Zip code must be 6 digits")),
    accountLocked: z.enum(["Yes", "No"]),
    mainSub: z.string().optional(),
    mainBranchCode: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword
      }
      return true
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

const passwordChangeSchema = z
  .object({
    id: z.string(),
    userNameEmployee: z.string(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
          autoComplete="new-password"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 "
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

interface EmployeeFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EmployeeFormValues) => void
  onPasswordChange: (data: PasswordChangeFormValues) => void
  initialData?: Employee | null
}

export function EmployeeFormDialog({
  isOpen,
  onClose,
  onSubmit,
  onPasswordChange,
  initialData,
}: EmployeeFormDialogProps) {
  const isEditing = !!initialData
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false)

  const handlePasswordChangeModalClose = () => {
    setIsPasswordChangeModalOpen(false)
    passwordChangeForm.reset({
      id: initialData?.id.toString() || "",
      userNameEmployee: initialData?.branchUserId || "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      branchCode: "",
      branchName: "",
      branchHead: "",
      branchUserId: "",
      // password: "",
      newPassword: "",
      confirmPassword: "",
      accountType: "",
      emailId: "",
      telNo: "",
      activeStatus: "Active",
      address: "",
      state: "",
      city: "",
      zipCode: "",
      accountLocked: "No",
      mainSub: "",
      mainBranchCode: "",
    },
  })

  const passwordChangeForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      id: "",
      userNameEmployee: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // When editing, omit the password field and map the status values
        const { password, ...restData } = initialData.original || initialData
        const mappedData: EmployeeFormValues = {
          ...restData,
          branchCode: restData.branchCode?.toString() || "",
          telNo: restData.telNo?.toString() || "",
          activeStatus: restData.activeStatus === "A" ? "Active" : "Inactive",
          accountLocked: restData.accountLocked === "Y" ? "Yes" : "No",
          zipCode: restData.zipCode?.toString() || "",
        }
        form.reset(mappedData)
        passwordChangeForm.reset({
          id: restData.id?.toString() || "",
          userNameEmployee: restData.branchUserId || "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        // When adding a new employee, reset the form to default values
        form.reset({
          branchCode: "",
          branchName: "",
          branchHead: "",
          branchUserId: "",
          newPassword: "",
          confirmPassword: "",
          accountType: "",
          emailId: "",
          telNo: "",
          activeStatus: "Active",
          address: "",
          state: "",
          city: "",
          zipCode: "",
          accountLocked: "No",
          mainSub: "",
          mainBranchCode: "",
        })
      }
    }
  }, [isOpen, initialData, form, passwordChangeForm])

  const handleSubmit = (data: EmployeeFormValues) => {
    if (!isEditing && data.newPassword !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      })
      return
    }
    // Map the form values back to the API expected format
    const submissionData = {
      ...data,
      activeStatus: data.activeStatus === "Active" ? "A" : "I",
      accountLocked: data.accountLocked === "Yes" ? "Y" : "N",
      password: isEditing ? undefined : data.newPassword,
    }
    onSubmit(submissionData as EmployeeFormValues)
    onClose()
  }

  const handleClose = () => {
    form.clearErrors()
    onClose()
  }

  const handlePasswordChangeSubmit = (data: PasswordChangeFormValues) => {
    onPasswordChange(data)
    setIsPasswordChangeModalOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="px-6 py-4 bg-gray-100 flex flex-row sm:flex-row items-center sm:items-center justify-between">
          <DialogTitle className="text-left text-xl">{initialData ? "Edit Employee" : "Add Employee"}</DialogTitle>
          {isEditing && (
            <div className="pr-4 mt-4 sm:mt-0">
              <Button
                type="button"
                onClick={() => setIsPasswordChangeModalOpen(true)}
                className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 order-1 sm:order-2"
              >
                Change Password
              </Button>
            </div>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { name: "branchCode", label: "Branch Code", placeholder: "Enter branch code" },
                  { name: "branchName", label: "Branch Name", placeholder: "Enter branch name" },
                  { name: "branchUserId", label: "User ID", placeholder: "Enter user ID" },

                  ...(isEditing
                    ? []
                    : [
                      {
                        name: "newPassword",
                        label: "New Password",
                        placeholder: "Enter new password",
                        component: PasswordInput,
                      },
                      {
                        name: "confirmPassword",
                        label: "Confirm Password",
                        placeholder: "Confirm new password",
                        component: PasswordInput,
                      },
                    ]),
                  { name: "branchHead", label: "Branch Head", placeholder: "Enter branch head" },

                  // { name: "accountType", label: "Account Type", placeholder: "Enter account type" },
                  { name: "emailId", label: "Email ID", placeholder: "Enter email ID", type: "email" },
                  { name: "telNo", label: "Mobile Number", placeholder: "Enter mobile number", type: "tel" },
                  { name: "address", label: "Address", placeholder: "Enter address" },
                  { name: "state", label: "State", placeholder: "Enter state" },
                  { name: "city", label: "City", placeholder: "Enter city" },
                  { name: "zipCode", label: "Zip Code", placeholder: "Enter zip code" },
                  { name: "mainSub", label: "Main Sub", placeholder: "Enter main sub" },
                  { name: "mainBranchCode", label: "Main Branch Code", placeholder: "Enter main branch code" },
                ].map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name as keyof EmployeeFormValues}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.component ? (
                            <field.component {...formField} placeholder={field.placeholder} />
                          ) : (
                            <Input
                              {...formField}
                              type={field.type || "text"}
                              placeholder={field.placeholder}
                              value={formField.value || ""}
                              onChange={(e) => {
                                if (field.name === "telNo") {
                                  // Only allow numbers for Mobile Number
                                  formField.onChange(e.target.value.replace(/[^0-9]/g, ""))
                                } else {
                                  formField.onChange(e.target.value)
                                }
                              }}
                              {...(field.name === "telNo" && {
                                inputMode: "numeric",
                                pattern: "[6-9][0-9]{9}",
                                maxLength: 10,
                              })}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="activeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountLocked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Locked</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account locked status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 bg-gray-100 flex flex-row sm:flex-row gap-3 sm:gap-2">
          <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Password Change Modal */}
      <Dialog open={isPasswordChangeModalOpen} onOpenChange={handlePasswordChangeModalClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <Form {...passwordChangeForm}>
            <form onSubmit={passwordChangeForm.handleSubmit(handlePasswordChangeSubmit)} className="space-y-4">
              <FormField
                control={passwordChangeForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} type="hidden" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={passwordChangeForm.control}
                name="userNameEmployee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={passwordChangeForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} placeholder="Enter new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordChangeForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} placeholder="Confirm new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordChangeModalClose}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 order-1 sm:order-2">
                  Change Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export type EmployeeFormValues = z.infer<typeof employeeSchema> & {
  newPassword?: string
  confirmPassword?: string
}
