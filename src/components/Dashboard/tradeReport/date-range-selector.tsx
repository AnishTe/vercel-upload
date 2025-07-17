"use client"

import { Button } from "@/components/ui/button"
import { CalendarIcon, Search } from "lucide-react"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { CustomDateDialog } from "./custom-date-dialog"
import { Badge } from "@/components/ui/badge"
import { SegmentSelector } from "./segment-selector"

interface DateRangeSelectorProps {
    selectedPeriod: string
    setSelectedPeriod: Dispatch<SetStateAction<string>>
    fromDate: Date
    setFromDate: Dispatch<SetStateAction<Date>>
    toDate: Date
    setToDate: Dispatch<SetStateAction<Date>>
    isCustomDate: boolean
    setIsCustomDate: Dispatch<SetStateAction<boolean>>
    availableSegments: string[] | undefined
    selectedSegment: string
    setSelectedSegment: Dispatch<SetStateAction<string>>
    onSearch: () => void
}

export function DateRangeSelector({
    selectedPeriod,
    setSelectedPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    isCustomDate,
    setIsCustomDate,
    availableSegments,
    selectedSegment,
    setSelectedSegment,
    onSearch,
}: DateRangeSelectorProps) {
    const [customDialogOpen, setCustomDialogOpen] = useState(false)

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period)

        if (period === "CUSTOM") {
            setIsCustomDate(true)
            setCustomDialogOpen(true)
            return
        }

        setIsCustomDate(false)
        const today = new Date()

        switch (period) {
            case "WEEK":
                setFromDate(startOfDay(subDays(today, 6)))
                setToDate(endOfDay(today))
                break
            case "15DAYS":
                setFromDate(startOfDay(subDays(today, 14)))
                setToDate(endOfDay(today))
                break
            case "MONTH":
                setFromDate(startOfDay(subDays(today, 29)))
                setToDate(endOfDay(today))
                break
            case "3MONTHS":
                setFromDate(startOfDay(subDays(today, 89)))
                setToDate(endOfDay(today))
                break
        }
    }

    const handleCustomDateApply = (newFromDate: Date, newToDate: Date) => {
        setFromDate(newFromDate)
        setToDate(newToDate)
    }

    // Calculate the number of days in the selected range
    const daysDifference = Math.abs(Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))) + 1

    return (
        <div className="space-y-5 border rounded-lg p-4 bg-card/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="text-sm font-medium">Date Range</div>
                        {isCustomDate && (
                            <Badge variant="outline" className="bg-primary/10">
                                {daysDifference} days selected
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        <Button
                            variant={selectedPeriod === "WEEK" ? "default" : "outline"}
                            onClick={() => handlePeriodChange("WEEK")}
                            size="sm"
                        >
                            Week
                        </Button>
                        <Button
                            variant={selectedPeriod === "15DAYS" ? "default" : "outline"}
                            onClick={() => handlePeriodChange("15DAYS")}
                            size="sm"
                        >
                            15 Days
                        </Button>
                        <Button
                            variant={selectedPeriod === "MONTH" ? "default" : "outline"}
                            onClick={() => handlePeriodChange("MONTH")}
                            size="sm"
                        >
                            Month
                        </Button>
                        <Button
                            variant={selectedPeriod === "3MONTHS" ? "default" : "outline"}
                            onClick={() => handlePeriodChange("3MONTHS")}
                            size="sm"
                        >
                            3 Months
                        </Button>
                        <Button
                            variant={selectedPeriod === "CUSTOM" ? "default" : "outline"}
                            onClick={() => handlePeriodChange("CUSTOM")}
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <CalendarIcon className="h-4 w-4" /> Custom
                        </Button>

                        {isCustomDate && (
                            <div className="flex items-center gap-2 ml-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-left font-normal"
                                    onClick={() => setCustomDialogOpen(true)}
                                >
                                    {format(fromDate, "dd/MM/yyyy")} - {format(toDate, "dd/MM/yyyy")}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>



                <div className="flex items-center gap-3 w-full md:w-auto">
                    <SegmentSelector
                        availableSegments={availableSegments}
                        selectedSegment={selectedSegment}
                        setSelectedSegment={setSelectedSegment}
                    />
                    <Button onClick={onSearch} className="flex items-center gap-1">
                        <Search className="h-4 w-4" />
                        Search
                    </Button>
                </div>
            </div>



            <CustomDateDialog
                open={customDialogOpen}
                onOpenChange={setCustomDialogOpen}
                fromDate={fromDate}
                toDate={toDate}
                onApply={handleCustomDateApply}
            />
        </div>
    )
}
