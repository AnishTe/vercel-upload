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
import type { OngoingBuybackConfig } from "./columns"

const buybackSchema = z
  .object({
    scrip: z.string().min(1, "Scrip Name is required"),
    activestatus: z.enum(["ACTIVE", "INACTIVE"]),
    nsescripcode: z
      .union([z.string().min(1, "NSE Scrip Code is required"), z.number()])
      .transform((val) => val?.toString()),
    bsescripcode: z.string().min(1, "BSE Scrip Code is required"),
    buybackprice: z.number().positive("Buyback Price must be a positive number"),
    isin: z.string().min(12, "ISIN must be at least 12 characters").max(12, "ISIN must be at most 12 characters"),
    fromdate: z.date().nullable(),
    todate: z.date().nullable(),
    nsesettno: z
      .union([z.string().min(1, "NSE Settlement No is required"), z.number()])
      .transform((val) => val?.toString()),
    bsesettno: z
      .union([z.string().min(1, "BSE Settlement No is required"), z.number()])
      .transform((val) => val?.toString()),
  })
  .refine((data) => !data.fromdate || !data.todate || data.todate > data.fromdate, {
    message: "To Date must be after From Date",
    path: ["todate"],
  })

export type BuybackFormValues = z.infer<typeof buybackSchema>

interface BuybackFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BuybackFormValues) => void
  initialData?: OngoingBuybackConfig | null
}

export function BuybackFormDialog({ isOpen, onClose, onSubmit, initialData }: BuybackFormDialogProps) {
  const isEditing = !!initialData

  const form = useForm<BuybackFormValues>({
    resolver: zodResolver(buybackSchema),
    defaultValues: {
      scrip: "",
      activestatus: "ACTIVE",
      nsescripcode: "",
      bsescripcode: "",
      buybackprice: 0,
      isin: "",
      fromdate: null,
      todate: null,
      nsesettno: "",
      bsesettno: "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const formattedData = {
          ...initialData,
          bsescripcode: initialData.original.bsescripcode || "",
          fromdate: initialData.fromdate ? new Date(initialData.fromdate) : null,
          todate: initialData.todate ? new Date(initialData.todate) : null,
          buybackprice:
            typeof initialData.buybackprice === "string"
              ? Number.parseFloat(initialData.buybackprice)
              : initialData.buybackprice,
        }
        form.reset(formattedData as unknown as BuybackFormValues)
      } else {
        form.reset({
          scrip: "",
          activestatus: "ACTIVE",
          nsescripcode: "",
          bsescripcode: "",
          buybackprice: 0,
          isin: "",
          fromdate: null,
          todate: null,
          nsesettno: "",
          bsesettno: "",
        })
      }
    } else {
      form.reset()
    }
  }, [isOpen, initialData, form])

  const handleSubmit = (data: BuybackFormValues) => {
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
          <DialogTitle>{initialData ? "Edit Buyback" : "Add Buyback"}</DialogTitle>
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
                  name="nsescripcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NSE Scrip Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter NSE Scrip Code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bsescripcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BSE Scrip Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter BSE Scrip Code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buybackprice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyback Price</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="Enter Buyback Price"
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

                <FormField
                  control={form.control}
                  name="nsesettno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NSE Settlement No</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter NSE Settlement No" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bsesettno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BSE Settlement No</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter BSE Settlement No" />
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

