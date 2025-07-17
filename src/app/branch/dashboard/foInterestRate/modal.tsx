"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import * as z from "zod"
import { useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InfoIcon } from "lucide-react"
import type { FoInterestRate } from "./columns"

// Define the form schema with Zod validation
const foInterestRateSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Client ID is required"),
  clientType: z.enum(["FAMILY", "INDIVIDUAL"]).default("INDIVIDUAL"),
  segment: z.string().default("FO"),
  rate: z
    .number()
    .positive("Rate must be a positive number")
    .max(100, "Rate cannot exceed 100%")
    .refine((val) => !isNaN(val), {
      message: "Rate must be a valid number",
    }),
  activeStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export type FoInterestRateFormValues = z.infer<typeof foInterestRateSchema>

interface FoInterestRateFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FoInterestRateFormValues) => void
  initialData?: FoInterestRate | null
}

export function FoInterestRateFormDialog({ isOpen, onClose, onSubmit, initialData }: FoInterestRateFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<FoInterestRateFormValues>({
    resolver: zodResolver(foInterestRateSchema),
    defaultValues: {
      id: "",
      clientId: "",
      clientType: "INDIVIDUAL",
      segment: "FO",
      rate: 0,
      activeStatus: "ACTIVE",
    },
    mode: "onChange", // Enable validation as fields change
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const formattedData = {
          ...initialData,
          rate: Number(initialData.rate),
        }
        form.reset(formattedData as FoInterestRateFormValues)
      } else {
        form.reset({
          id: "",
          clientId: "",
          clientType: "INDIVIDUAL",
          segment: "FO",
          rate: 0,
          activeStatus: "ACTIVE",
        })
      }
    } else {
      form.reset()
    }
  }, [isOpen, initialData, form])

  const handleSubmit = (data: FoInterestRateFormValues) => {
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
          <DialogTitle>{initialData ? "Edit FO Interest Rate" : "Add FO Interest Rate"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="segment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Segment <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={true} // Disabled since it should always be FO
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-50">
                            <SelectValue placeholder="Select segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FO">FO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="flex items-center text-xs text-muted-foreground">
                        <InfoIcon className="h-3 w-3 mr-1" /> This field is locked to FO segment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Interest Rate <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="Enter Interest Rate"
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                            className="pr-8"
                          />
                          {/* <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span> */}
                        </div>
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
