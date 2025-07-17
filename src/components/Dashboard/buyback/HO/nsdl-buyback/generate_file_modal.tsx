"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import * as z from "zod"

const fileGenerationSchema = z.object({
  exchange: z.enum(["NSE", "BSE"], {
    required_error: "Please select an exchange.",
  }),
})

type FileGenerationFormData = z.infer<typeof fileGenerationSchema>

interface GenerateFileDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onGenerateFile: (data: FileGenerationFormData) => Promise<void>
  dataAvailable: boolean
}

export function GenerateFileDialog({ isOpen, onOpenChange, onGenerateFile, dataAvailable }: GenerateFileDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<FileGenerationFormData>({
    resolver: zodResolver(fileGenerationSchema),
    defaultValues: {
      exchange: undefined,
    },
  })

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        exchange: undefined,
      })
    }
  }, [isOpen, form])

  const onSubmit = async (data: FileGenerationFormData) => {
    if (!dataAvailable) {
      toast.error("Data not available. Cannot generate file.")
      onOpenChange(false)
      return
    }

    setIsGenerating(true)
    try {
      await onGenerateFile(data)
      //toast.success("File generated successfully!")
    } catch (error) {
      console.error("Error generating file:", error)
      toast.error("An error occurred while generating the file")
    } finally {
      setIsGenerating(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate File</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({
                    exchange: undefined,
                  })
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isGenerating}>
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <FileIcon className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

