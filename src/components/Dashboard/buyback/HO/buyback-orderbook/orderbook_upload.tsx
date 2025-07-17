"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  exchange: z.enum(["NSE", "BSE"], {
    required_error: "You must select an exchange.",
  }),
  file: z
    .instanceof(File, { message: "Please select a file." })
    .refine((file) => file.size <= 5000000, `Max file size is 5MB.`),
})

export type FormValues = z.infer<typeof formSchema>

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormValues) => Promise<void>
}

export function FileUploadModal({ isOpen, onClose, onSubmit }: FileUploadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchange: undefined,
      file: undefined,
    },
  })

  // Handle modal close with form reset
  const handleClose = () => {
    form.reset()
    onClose()
  }

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload OrderBook</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="exchange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="NSE" />
                        </FormControl>
                        <FormLabel className="font-normal">NSE</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="BSE" />
                        </FormControl>
                        <FormLabel className="font-normal">BSE</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input type="file" accept="*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit"  className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

