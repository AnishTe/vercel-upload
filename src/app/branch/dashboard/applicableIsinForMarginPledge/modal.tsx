"use client"
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
import type { ApplicableIsinMarginPledge } from "./columns"

// Define the form schema with Zod validation
const applicableIsinSchema = z.object({
  id: z.number().optional(),
  // symbol: z.string().min(1, "Symbol is required"),
  symbol: z
  .union([z.string().min(1, "Symbol is required"), z.number()])
  .transform((val) => val?.toString()),
  securityName: z.string().min(1, "Security Name is required"),
  isin: z.string().min(1, "ISIN is required"),
  activeStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export type ApplicableIsinFormValues = z.infer<typeof applicableIsinSchema>

interface ApplicableIsinFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ApplicableIsinFormValues) => void
  initialData?: ApplicableIsinMarginPledge | null
}

export function ApplicableIsinFormDialog({ isOpen, onClose, onSubmit, initialData }: ApplicableIsinFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<ApplicableIsinFormValues>({
    resolver: zodResolver(applicableIsinSchema),
    defaultValues: {
      symbol: "",
      securityName: "",
      isin: "",
      activeStatus: "ACTIVE",
    },
    mode: "onChange", // Enable validation as fields change
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          id: initialData.id,
          symbol: initialData.symbol,
          securityName: initialData.securityName,
          isin: initialData.isin,
          activeStatus: initialData.activeStatus,
        })
      } else {
        form.reset({
          symbol: "",
          securityName: "",
          isin: "",
          activeStatus: "ACTIVE",
        })
      }
    } else {
      form.reset()
    }
  }, [isOpen, initialData, form])

  const handleSubmit = (data: ApplicableIsinFormValues) => {
    onSubmit(data)
  }

  const handleClose = () => {
    form.clearErrors()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 bg-gray-100">
          <DialogTitle>{initialData ? "Edit Applicable ISIN" : "Add Applicable ISIN"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Symbol <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Symbol (e.g., ADANIENT)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Security Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Security Name (e.g., Adani Enterprises Limited)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        ISIN <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter ISIN" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
        <DialogFooter className="px-6 py-4 bg-gray-100 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
