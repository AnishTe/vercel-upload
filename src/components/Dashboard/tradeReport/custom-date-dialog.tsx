"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format, subDays, startOfDay, differenceInDays, isAfter } from "date-fns"
import { cn } from "@/lib/utils"
import {
    ChevronRight,
    CalendarIcon,
    Check,
    Info,
    Clock,
    CalendarDays,
    ArrowRight,
    CalendarPlus2Icon as CalendarIcon2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Add imports for the dropdown components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogDescription } from "@radix-ui/react-dialog"

interface CustomDateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fromDate: Date
    toDate: Date
    onApply: (fromDate: Date, toDate: Date) => void
}

// Predefined date range presets
const DATE_PRESETS = [
    { label: "Last 45 days", days: 45 },
    { label: "Last 60 days", days: 60 },
    { label: "Last 180 days", days: 180 },
]

export function CustomDateDialog({ open, onOpenChange, fromDate, toDate, onApply }: CustomDateDialogProps) {
    const [tempFromDate, setTempFromDate] = useState<Date>(fromDate)
    const [tempToDate, setTempToDate] = useState<Date>(toDate)
    const [animateCalendars, setAnimateCalendars] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined)
    const calendarRef = useRef<HTMLDivElement>(null)

    // Get today's date for disabling future dates
    const today = new Date()

    // Calculate the number of days in the selected range
    const daysDifference = useMemo(() => {
        try {
            return differenceInDays(tempToDate, tempFromDate) + 1
        } catch (error) {
            console.error("Error calculating days difference:", error)
            return 0
        }
    }, [tempFromDate, tempToDate])

    // Reset temp dates when dialog opens
    useEffect(() => {
        if (open) {
            setTempFromDate(fromDate)
            setTempToDate(toDate)
            setCalendarMonth(fromDate) // Set calendar to show the from date month
            // Slight delay for animation to trigger after dialog opens
            setTimeout(() => setAnimateCalendars(true), 50)
        } else {
            setAnimateCalendars(false)
            setSelectedPreset(null)
        }
    }, [open, fromDate, toDate])

    // Handle preset selection
    const handlePresetSelection = (days: number) => {
        try {
            const today = new Date()
            const newFromDate = startOfDay(subDays(today, days - 1))

            setSelectedPreset(`Last ${days} days`)

            // Add subtle animation by briefly setting animate to false then true
            setAnimateCalendars(false)
            setTimeout(() => {
                setTempFromDate(newFromDate)
                setTempToDate(today)
                // Set calendar to show the from date month when preset is selected
                setCalendarMonth(newFromDate)
                setAnimateCalendars(true)
            }, 50)
        } catch (error) {
            console.error("Error in preset selection:", error)
        }
    }

    // Handle business period selection
    const handleBusinessPeriodSelection = (preset: string, start: Date, end: Date) => {
        try {
            setSelectedPreset(preset)
            setAnimateCalendars(false)
            setTimeout(() => {
                setTempFromDate(start)
                setTempToDate(end)
                // Set calendar to show the from date month
                setCalendarMonth(start)
                setAnimateCalendars(true)
            }, 50)
        } catch (error) {
            console.error("Error in business period selection:", error)
        }
    }

    const handleApply = () => {
        try {
            // Ensure fromDate is before toDate
            if (tempFromDate > tempToDate) {
                const temp = tempFromDate
                setTempFromDate(tempToDate)
                setTempToDate(temp)
            }

            onApply(tempFromDate, tempToDate)
            onOpenChange(false)
        } catch (error) {
            console.error("Error applying date range:", error)
        }
    }

    // Handle date selection from calendar
    const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
        try {
            // Clear selected preset when manually selecting dates
            if (selectedPreset) {
                setSelectedPreset(null)
            }

            if (range?.from) {
                setTempFromDate(range.from)
            }
            if (range?.to) {
                // Ensure to date is not in the future
                const toDate = range.to && isAfter(range.to, today) ? today : range.to
                setTempToDate(toDate || today)
            }
        } catch (error) {
            console.error("Error selecting date range:", error)
        }
    }

    // Handle jumping to today
    const handleJumpToToday = () => {
        setCalendarMonth(new Date())
    }

    // Handle jumping to from date
    const handleJumpToFromDate = () => {
        setCalendarMonth(tempFromDate)
    }

    // Handle jumping to to date
    const handleJumpToToDate = () => {
        setCalendarMonth(tempToDate)
    }

    // Generate financial years (current year and 3 previous years)
    const financialYears = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 4 }, (_, i) => currentYear - i)
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[800px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <div className="p-4 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center justify-between">
                            <span>Custom Date Range</span>
                            <div className="text-sm font-normal mr-10">
                                <Badge variant="outline" className="bg-primary/10">
                                    {daysDifference} {daysDifference === 1 ? "day" : "days"}
                                </Badge>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">Please try downloading data using a smaller date range for better performance</DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                    {/* Selected range summary */}
                    <div className="bg-muted/30 rounded-lg p-3 text-center transition-all duration-300 hover:bg-muted/50">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="font-medium">{format(tempFromDate, "dd MMM yyyy")}</div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">{format(tempToDate, "dd MMM yyyy")}</div>
                        </div>
                    </div>

                    {/* Quick Select and Common Business Periods in a flex layout */}
                    <div className="flex flex-col md:flex-row justify-between gap-5">
                        {/* Quick presets */}
                        <div className="space-y-2 w-full md:w-auto">
                            <div className="text-sm font-medium text-muted-foreground">Quick Select</div>
                            <div className="flex flex-wrap gap-2">
                                {DATE_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.days}
                                        variant={selectedPreset === preset.label ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePresetSelection(preset.days)}
                                        className="text-xs flex-1 sm:flex-none"
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Common Business Periods */}
                        <div className="space-y-2 w-full md:w-auto">
                            <div className="text-sm font-medium text-muted-foreground">Common Business Periods</div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={selectedPreset === "Current Quarter" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        const today = new Date()
                                        const month = today.getMonth()
                                        const quarterStartMonth = Math.floor(month / 3) * 3
                                        const start = new Date(today.getFullYear(), quarterStartMonth, 1)

                                        handleBusinessPeriodSelection("Current Quarter", start, today)
                                    }}
                                    className="text-xs flex-1 sm:flex-none"
                                >
                                    Current Quarter
                                </Button>

                                <Button
                                    variant={selectedPreset === "Current FY" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        const today = new Date()
                                        const currentYear = today.getFullYear()
                                        const currentMonth = today.getMonth()

                                        // If we're in Jan-Mar, we're in the previous year's FY
                                        const fyYear = currentMonth < 3 ? currentYear - 1 : currentYear

                                        const fyStart = new Date(fyYear, 3, 1) // April 1st
                                        const fyEnd = today < new Date(fyYear + 1, 2, 31) ? today : new Date(fyYear + 1, 2, 31) // March 31st next year or today

                                        handleBusinessPeriodSelection("Current FY", fyStart, fyEnd)
                                    }}
                                    className="text-xs flex-1 sm:flex-none"
                                >
                                    Current FY (Apr-Mar)
                                </Button>

                                {/* Financial Year Dropdown */}
                                <div className="flex-1 sm:flex-none">
                                    <Select
                                        onValueChange={(value) => {
                                            const year = Number.parseInt(value)
                                            const fyStart = new Date(year, 3, 1) // April 1st

                                            // If the end date would be in the future, use today instead
                                            const fyEndDate = new Date(year + 1, 2, 31) // March 31st next year
                                            const fyEnd = isAfter(fyEndDate, today) ? today : fyEndDate

                                            handleBusinessPeriodSelection(`FY ${year}-${year + 1}`, fyStart, fyEnd)
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs w-full sm:w-auto min-w-[120px]">
                                            <SelectValue placeholder="Select FY" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {financialYears.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    FY {year}-{year + 1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar and Date Range Info in a grid - give more space to calendar */}
                    <div
                        className={cn(
                            "grid grid-cols-1 md:grid-cols-5 gap-5 transition-all duration-300 ease-in-out",
                            animateCalendars ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                        )}
                    >
                        {/* Calendar - takes full width on mobile, 3/5 on desktop */}
                        <div className="md:col-span-3 space-y-3" ref={calendarRef}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Select Date Range</span>
                                </div>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center text-xs text-muted-foreground cursor-help">
                                                <Info className="h-4 w-4 mr-1" />
                                                <span>How to select dates</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[200px]">
                                            <p className="text-xs mb-1">1. Click on start date</p>
                                            <p className="text-xs mb-1">2. Then click on end date</p>
                                            <p className="text-xs">Or use the quick select buttons above</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="relative border rounded-lg p-4 shadow-sm bg-card flex items-center justify-center">
                                {/* User-friendly instructions overlay */}
                                {/* <div className="absolute -top-1 -left-1 z-10">
                                    <Badge variant="outline" className="bg-primary/10 text-xs py-1 px-2">
                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                        <span>Select range</span>
                                    </Badge>
                                </div> */}

                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: tempFromDate,
                                        to: tempToDate,
                                    }}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                    month={calendarMonth}
                                    onMonthChange={setCalendarMonth}
                                    numberOfMonths={1}
                                    className="mx-auto "
                                    disabled={(date) => isAfter(date, today)}
                                    fromDate={undefined}
                                    toDate={today}
                                    classNames={{
                                        day_range_start: "bg-primary text-primary-foreground rounded-full",
                                        day_range_end: "bg-primary text-primary-foreground rounded-full",
                                        day_range_middle: "bg-primary/15 text-primary-foreground",
                                        day_today: "border border-primary/50 rounded-full",
                                        day_selected: "!bg-primary !text-primary-foreground hover:!bg-primary/90 rounded-full",
                                        cell: "text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-full",
                                        table: "w-full border-collapse space-y-1",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Date Range Information - takes full width on mobile, 2/5 on desktop */}
                        <div className="md:col-span-2 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span>Date Range Information</span>
                            </div>

                            <div className="border rounded-lg p-4 shadow-sm bg-card space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">From:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleJumpToFromDate}
                                        className="h-auto p-1 font-medium text-sm hover:bg-primary/10 hover:text-primary"
                                    >
                                        {format(tempFromDate, "dd MMM yyyy")}
                                        <CalendarDays className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">To:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleJumpToToDate}
                                        className="h-auto p-1 font-medium text-sm hover:bg-primary/10 hover:text-primary"
                                    >
                                        {format(tempToDate, "dd MMM yyyy")}
                                        <CalendarDays className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Duration:</span>
                                    <span className="font-medium">{daysDifference} days</span>
                                </div>

                                <div className="pt-2 mt-1 border-t">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <CalendarIcon2 className="h-3.5 w-3.5 mr-1" />
                                        <span>
                                            {format(tempFromDate, "EEE")} <ArrowRight className="inline h-3 w-3 mx-1" />{" "}
                                            {format(tempToDate, "EEE")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Visual calendar guide */}
                            <div className="border rounded-lg p-4 shadow-sm bg-card">
                                <div className="text-sm font-medium mb-2">Calendar Guide</div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 rounded-md bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                                            1
                                        </div>
                                        <span>Click to select start date</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 rounded-md bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                                            2
                                        </div>
                                        <span>Click again to select end date</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 rounded-md bg-primary/15 mr-2"></div>
                                        <span>Days in selected range</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleJumpToToday}
                                            className="h-auto p-0 hover:bg-transparent"
                                        >
                                            <div className="w-5 h-5 border border-primary/50 rounded-md mr-2 flex items-center justify-center text-[10px] hover:bg-primary/10">
                                                T
                                            </div>
                                            <span className="hover:text-primary">Today (click to jump)</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-5 py-4 bg-muted/20 border-t flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center mr-auto text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                            {format(tempFromDate, "dd MMM yyyy")} - {format(tempToDate, "dd MMM yyyy")}
                        </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm flex-1 sm:flex-none">
                            Cancel
                        </Button>
                        <Button onClick={handleApply} className="h-9 text-sm flex-1 sm:flex-none">
                            <Check className="h-4 w-4 mr-1" />
                            Apply
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
