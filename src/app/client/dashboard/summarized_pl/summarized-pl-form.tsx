"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Loader, Search } from "lucide-react"
import { useEffect, memo } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Validation Schema
const formSchema = z.object({
    financialYear: z.object({
        fromDate: z.string(),
        toDate: z.string(),
        value: z.string(),
    }),
    toDate: z.string().nonempty("To Date is required"),
})

interface SummarizedPLFormProps {
    financialYears: Array<{
        label: string
        value: string
        fromDate: string
        toDate: string
    }>
    onSubmit: (fromDate: string, toDate: string) => void
    loading: boolean
}

// Memoize the form component to prevent unnecessary re-renders
export const SummarizedPLForm = memo(
    function SummarizedPLForm({ financialYears, onSubmit, loading }: SummarizedPLFormProps) {
        const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                financialYear: financialYears[0],
                toDate: financialYears[0]?.toDate || "",
            },
        })

        const { watch, setValue } = form

        // Watch for financialYear changes
        useEffect(() => {
            const subscription = watch((value, { name }) => {
                if (name === "financialYear") {
                    setValue("toDate", value.financialYear?.toDate || financialYears[0]?.toDate || "")
                }
            })
            return () => subscription.unsubscribe()
        }, [watch, financialYears, setValue])

        const handleSubmit = (formData: z.infer<typeof formSchema>) => {
            const { financialYear, toDate } = formData
            if (financialYear.fromDate && toDate) {
                onSubmit(financialYear.fromDate, toDate)
            }
        }

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="financialYear"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-[200px]">
                                    <Select
                                        onValueChange={(value) => {
                                            // Find the selected year based on value
                                            const selectedYear = financialYears.find((fy) => fy.value === value)
                                            field.onChange(selectedYear) // Pass the selected year object to form
                                        }}
                                        defaultValue={field.value?.value || ""} // Use the 'value' property of the object
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {financialYears.map((fy) => (
                                                <SelectItem key={fy.value} value={fy.value}>
                                                    {fy.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="toDate"
                        render={({ field }) => (
                            <FormItem className="w-[150px]">
                                <FormControl>
                                    <Input
                                        type="date"
                                        className="flex h-10 w-full rounded-md border text-white bg-transparent px-3 py-2 text-sm"
                                        value={format(new Date(field.value.split("/").reverse().join("-")), "yyyy-MM-dd")}
                                        min={format(
                                            new Date(form.watch("financialYear").fromDate.split("/").reverse().join("-")),
                                            "yyyy-MM-dd",
                                        )}
                                        max={format(
                                            new Date(form.watch("financialYear").toDate.split("/").reverse().join("-")),
                                            "yyyy-MM-dd",
                                        )}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value)
                                            field.onChange(format(date, "dd/MM/yyyy"))
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                    </Button>
                </form>
            </Form>
        )
    },
    (prevProps, nextProps) => {
        // Only re-render if loading state changes or if financialYears reference changes
        return prevProps.loading === nextProps.loading && prevProps.financialYears === nextProps.financialYears
    },
)
