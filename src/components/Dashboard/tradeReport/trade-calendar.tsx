/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import {
    format,
    isSameDay,
    isSameMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addMonths,
    differenceInMonths,
    isToday,
    isWithinInterval,
    parse,
    isValid,
    parseISO,
    endOfDay,
    isAfter,
    isBefore,
} from "date-fns"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef, useCallback } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Info, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TradeCalendarProps {
    tradeDates: Date[]
    fromDate: Date
    toDate: Date
    selectedPeriod: string
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
    tradeData: any[] | null
}

export function TradeCalendar({
    tradeDates,
    fromDate,
    toDate,
    selectedPeriod,
    selectedDate,
    onSelectDate,
    tradeData,
}: TradeCalendarProps) {
    const [calendarMonths, setCalendarMonths] = useState<{ month: Date; label: string }[]>([])
    const [tradeCountByDate, setTradeCountByDate] = useState<Map<string, { count: number; buys: number; sells: number }>>(
        new Map(),
    )
    const [visibleMonthsStart, setVisibleMonthsStart] = useState(0)
    const [totalMonths, setTotalMonths] = useState(0)
    const [visibleMonthsCount, setVisibleMonthsCount] = useState(3) // Default visible months
    const calendarRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // For drag functionality
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [monthWidth, setMonthWidth] = useState(280) // Default month width
    const [isTransitioning, setIsTransitioning] = useState(false)
    const dragThreshold = useRef(5) // Minimum drag distance to consider it a drag vs click
    const dragDistance = useRef(0) // Track drag distance to distinguish between drag and click

    // Track if initial scroll position has been set
    const hasSetInitialPosition = useRef(false)

    // Helper functions for date comparison (polyfill for older date-fns versions)
    const isSameOrAfterDate = (date: Date, dateToCompare: Date): boolean => {
        return isSameDay(date, dateToCompare) || isAfter(date, dateToCompare)
    }

    const isSameOrBeforeDate = (date: Date, dateToCompare: Date): boolean => {
        return isSameDay(date, dateToCompare) || isBefore(date, dateToCompare)
    }

    // Determine how many months to show based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setVisibleMonthsCount(1)
            } else if (window.innerWidth < 1024) {
                setVisibleMonthsCount(2)
            } else {
                setVisibleMonthsCount(3)
            }
        }

        handleResize() // Set initial value
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Set up calendar months based on selected period
    useEffect(() => {
        let months: { month: Date; label: string }[] = []

        // Determine how many months to show based on the selected period
        if (selectedPeriod === "WEEK" || selectedPeriod === "15DAYS") {
            // For shorter periods, show both the from and to months if they differ
            const fromMonth = new Date(fromDate)
            fromMonth.setDate(1) // Set to first day of month

            const toMonth = new Date(toDate)
            toMonth.setDate(1) // Set to first day of month

            // Check if from and to dates are in different months
            if (fromMonth.getMonth() !== toMonth.getMonth() || fromMonth.getFullYear() !== toMonth.getFullYear()) {
                months = [
                    { month: fromMonth, label: format(fromMonth, "MMM ''yy") },
                    { month: toMonth, label: format(toMonth, "MMM ''yy") },
                ]
                setTotalMonths(2)
            } else {
                months = [{ month: fromMonth, label: format(fromMonth, "MMM ''yy") }]
                setTotalMonths(1)
            }
        } else if (selectedPeriod === "MONTH") {
            // For month period, show both the from and to months if they differ
            const fromMonth = new Date(fromDate)
            fromMonth.setDate(1) // Set to first day of month

            const toMonth = new Date(toDate)
            toMonth.setDate(1) // Set to first day of month

            // Check if from and to dates are in different months
            if (fromMonth.getMonth() !== toMonth.getMonth() || fromMonth.getFullYear() !== toMonth.getFullYear()) {
                months = [
                    { month: fromMonth, label: format(fromMonth, "MMM ''yy") },
                    { month: toMonth, label: format(toMonth, "MMM ''yy") },
                ]
                setTotalMonths(2)
            } else {
                months = [{ month: fromMonth, label: format(fromMonth, "MMM ''yy") }]
                setTotalMonths(1)
            }
        } else if (selectedPeriod === "3MONTHS" || selectedPeriod === "CUSTOM") {
            // For 3 months or custom periods, calculate the exact number of months to show
            let currentMonth = new Date(fromDate)
            currentMonth.setDate(1) // Set to first day of month

            // Calculate months difference (add 1 to include both start and end months)
            const toDateEndOfDay = endOfDay(toDate)
            const monthDiff = differenceInMonths(toDateEndOfDay, currentMonth) + 1
            setTotalMonths(monthDiff)

            // Generate all months in the range
            for (let i = 0; i < monthDiff; i++) {
                const month = new Date(currentMonth)
                months.push({
                    month,
                    label: format(month, "MMM ''yy"),
                })
                currentMonth = addMonths(currentMonth, 1)
            }
        }

        setCalendarMonths(months)

        // Always start at the first month when months change
        setVisibleMonthsStart(0)

        // Reset the initial position flag
        hasSetInitialPosition.current = false
    }, [fromDate, toDate, selectedPeriod])

    // Calculate trade counts by date
    useEffect(() => {
        if (!tradeData) return

        const countMap = new Map<string, { count: number; buys: number; sells: number }>()

        tradeData.forEach((trade) => {
            try {
                // Parse the trade date
                const dateStr = trade.TRADE_DATE
                let parsedDate

                // Try different date formats
                try {
                    // Try "DD MMM YYYY" format
                    parsedDate = parse(dateStr, "dd MMM yyyy", new Date())
                    if (!isValid(parsedDate)) {
                        // Try "DD-MM-YYYY" format
                        parsedDate = parse(dateStr, "dd-MM-yyyy", new Date())
                    }
                    if (!isValid(parsedDate)) {
                        // Try "YYYY-MM-DD" format
                        parsedDate = parseISO(dateStr)
                    }
                } catch (e) {
                    return
                }

                if (!isValid(parsedDate)) return

                const dateKey = format(parsedDate, "yyyy-MM-dd")
                const isBuy = Number(trade.BUY_QUANTITY) > 0
                const isSell = Number(trade.SELL_QUANTITY) > 0

                const existing = countMap.get(dateKey) || { count: 0, buys: 0, sells: 0 }

                countMap.set(dateKey, {
                    count: existing.count + 1,
                    buys: existing.buys + (isBuy ? 1 : 0),
                    sells: existing.sells + (isSell ? 1 : 0),
                })
            } catch (error) {
                console.error("Error processing trade date:", error)
            }
        })

        setTradeCountByDate(countMap)
    }, [tradeData])

    // Calculate month width and center the active month
    useEffect(() => {
        if (!scrollContainerRef.current || calendarMonths.length === 0) return

        // Get the width of a month element (including gap)
        const firstMonth = scrollContainerRef.current.querySelector("[data-month]") as HTMLElement
        if (firstMonth) {
            const computedStyle = window.getComputedStyle(firstMonth)
            const width = firstMonth.offsetWidth
            const marginRight = Number.parseInt(computedStyle.marginRight || "0", 10)
            setMonthWidth(width + marginRight)
        }

        // Ensure the first month is fully visible
        if (!hasSetInitialPosition.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0
                    ensureMonthVisible(visibleMonthsStart)
                    hasSetInitialPosition.current = true
                }
            }, 50)
        }
    }, [visibleMonthsStart, calendarMonths])

    // Ensure the specified month is fully visible
    const ensureMonthVisible = useCallback((monthIndex: number) => {
        if (!scrollContainerRef.current) return

        const monthElement = scrollContainerRef.current.querySelector(`[data-month="${monthIndex}"]`) as HTMLElement
        if (!monthElement) return

        const containerRect = scrollContainerRef.current.getBoundingClientRect()
        const monthRect = monthElement.getBoundingClientRect()

        // Check if the month is not fully visible
        if (monthRect.left < containerRect.left) {
            // Month is partially off to the left
            scrollContainerRef.current.scrollLeft += monthRect.left - containerRect.left - 10
        } else if (monthRect.right > containerRect.right) {
            // Month is partially off to the right
            scrollContainerRef.current.scrollLeft += monthRect.right - containerRect.right + 10
        }
    }, [])

    // Scroll to a specific month and center it
    const scrollToMonth = useCallback(
        (monthIndex: number) => {
            if (!scrollContainerRef.current || isTransitioning) return

            // First update the visible month state
            setVisibleMonthsStart(monthIndex)
            setIsTransitioning(true)

            // Calculate scroll position for the target month
            const monthElement = scrollContainerRef.current.querySelector(`[data-month="${monthIndex}"]`) as HTMLElement

            if (monthElement) {
                // Get positions and dimensions
                const containerRect = scrollContainerRef.current.getBoundingClientRect()
                const monthRect = monthElement.getBoundingClientRect()
                const containerWidth = containerRect.width
                const monthWidth = monthRect.width

                // Calculate target scroll position to center the month
                const targetLeft = monthElement.offsetLeft - (containerWidth - monthWidth) / 2

                // Scroll to position
                scrollContainerRef.current.scrollTo({
                    left: Math.max(0, targetLeft),
                    behavior: "smooth",
                })
            } else {
                // Fallback to approximate position if element not found
                const approxMonthWidth = 250 // approximate width for small screens
                const containerWidth = scrollContainerRef.current.offsetWidth
                const scrollPosition = monthIndex * approxMonthWidth - (containerWidth - approxMonthWidth) / 2

                scrollContainerRef.current.scrollTo({
                    left: Math.max(0, scrollPosition),
                    behavior: "smooth",
                })
            }

            // Reset transitioning state after animation completes
            setTimeout(() => {
                setIsTransitioning(false)
                ensureMonthVisible(monthIndex)
            }, 350) // Slightly longer than CSS transition duration
        },
        [ensureMonthVisible, isTransitioning],
    )

    // Handle month click - when clicking on a faded month
    const handleMonthClick = useCallback(
        (monthIndex: number, e: React.MouseEvent) => {
            // Check if the click was directly on a day element (not on the month container)
            const target = e.target as HTMLElement
            if (target.closest('[data-day="true"]')) return

            if (monthIndex === visibleMonthsStart || isTransitioning) return // Already the active month or transitioning
            if (dragDistance.current > dragThreshold.current) return // Ignore if this was a drag

            scrollToMonth(monthIndex)
        },
        [visibleMonthsStart, isTransitioning, scrollToMonth],
    )

    // Drag handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!scrollContainerRef.current || isTransitioning) return

            setIsDragging(true)
            dragDistance.current = 0
            setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
            setScrollLeft(scrollContainerRef.current.scrollLeft)
            scrollContainerRef.current.style.cursor = "grabbing"
            document.body.style.userSelect = "none"
        },
        [isTransitioning],
    )

    const handleMouseUp = useCallback(() => {
        if (!scrollContainerRef.current || !isDragging) return

        setIsDragging(false)
        scrollContainerRef.current.style.cursor = "grab"
        document.body.style.removeProperty("user-select")

        // Only snap if this wasn't just a click
        if (dragDistance.current <= dragThreshold.current) {
            return
        }

        // Snap to the nearest month
        const scrollPosition = scrollContainerRef.current.scrollLeft
        const nearestMonthIndex = Math.round(scrollPosition / monthWidth)
        const validIndex = Math.min(Math.max(0, nearestMonthIndex), totalMonths - 1)

        // Only update if it's a different month
        if (validIndex !== visibleMonthsStart) {
            scrollToMonth(validIndex)
        }
    }, [isDragging, monthWidth, totalMonths, visibleMonthsStart, scrollToMonth])

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !scrollContainerRef.current) return

            const x = e.pageX - scrollContainerRef.current.offsetLeft
            const dx = x - startX
            dragDistance.current = Math.abs(dx)

            // Update scroll position
            scrollContainerRef.current.scrollLeft = scrollLeft - dx

            // Prevent default to avoid text selection during drag
            e.preventDefault()
        },
        [isDragging, startX, scrollLeft],
    )

    // Touch handlers for mobile
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!scrollContainerRef.current || isTransitioning) return

            setIsDragging(true)
            dragDistance.current = 0
            setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft)
            setScrollLeft(scrollContainerRef.current.scrollLeft)
        },
        [isTransitioning],
    )

    const handleTouchEnd = useCallback(() => {
        handleMouseUp() // Reuse the same logic
    }, [handleMouseUp])

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging || !scrollContainerRef.current) return

            const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
            const dx = x - startX
            dragDistance.current = Math.abs(dx)

            // Update scroll position
            scrollContainerRef.current.scrollLeft = scrollLeft - dx
        },
        [isDragging, startX, scrollLeft],
    )

    // Navigation handlers
    const handlePrevMonth = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault() // Prevent any default behavior
            e.stopPropagation() // Stop event propagation

            if (visibleMonthsStart > 0 && !isTransitioning) {
                const newMonthIndex = visibleMonthsStart - 1
                scrollToMonth(newMonthIndex)
            }
        },
        [visibleMonthsStart, isTransitioning, scrollToMonth],
    )

    const handleNextMonth = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault() // Prevent any default behavior
            e.stopPropagation() // Stop event propagation

            if (visibleMonthsStart < totalMonths - 1 && !isTransitioning) {
                const newMonthIndex = visibleMonthsStart + 1
                scrollToMonth(newMonthIndex)
            }
        },
        [visibleMonthsStart, totalMonths, isTransitioning, scrollToMonth],
    )

    // Optimized day click handler for faster response
    const handleDayClick = useCallback(
        (day: Date, isTradeDay: boolean, monthData: Date, e: React.MouseEvent) => {
            // Stop event propagation to prevent month click
            e.stopPropagation()

            // Only allow clicking if it's a trade day
            if (!isTradeDay) return
            if (dragDistance.current > dragThreshold.current) return // Ignore if this was a drag

            // Find which month this day belongs to
            const monthIndex = calendarMonths.findIndex((m) => isSameMonth(day, m.month))

            // If the day is in a different month than the active one, select that month first
            if (monthIndex !== -1 && monthIndex !== visibleMonthsStart && !isTransitioning) {
                setVisibleMonthsStart(monthIndex)

                // Scroll to the month containing the clicked date
                scrollToMonth(monthIndex)
            }

            // Select the date regardless of which month it's in
            if (selectedDate && isSameDay(selectedDate, day)) {
                // If clicking the already selected date, clear the selection
                onSelectDate(null)
            } else {
                // Otherwise, select this date
                onSelectDate(day)
            }
        },
        [selectedDate, onSelectDate, calendarMonths, visibleMonthsStart, isTransitioning, scrollToMonth],
    )

    if (!tradeDates || tradeDates.length === 0) return null

    // Count trades per day for the tooltip
    const getTradeCountForDay = (day: Date) => {
        const dateKey = format(day, "yyyy-MM-dd")
        return tradeCountByDate.get(dateKey)?.count || 0
    }

    const getBuySellCountForDay = (day: Date) => {
        const dateKey = format(day, "yyyy-MM-dd")
        const counts = tradeCountByDate.get(dateKey)
        return {
            buys: counts?.buys || 0,
            sells: counts?.sells || 0,
        }
    }

    // Get dot size based on trade count
    const getDotSize = (count: number) => {
        if (count >= 5) return "w-2.5 h-2.5"
        if (count >= 3) return "w-2 h-2"
        return "w-1.5 h-1.5"
    }

    // Check if navigation buttons should be enabled
    const canGoBack = visibleMonthsStart > 0
    const canGoForward = visibleMonthsStart < totalMonths - 1

    return (
        <div className="border rounded-lg p-3 bg-card/50">
            {/* Header section - Responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                {/* Title and month indicator */}
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-sm font-medium">Trade Activity Calendar</h3>

                    {totalMonths > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                            {visibleMonthsStart + 1}/{totalMonths}
                        </span>
                    )}
                </div>

                {/* Buy/Sell color indicators - visible on all screens */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            <span className="text-xs text-muted-foreground">Buy</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                            <span className="text-xs text-muted-foreground">Sell</span>
                        </div>
                    </div>

                    {/* Date range - hidden on small screens */}
                    <div className="hidden sm:block text-xs text-muted-foreground">
                        {format(fromDate, "dd MMM yyyy")} - {format(toDate, "dd MMM yyyy")}
                    </div>
                </div>

                {/* Filter badge and info */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                    {selectedDate && (
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1 bg-primary/10 text-xs py-1 max-w-[calc(100%-40px)]"
                        >
                            <span className="truncate">Filtered: {format(selectedDate, "dd MMM yyyy")}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 ml-1 hover:bg-primary/20 flex-shrink-0"
                                onClick={() => onSelectDate(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center text-xs text-muted-foreground cursor-help">
                                    <Info className="h-3.5 w-3.5 mr-1" />
                                    <span className="hidden sm:inline">Click on a trade day to filter</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border border-border p-2 max-w-[250px]">
                                <p className="text-xs font-medium text-foreground mb-1">Calendar Guide</p>
                                <p className="text-xs mb-1">Days with dots indicate trading activity</p>
                                <p className="text-xs mb-1">Click a day to filter trades for that date</p>
                                <div className="flex items-center mt-2">
                                    <div className="w-2 h-2 rounded-full bg-primary mr-1"></div>
                                    <span className="text-xs font-medium">Larger dots = more trades</span>
                                </div>
                                <div className="flex items-center mt-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                    <span className="text-xs">Buy trades</span>
                                </div>
                                <div className="flex items-center mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                    <span className="text-xs">Sell trades</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Month indicator dots */}
            {totalMonths > 1 && (
                <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1 max-w-full">
                        {calendarMonths.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${idx === visibleMonthsStart ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                                    } cursor-pointer`}
                                onClick={() => !isTransitioning && scrollToMonth(idx)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar carousel with draggable functionality and side navigation buttons */}
            <div className="relative overflow-hidden">
                {/* Left fade effect and navigation button */}
                {canGoBack && (
                    <>
                        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none"></div>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handlePrevMonth}
                            disabled={!canGoBack || isTransitioning}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </>
                )}

                {/* Right fade effect and navigation button */}
                {canGoForward && (
                    <>
                        <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none"></div>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleNextMonth}
                            disabled={!canGoForward || isTransitioning}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
                        >
                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </>
                )}

                {/* Calendar months container - draggable */}
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        cursor: isDragging ? "grabbing" : "grab",
                        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                >
                    {/* Small left padding */}
                    <div className="flex-shrink-0 w-2"></div>

                    {calendarMonths.map((monthData, index) => {
                        // Determine if this is the active month
                        const isActive = index === visibleMonthsStart
                        // Determine distance from active month for scaling/opacity
                        const distance = Math.abs(index - visibleMonthsStart)

                        // Calculate opacity and scale based on distance
                        // Increase minimum opacity to ensure all months are visible
                        let opacity = 1
                        let scale = 1

                        if (distance > 0) {
                            opacity = Math.max(0.7, 1 - distance * 0.1) // Higher minimum opacity
                            scale = Math.max(0.9, 1 - distance * 0.03) // Less dramatic scaling
                        }

                        return (
                            <div
                                key={index}
                                data-month={index}
                                onClick={(e) => handleMonthClick(index, e)}
                                className={cn(
                                    "border rounded-md p-1 sm:p-2 bg-background flex-shrink-0 w-[250px] sm:w-[280px] mx-auto",
                                    "transition-all duration-300 ease-in-out will-change-transform",
                                    !isActive && !isTransitioning && "cursor-pointer hover:border-primary/50",
                                    isTransitioning && "pointer-events-none",
                                    isActive ? "border-primary border-2 shadow-sm" : "border-muted-foreground/20",
                                )}
                                style={{
                                    opacity,
                                    transform: `scale(${scale})`,
                                    transformOrigin: index < visibleMonthsStart ? "right center" : "left center",
                                }}
                            >
                                <div className="text-center text-xs font-medium mb-1 sm:mb-2">
                                    {monthData.label}
                                    {isActive && <span className="ml-1 text-[10px] text-primary">(Selected)</span>}
                                </div>
                                <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs mb-1">
                                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                                        <div key={i} className="h-4 sm:h-5 flex items-center justify-center text-muted-foreground">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-0.5 min-h-[210px]">
                                    {eachDayOfInterval({
                                        start: startOfWeek(startOfMonth(monthData.month), { weekStartsOn: 1 }),
                                        end: endOfWeek(endOfMonth(monthData.month), { weekStartsOn: 1 }),
                                    }).map((day, dayIndex) => {
                                        const isTradeDay = tradeDates.some((tradeDate) => isSameDay(tradeDate, day))
                                        const tradeCount = isTradeDay ? getTradeCountForDay(day) : 0
                                        const { buys, sells } = getBuySellCountForDay(day)
                                        const isInRange = isWithinInterval(day, { start: fromDate, end: toDate })
                                        const isCurrentMonth = isSameMonth(day, monthData.month)

                                        // Only show selected state if the day is in the current month
                                        const isSelected = selectedDate && isSameDay(selectedDate, day) && isCurrentMonth

                                        const dotSize = getDotSize(tradeCount)

                                        return (
                                            <TooltipProvider key={dayIndex}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={(e) => handleDayClick(day, isTradeDay, monthData.month, e)}
                                                            className={cn(
                                                                "h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-[10px] sm:text-xs rounded-full transition-colors relative",
                                                                !isCurrentMonth && "text-muted-foreground/30",
                                                                isToday(day) && "border border-primary/50",
                                                                isInRange && !isTradeDay && isCurrentMonth && "bg-muted/30",
                                                                isTradeDay && isCurrentMonth && isActive && "hover:bg-primary/20 cursor-pointer",
                                                                isTradeDay && isInRange && isCurrentMonth && "bg-primary/10 hover:bg-primary/30",
                                                                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                                                isTradeDay && isSelected && "ring-1 sm:ring-2 ring-primary ring-offset-1", // Add a ring for selected trade days
                                                            )}
                                                            data-day="true"
                                                        >
                                                            {format(day, "d")}
                                                            {isTradeDay && isCurrentMonth && (
                                                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5">
                                                                    {buys > 0 && sells > 0 ? (
                                                                        // Show split dot for days with both buys and sells
                                                                        <div className="flex">
                                                                            <div
                                                                                className={`${dotSize} rounded-l-full bg-green-500`}
                                                                                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                                                            ></div>
                                                                            <div
                                                                                className={`${dotSize} rounded-r-full bg-red-500`}
                                                                                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                                            ></div>
                                                                        </div>
                                                                    ) : buys > 0 ? (
                                                                        // Green dot for buy-only days
                                                                        <div className={`${dotSize} rounded-full bg-green-500`}></div>
                                                                    ) : (
                                                                        // Red dot for sell-only days
                                                                        <div className={`${dotSize} rounded-full bg-red-500`}></div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="text-xs p-2 bg-popover text-popover-foreground border border-border gap-2 shadow-md rounded-lg max-w-[200px]"
                                                    >
                                                        <div className="font-medium text-foreground">{format(day, "EEEE, dd MMM yyyy")}</div>
                                                        {isTradeDay && isCurrentMonth && (
                                                            <div className="mt-1 space-y-1">
                                                                <div className="font-medium text-primary">
                                                                    {tradeCount} {tradeCount === 1 ? "trade" : "trades"}
                                                                </div>
                                                                {buys > 0 && (
                                                                    <div className="flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                                                        <span className="text-green-600">
                                                                            {buys} {buys === 1 ? "buy" : "buys"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {sells > 0 && (
                                                                    <div className="flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                                                        <span className="text-red-600">
                                                                            {sells} {sells === 1 ? "sell" : "sells"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="text-muted-foreground/90 italic text-[10px]">
                                                                    {isSelected ? "Click again to clear filter" : "Click to filter"}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!isCurrentMonth && (
                                                            <div className="mt-1 text-muted-foreground/80 text-[10px]">
                                                                This day belongs to {format(day, "MMMM")}
                                                            </div>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {/* Small right padding */}
                    <div className="flex-shrink-0 w-2"></div>
                </div>
            </div>
        </div>
    )
}
