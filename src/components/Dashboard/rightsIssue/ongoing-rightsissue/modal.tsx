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
import type { OngoingRightsIssueConfig } from "./columns"

const rightsIssueSchema = z
  .object({
    rightsissueid: z.number().optional(),
    scrip: z.string().min(1, "Scrip Name is required"),
    price: z.number().positive("Price must be a positive number"),
    isin: z.string().length(12, "ISIN must be exactly 12 characters"),
    fromdate: z.date().nullable(),
    todate: z.date().nullable(),
    activestatus: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .refine((data) => data.todate && data.fromdate && data.todate > data.fromdate, {
    message: "To Date must be after From Date",
    path: ["todate"],
  })

export type RightsIssueFormValues = z.infer<typeof rightsIssueSchema>

interface RightsIssueFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RightsIssueFormValues) => void
  initialData?: OngoingRightsIssueConfig | null
}

export function RightsIssueFormDialog({ isOpen, onClose, onSubmit, initialData }: RightsIssueFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<RightsIssueFormValues>({
    resolver: zodResolver(rightsIssueSchema),
    defaultValues: {
      rightsissueid: 0,
      scrip: "",
      price: 0,
      isin: "",
      fromdate: null,
      todate: null,
      activestatus: "ACTIVE",
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const formattedData = {
          ...initialData,

          fromdate: initialData.fromdate ? new Date(initialData.fromdate) : new Date(),
          todate: initialData.todate ? new Date(initialData.todate) : new Date(),
          price: Number(initialData.price),
        }
        form.reset(formattedData as unknown as RightsIssueFormValues)
      } else {
        form.reset({
          rightsissueid: 0,
          scrip: "",
          price: 0,
          isin: "",
          fromdate: null,
          todate: null,
          activestatus: "ACTIVE",
        })
      }
    } else {
      form.reset()
    }
  }, [isOpen, initialData, form])

  const handleSubmit = (data: RightsIssueFormValues) => {
    onSubmit(data)
    onClose()
  }

  const handleClose = () => {
    form.clearErrors()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="px-6 py-4 bg-gray-100">
          <DialogTitle>{initialData ? "Edit Rights Issue" : "Add Rights Issue"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="scrip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scrip Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter Scrip name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activestatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select active status" />
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
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="Enter Price"
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
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
                      <FormLabel>ISIN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter ISIN" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fromdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="todate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 bg-gray-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

