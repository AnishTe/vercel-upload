"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import * as z from "zod"
import { useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { LimitConfig } from "./columns"

// Define the form schema with Zod validation
const limitConfigSchema = z
  .object({
    id: z.string().optional(),
    clientId: z.union([z.string().min(1, "Client ID is required"), z.number()]).transform((val) => val?.toString()),
    clientType: z.enum(["FAMILY", "INDIVIDUAL"]).default("INDIVIDUAL"),
    activeStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    applyToCash: z.boolean().default(false),
    applyToFo: z.boolean().default(false),
    applyToMcx: z.boolean().default(false),
    applyToCds: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Check if at least one segment is selected
      return data.applyToCash || data.applyToFo || data.applyToMcx || data.applyToCds
    },
    {
      message: "At least one segment must be selected",
      path: ["applyToCash"], // This will show the error on the first checkbox
    },
  )

export type LimitConfigFormValues = z.infer<typeof limitConfigSchema>

interface LimitConfigFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LimitConfigFormValues) => void
  initialData?: LimitConfig | null
}

export function LimitConfigFormDialog({ isOpen, onClose, onSubmit, initialData }: LimitConfigFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<LimitConfigFormValues>({
    resolver: zodResolver(limitConfigSchema),
    defaultValues: {
      id: "",
      clientId: "",
      clientType: "INDIVIDUAL",
      activeStatus: "ACTIVE",
      applyToCash: false,
      applyToFo: false,
      applyToMcx: false,
      applyToCds: false,
    },
    mode: "onChange", // Enable validation as fields change
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Convert string values to boolean for form
        const formattedData = {
          ...initialData,
          applyToCash: String(initialData.applyToCash) === "1",
          applyToFo: String(initialData.applyToFo) === "1",
          applyToMcx: String(initialData.applyToMcx) === "1",
          applyToCds: String(initialData.applyToCds) === "1",
        }
        form.reset(formattedData as unknown as LimitConfigFormValues)
      } else {
        form.reset({
          id: "",
          clientId: "",
          clientType: "INDIVIDUAL",
          activeStatus: "ACTIVE",
          applyToCash: false,
          applyToFo: false,
          applyToMcx: false,
          applyToCds: false,
        })
      }
    } else {
      form.reset()
    }
  }, [isOpen, initialData, form])

  const handleSubmit = (data: LimitConfigFormValues) => {
    onSubmit(data)
  }

  const handleClose = () => {
    form.clearErrors()
    onClose()
  }

  // Check if no segments are selected to show the error message
  const noSegmentsSelected =
    !form.watch("applyToCash") && !form.watch("applyToFo") && !form.watch("applyToMcx") && !form.watch("applyToCds")

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 bg-gray-100">
          <DialogTitle>{initialData ? "Edit Limit Configuration" : "Add Limit Configuration"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client ID <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Client ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                          <SelectItem value="FAMILY">FAMILY</SelectItem>
                        </SelectContent>
                      </Select>
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Apply To Segments <span className="text-red-500">*</span>
                    </h3>
                  </div>

                  {noSegmentsSelected && form.formState.isSubmitted && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="flex gap-2 items-center"> <AlertCircle className="h-4 w-4" /> At least one segment must be selected</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="applyToCash"
                      render={({ field }) => (
                        <FormItem
                          className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${noSegmentsSelected && form.formState.isSubmitted ? "border-red-500" : ""}`}
                        >
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Cash</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applyToFo"
                      render={({ field }) => (
                        <FormItem
                          className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${noSegmentsSelected && form.formState.isSubmitted ? "border-red-500" : ""}`}
                        >
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>FO</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applyToMcx"
                      render={({ field }) => (
                        <FormItem
                          className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${noSegmentsSelected && form.formState.isSubmitted ? "border-red-500" : ""}`}
                        >
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>MCX</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applyToCds"
                      render={({ field }) => (
                        <FormItem
                          className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${noSegmentsSelected && form.formState.isSubmitted ? "border-red-500" : ""}`}
                        >
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>CDS</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="px-0 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? "Update" : "Save"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
