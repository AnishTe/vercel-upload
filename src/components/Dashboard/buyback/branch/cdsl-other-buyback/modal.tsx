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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Info, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { PopoverClose } from "@radix-ui/react-popover"
import { useState, useEffect, useRef } from "react"

// Dynamic schema based on depository type
const createFormSchema = (depositoryType: "CDSL" | "NSDL"): z.ZodObject<any> => {
  const baseSchema = {
    clientId: z.string().min(1, "UCC is required"),
    //branchCode: z.string().min(1, "Branch Code is required"),
    quantity: z.number().positive("Quantity must be positive"),
    depositoryType: z.enum(["CDSL", "NSDL"]),
  }

  if (depositoryType === "CDSL") {
    return z.object({
      ...baseSchema,
      cdslBoId: z.string().regex(/^\d{16}$/, "BO ID must be 16 digits"),
    })
  } else {
    return z.object({
      ...baseSchema,
      dpId: z.string().regex(/^\d{6}$/, "DP ID must be 8 digits"),
      boId: z.string().regex(/^\d{8}$/, "BO ID must be 8 digits"),
    })
  }
}

type CDSLFormValues = z.infer<ReturnType<typeof createFormSchema>>
type NSDLFormValues = z.infer<
  z.ZodObject<{
    clientId: z.ZodString;
    quantity: z.ZodNumber;
    depositoryType: z.ZodEnum<["CDSL", "NSDL"]>;
    dpId: z.ZodString;
    boId: z.ZodString;
  }>
>
type FormValues = CDSLFormValues | NSDLFormValues

interface PlaceOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: FormValues & { scripName: string; isin: string }) => void
  companyDetails: {
    scrip: string
    isin: string
  } | null
}

// Info popover component for reuse
const InfoPopover = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseEnter = () => setIsOpen(true)
    const handleMouseLeave = () => setIsOpen(false)

    element.addEventListener("mouseenter", handleMouseEnter)
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button ref={ref} variant="ghost" size="sm" className="p-0 h-auto ml-1">
          <Info size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[50px] max-w-[250px] p-4 m-2 bg-gray-800 text-white rounded-md shadow-md relative"
        sideOffset={5}
      >
        <div className="absolute right-1 top-1">
          {/* <X className="h-4 w-4" />
          <span className="sr-only">Close</span> */}
        </div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PlaceOrderModal({ isOpen, onClose, onSubmit, companyDetails }: PlaceOrderModalProps) {
  const [depositoryType, setDepositoryType] = useState<"CDSL" | "NSDL">("CDSL")

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(depositoryType)),
    defaultValues: {
      clientId: "",
      //branchCode: "",
      quantity: 0,
      depositoryType: "CDSL",
      ...(depositoryType === "CDSL" ? { cdslBoId: "" } : { dpId: "", boId: "" }),
    },
  })

  const handleDepositoryChange = (value: "CDSL" | "NSDL") => {
    setDepositoryType(value)
    // Reset form with new schema
    form.reset({
      ...form.getValues(),
      depositoryType: value,
      ...(value === "CDSL" ? { cdslBoId: "" } : { dpId: "", boId: "" }),
    })
  }

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
          <DialogTitle>Apply Buyback</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scripName" className="text-right">
                Scrip Name
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
                  <FormLabel className="text-right">UCC</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="branchCode"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Branch Code</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            /> */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Quantity</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input {...field} type="number" onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Depository Selection with Info Icons */}
            <FormField
              control={form.control}
              name="depositoryType"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Depository</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <RadioGroup
                        value={depositoryType}
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleDepositoryChange(value as "CDSL" | "NSDL")
                        }}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="CDSL" id="cdsl" />
                          <div className="flex items-center">
                            <Label htmlFor="cdsl">CDSL</Label>
                            <InfoPopover content="Central Depository Services Limited" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NSDL" id="nsdl" />
                          <div className="flex items-center">
                            <Label htmlFor="nsdl">NSDL</Label>
                            <InfoPopover content="National Securities Depository Limited" />
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Conditional Fields based on Depository Type */}
            {depositoryType === "CDSL" ? (
              <FormField
                control={form.control}
                name="cdslBoId"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">BO ID</FormLabel>
                    <div className="col-span-3">
                      <div className="flex items-center mb-1">
                        <span className="text-sm text-muted-foreground">BO ID must be 16 digits</span>
                        <InfoPopover content="The Beneficial Owner ID (BO ID) for CDSL must be exactly 16 digits long." />
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={16}
                          inputMode="numeric"
                          pattern="\d*"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="dpId"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">DP ID</FormLabel>
                      <div className="col-span-3">
                        <div className="flex items-center mb-1">
                          <span className="text-sm text-muted-foreground">DP ID must be 8 digits</span>
                          <InfoPopover content="The Depository Participant ID (DP ID) for NSDL must be exactly 8 digits long." />
                        </div>
                        <div className="flex">
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
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boId"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">BO ID</FormLabel>
                      <div className="col-span-3">
                        <div className="flex items-center mb-1">
                          <span className="text-sm text-muted-foreground">BO ID must be 8 digits</span>
                          <InfoPopover content="The Beneficial Owner ID (BO ID) for NSDL must be exactly 8 digits long." />
                        </div>
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
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                Apply
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
