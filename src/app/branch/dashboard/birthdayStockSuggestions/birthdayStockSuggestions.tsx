"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { z } from "zod"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { birthdayAddStock, birthdayRecentStock } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"

const stockSchema = z.object({
    stock: z.string().min(1, "Stock field is required"),
})

type StockFormData = z.infer<typeof stockSchema>

export default function StockUploadPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [lastUpdatedStock, setLastUpdatedStock] = useState("")
    const [lastUpdatedTime, setLastUpdatedTime] = useState("")


    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const response = await birthdayRecentStock()
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const { last_updated_stock, lastUpdatedTime } = response.data.data
            setLastUpdatedStock(JSON.parse(last_updated_stock).stock1)
            setLastUpdatedTime(lastUpdatedTime)
        } catch (err) {
            toast.error("Failed to fetch initial data")
        }
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<StockFormData>({
        resolver: zodResolver(stockSchema),
    })

    const onSubmit = async (data: StockFormData) => {
        setIsSubmitting(true)
        try {
            const response = await birthdayAddStock({
                stocks: {
                    stock1: data.stock,
                },
            })
            const tokenIsValid = validateToken(response)

            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            if (response?.data?.data?.stockInserted) {
                toast.success("Stock added successfully.")
                reset()
                await fetchInitialData() // Refresh the data after successful submission
            } else {
                throw new Error(response?.data?.data?.error || "Failed to add stock")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred while adding the stock.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle >Birthday Stock Suggestions</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="flex flex-col items-center gap-8 min-h-[400px]">
                                {/* Info Section */}
                                <div className="p-4 w-full max-w-lg">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-start gap-4">
                                            <p className="text-lg font-bold">
                                                Last Updated Stock:
                                            </p>
                                            <span className="font-medium ">{lastUpdatedStock}</span>
                                        </div>

                                        <div className="flex items-center justify-start gap-4">
                                            <p className="text-lg font-bold">
                                                Last Updated Time:
                                            </p>
                                            <span className="text-md font-medium ">{formatTime(lastUpdatedTime)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Section */}
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="space-y-6 w-full max-w-md p-6 rounded-xl"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="stock" className="text-base font-semibold">
                                            Stock Name
                                        </Label>
                                        <Input id="stock" {...register("stock")} placeholder="Enter stock name" />
                                        {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                        {isSubmitting ? "Uploading..." : "Submit"}
                                    </Button>
                                </form>
                            </div>
                        </CardContent>

                    </Card>
                </div>
            </DashboardLayout>


            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

