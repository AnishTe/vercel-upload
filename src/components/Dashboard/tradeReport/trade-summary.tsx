"use client"

import DecryptedText from "@/components/ui/DecryptedText"
import { format, differenceInDays, isToday, isYesterday } from "date-fns"
import { useMemo } from "react"
import { ArrowDown, ArrowUp, TrendingUp, BarChart3, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TradeSummaryProps {
    data: any[] | null
    fromDate: Date
    toDate: Date
}

export function TradeSummary({ data, fromDate, toDate }: TradeSummaryProps) {
    // Calculate total amount
    const amount = useMemo(() => {
        return data?.reduce((sum: number, item: any) => sum + (Number(Math.abs(item.AMOUNT)) || 0), 0).toFixed(2) || "0.00"
    }, [data])

    // Calculate buy and sell counts and amounts
    const {
        buyCount,
        sellCount,
        buyAmount,
        sellAmount,
        tradesByDate,
        maxTradesDay,
        maxTradesCount,
        avgTradeValue,
        topScripsByVolume,
        topScripsByValue,
    } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                buyCount: 0,
                sellCount: 0,
                buyAmount: 0,
                sellAmount: 0,
                tradesByDate: {},
                maxTradesDay: null,
                maxTradesCount: 0,
                avgTradeValue: 0,
                topScripsByVolume: [],
                topScripsByValue: [],
            }
        }

        const tradesByDate: Record<string, { count: number; buys: number; sells: number; amount: number }> = {}
        const scripVolume: Record<string, { count: number; volume: number; value: number }> = {}
        let totalBuyCount = 0
        let totalSellCount = 0
        let totalBuyAmount = 0
        let totalSellAmount = 0
        let totalAmount = 0

        data.forEach((item) => {
            // Process buy/sell counts and amounts
            const buyQuantity = Number(item.BUY_QUANTITY || 0)
            const sellQuantity = Number(item.SELL_QUANTITY || 0)
            const itemAmount = Number(Math.abs(item.AMOUNT)) || 0
            totalAmount += itemAmount

            if (buyQuantity > 0) {
                totalBuyCount++
                totalBuyAmount += itemAmount
            } else if (sellQuantity > 0) {
                totalSellCount++
                totalSellAmount += itemAmount
            }

            // Process trades by date
            const dateKey = item.TRADE_DATE
            if (!tradesByDate[dateKey]) {
                tradesByDate[dateKey] = { count: 0, buys: 0, sells: 0, amount: 0 }
            }
            tradesByDate[dateKey].count++
            tradesByDate[dateKey].amount += itemAmount

            if (buyQuantity > 0) {
                tradesByDate[dateKey].buys++
            } else if (sellQuantity > 0) {
                tradesByDate[dateKey].sells++
            }

            // Process scrip volume and value
            const scripName = item.SCRIP_NAME
            if (!scripVolume[scripName]) {
                scripVolume[scripName] = { count: 0, volume: 0, value: 0 }
            }
            scripVolume[scripName].count++
            scripVolume[scripName].volume += buyQuantity || sellQuantity
            scripVolume[scripName].value += itemAmount
        })

        // Find day with maximum trades
        let maxDay: string | null = null
        let maxCount = 0
        Object.entries(tradesByDate).forEach(([date, info]) => {
            if (info.count > maxCount) {
                maxDay = date
                maxCount = info.count
            }
        })

        // Calculate average trade value
        const avgValue = totalAmount / data.length

        // Get top scrips by volume and value
        const topByVolume = Object.entries(scripVolume)
            .sort((a, b) => b[1].volume - a[1].volume)
            .slice(0, 3)
            .map(([name, data]) => ({ name, ...data }))

        const topByValue = Object.entries(scripVolume)
            .sort((a, b) => b[1].value - a[1].value)
            .slice(0, 3)
            .map(([name, data]) => ({ name, ...data }))

        return {
            buyCount: totalBuyCount,
            sellCount: totalSellCount,
            buyAmount: totalBuyAmount,
            sellAmount: totalSellAmount,
            tradesByDate,
            maxTradesDay: maxDay,
            maxTradesCount: maxCount,
            avgTradeValue: avgValue,
            topScripsByVolume: topByVolume,
            topScripsByValue: topByValue,
        }
    }, [data])

    // Calculate date range info
    const dateRangeInfo = useMemo(() => {
        const days = differenceInDays(toDate, fromDate) + 1
        const activeDays = Object.keys(tradesByDate).length
        const activityRate = days > 0 ? (activeDays / days) * 100 : 0

        return {
            days,
            activeDays,
            activityRate,
            avgTradesPerDay: data && data.length > 0 ? (data.length / days).toFixed(1) : "0.0",
            avgTradesPerActiveDay: data && data.length > 0 && activeDays > 0 ? (data.length / activeDays).toFixed(1) : "0.0",
        }
    }, [data, fromDate, toDate, tradesByDate])

    // Calculate buy/sell ratio and percentages
    const tradeMetrics = useMemo(() => {
        const totalTrades = buyCount + sellCount
        const buyPercentage = totalTrades > 0 ? (buyCount / totalTrades) * 100 : 0
        const sellPercentage = totalTrades > 0 ? (sellCount / totalTrades) * 100 : 0

        const totalValue = buyAmount + sellAmount
        const buyValuePercentage = totalValue > 0 ? (buyAmount / totalValue) * 100 : 0
        const sellValuePercentage = totalValue > 0 ? (sellAmount / totalValue) * 100 : 0

        // Calculate average trade values
        const avgBuyValue = buyCount > 0 ? buyAmount / buyCount : 0
        const avgSellValue = sellCount > 0 ? sellAmount / sellCount : 0

        return {
            buyPercentage,
            sellPercentage,
            buyValuePercentage,
            sellValuePercentage,
            avgBuyValue,
            avgSellValue,
        }
    }, [buyCount, sellCount, buyAmount, sellAmount])

    if (!data || data.length === 0) return null

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        }).format(Math.abs(amount))
    }

    const formatMaxTradesDay = (dateStr: string | null) => {
        if (!dateStr) return "N/A"

        try {
            const date = new Date(dateStr)
            if (!isValid(date)) return dateStr

            if (isToday(date)) return "Today"
            if (isYesterday(date)) return "Yesterday"

            return format(date, "dd MMM")
        } catch (e) {
            return dateStr
        }
    }

    const isValid = (date: Date) => {
        return !isNaN(date.getTime())
    }

    return (
        <div className="space-y-4 border rounded-lg p-3 bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Trade Summary</h3>
                </div>
                <Badge variant="outline" className="bg-primary/10 flex items-center gap-1 text-xs py-1 px-2 w-fit">
                    <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">
                        {format(fromDate, "dd MMM yyyy")} - {format(toDate, "dd MMM yyyy")}
                    </span>
                    <span className="ml-1 text-muted-foreground whitespace-nowrap">({dateRangeInfo.days} days)</span>
                </Badge>
            </div>

            {/* Main metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Trades Card */}
                <div className="border rounded-lg p-3 sm:p-4 bg-background">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xl sm:text-2xl font-bold">{data.length}</div>
                            <div className="text-xs text-muted-foreground">Total Trades</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center text-xs sm:text-sm">
                                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                                <span className="text-green-600 font-medium">{buyCount} Buy</span>
                            </div>
                            <div className="flex items-center text-xs sm:text-sm">
                                <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mr-1" />
                                <span className="text-red-600 font-medium">{sellCount} Sell</span>
                            </div>
                        </div>
                    </div>

                    {/* Buy/Sell Trade Details */}
                    <div className="mt-3 flex justify-between gap-2 w-full">
                        {/* Buy Trades Details */}
                        <div className="bg-green-50 rounded-md p-2 flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center">
                                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                                    <span className="text-xs font-medium text-green-700">Buy Trades</span>
                                </div>
                                <span className="text-xs font-bold text-green-700">{buyCount}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-green-600">
                                <span>Avg. Value:</span>
                                <span className="font-medium">{formatCurrency(tradeMetrics.avgBuyValue)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-green-600">
                                <span>Total Value:</span>
                                <span className="font-medium">{formatCurrency(buyAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-green-600">
                                <span>% of Trades:</span>
                                <span className="font-medium">{tradeMetrics.buyPercentage.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Sell Trades Details */}
                        <div className="bg-red-50 rounded-md p-2 flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center">
                                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                                    <span className="text-xs font-medium text-red-700">Sell Trades</span>
                                </div>
                                <span className="text-xs font-bold text-red-700">{sellCount}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-red-600">
                                <span>Avg. Value:</span>
                                <span className="font-medium">{formatCurrency(tradeMetrics.avgSellValue)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-red-600">
                                <span>Total Value:</span>
                                <span className="font-medium">{formatCurrency(sellAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-red-600">
                                <span>% of Trades:</span>
                                <span className="font-medium">{tradeMetrics.sellPercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Amount Card */}
                <div className="border rounded-lg p-3 sm:p-4 bg-background">
                    <div className="flex items-center justify-between">
                        <div className="max-w-[70%]">
                            <div className="text-xl sm:text-2xl font-bold truncate">
                                <DecryptedText
                                    animateOn="view"
                                    revealDirection="center"
                                    characters="123456789"
                                    text={formatCurrency(amount)}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground">Total Value</div>
                        </div>
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary opacity-70 flex-shrink-0" />
                    </div>

                    <div className="mt-3">
                        <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                            <span>Buy/Sell Value</span>
                            <span className="font-medium truncate ml-1">
                                <DecryptedText
                                    animateOn="view"
                                    revealDirection="center"
                                    characters="123456789"
                                    text={formatCurrency(buyAmount)}
                                /> /
                                <DecryptedText
                                    animateOn="view"
                                    revealDirection="center"
                                    characters="123456789"
                                    text={formatCurrency(sellAmount)}
                                />
                            </span>
                        </div>
                        <div className="flex w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${tradeMetrics.buyValuePercentage}%` }}></div>
                            <div className="bg-red-500 h-full" style={{ width: `${tradeMetrics.sellValuePercentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] sm:text-[10px] mt-1 text-muted-foreground">
                            <span>{tradeMetrics.buyValuePercentage.toFixed(0)}% Buy</span>
                            <span>{tradeMetrics.sellValuePercentage.toFixed(0)}% Sell</span>
                        </div>
                    </div>
                </div>

                {/* Trade Insights Card */}
                <div className="border rounded-lg p-3 sm:p-4 bg-background sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xl sm:text-2xl font-bold">
                                {dateRangeInfo.activeDays} / {dateRangeInfo.days}
                            </div>
                            <div className="text-xs text-muted-foreground">Active Trading Days</div>
                        </div>
                    </div>

                    {/* Top Scrips */}
                    <div className="mt-3">
                        <div className="text-xs font-medium mb-2">Top Traded Scrips</div>
                        <div className="space-y-2">
                            {topScripsByValue.slice(0, 2).map((scrip, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between text-[10px] sm:text-xs p-2 bg-muted/30 rounded-md"
                                >
                                    <div className="flex items-center max-w-[60%]">
                                        <Badge
                                            variant="outline"
                                            className="h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center mr-1 sm:mr-2 bg-primary/10 flex-shrink-0"
                                        >
                                            {index + 1}
                                        </Badge>
                                        <span className="font-medium truncate">{scrip.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-muted-foreground mr-1 whitespace-nowrap">{scrip.count} trades</span>
                                        <span className="font-medium truncate">{
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={formatCurrency(scrip.value)}
                                            />
                                        }</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
