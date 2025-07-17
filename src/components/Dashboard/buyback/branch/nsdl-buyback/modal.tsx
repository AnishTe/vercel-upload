"use client"

import { DialogDescription } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  quantity: z.number().positive("Quantity is required"),
  dpId: z.string().regex(/^\d{6}$/, "DP ID is required"),
  boId: z.string().regex(/^\d{8}$/, "BO ID is required"),
})

type FormValues = z.infer<typeof formSchema>

interface PlaceOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: FormValues & { scripName: string; isin: string }) => void
  companyDetails: {
    scrip: string
    isin: string
  } | null
}

export function PlaceOrderModal({ isOpen, onClose, onSubmit, companyDetails }: PlaceOrderModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      quantity: 0,
      dpId: "",
      boId: "",
    },
  })

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      scripName: companyDetails?.scrip || "",
      isin: companyDetails?.isin || "",
    })
    onClose() // Close the modal after submitting
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply NSDL Buyback</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scripName" className="text-right">
                ScripName
              </Label>
              <Input id="scripName" value={companyDetails?.scrip || ""} className="col-span-3" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isin" className="text-right">
                ISIN
              </Label>
              <Input id="isin" value={companyDetails?.isin || ""} className="col-span-3" readOnly />
            </div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">ClientId</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Quantity</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        // step="0.01"
                        // pattern="\d*"
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dpId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">DpID</FormLabel>
                  <div className="col-span-3 flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-yellow-600 bg-yellow-600 text-white text-sm font-medium">
                      IN
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-l-none"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="\d*"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="boId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">BoID</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={8}
                        inputMode="numeric"
                        pattern="\d*"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 8)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit"  className="bg-yellow-600 hover:bg-yellow-700" onClick={form.handleSubmit(handleSubmit)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  selectedCount?: number
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, selectedCount }: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {selectedCount !== undefined && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Selected records: {selectedCount}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

