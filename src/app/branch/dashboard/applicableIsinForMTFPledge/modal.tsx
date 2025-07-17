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
import type { ApplicableIsinMTFPledge } from "./columns"

// Define the form schema with Zod validation
const applicableIsinSchema = z.object({
  id: z.number().optional(),
  // symbolBSE: z.string().min(1, "BSE Symbol is required"),
  symbolBSE: z
  .union([z.string().min(1, "BSE Symbol is required"), z.number()])
  .transform((val) => val?.toString()),
  // symbolNSE: z.string().min(1, "NSE Symbol is required"),
  symbolNSE: z
  .union([z.string().min(1, "NSE Symbol is required"), z.number()])
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
  initialData?: ApplicableIsinMTFPledge | null
}

export function ApplicableIsinFormDialog({ isOpen, onClose, onSubmit, initialData }: ApplicableIsinFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<ApplicableIsinFormValues>({
    resolver: zodResolver(applicableIsinSchema),
    defaultValues: {
      symbolBSE: "",
      symbolNSE: "",
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
          symbolBSE: initialData.symbolBSE,
          symbolNSE: initialData.symbolNSE || "",
          securityName: initialData.securityName || "",
          isin: initialData.isin,
          activeStatus: initialData.activeStatus,
        })
      } else {
        form.reset({
          symbolBSE: "",
          symbolNSE: "",
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
          <DialogTitle>
            {isEditing ? <>Edit Applicable ISIN for MTF Pledge</> : <>Add Applicable ISIN for MTF Pledge</>}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-6 py-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                <FormField
                  control={form.control}
                  name="symbolBSE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        BSE Symbol <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter BSE Symbol (e.g., 500003)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symbolNSE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        NSE Symbol <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter NSE Symbol (e.g., ADANIENT)" />
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
                      <FormLabel className="flex items-center">
                        Security Name <span className="text-red-500 ml-1">*</span>
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
                      <FormLabel className="flex items-center">
                        ISIN <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter ISIN (e.g., INE123A01011)" />
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
                      <FormLabel className="flex items-center">
                        Status <span className="text-red-500 ml-1">*</span>
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
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)} className="bg-primary hover:bg-primary/90">
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
