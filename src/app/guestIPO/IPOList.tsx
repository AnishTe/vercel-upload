"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ipoDetails } from "@/api/auth"
import { useIPO } from "@/contexts/IPOContext"
import { AlertCircle, ArrowUpDown, CalendarDays, Package } from "lucide-react"
import { toast } from "sonner"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface IPOData {
    ipoid: string
    companyname: string
    category: string
    companysymbol: string
    companylogoex: string
    minpricerange: string
    maxpricerange: string
    issuesize: string
    maxlotsize: string
    applicationformdatestart: string
    applicationformdateend: string
    isin: string
}

interface IPOListProps {
    ipolisttype: "ongoing" | "upcoming" | "closed" | "all"
    noDataMessage: string
}

interface CategoryData {
    category: string
    ipoid: string
}

interface GroupedIPO {
    isin: string
    companyname: string
    companysymbol: string
    companylogoex: string
    minpricerange: string
    maxpricerange: string
    issuesize: string
    maxlotsize: string
    applicationformdatestart: string
    applicationformdateend: string
    categories: CategoryData[]
    selectedCategory: string
}

export default function IPOList({ ipolisttype, noDataMessage }: IPOListProps) {
    const [loading, setLoading] = useState(true)
    const [groupedIpoData, setGroupedIpoData] = useState<GroupedIPO[]>([])
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { setSelectedIPO } = useIPO()
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortBy, setSortBy] = useState<string>("default")
    const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({})
    const [filteredIpoData, setFilteredIpoData] = useState<GroupedIPO[]>([])

    useEffect(() => {
        const fetchIpoData = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await ipoDetails({
                    ipolisttype,
                })
                if (response?.data?.data) {
                    const groupedData = groupIpoData(response.data.data)
                    setGroupedIpoData(groupedData)
                    setFilteredIpoData(groupedData)

                    // Initialize all IPOs with "details" tab active
                    const initialTabs = {}
                    groupedData.forEach((ipo) => {
                        initialTabs[ipo.isin] = "details"
                    })
                    setActiveTab(initialTabs)
                } else {
                    setGroupedIpoData([])
                    setFilteredIpoData([])
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred while fetching IPO data.")
            } finally {
                setLoading(false)
            }
        }

        fetchIpoData()
    }, [ipolisttype])

    // Apply filters and sorting whenever the base data or filter/sort criteria change
    useEffect(() => {
        let result = [...groupedIpoData]

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(
                (ipo) => ipo.companyname.toLowerCase().includes(term) || ipo.companysymbol.toLowerCase().includes(term),
            )
        }

        // Apply sorting
        if (sortBy === "priceAsc") {
            result.sort((a, b) => Number.parseFloat(a.minpricerange) - Number.parseFloat(b.minpricerange))
        } else if (sortBy === "priceDesc") {
            result.sort((a, b) => Number.parseFloat(b.minpricerange) - Number.parseFloat(a.minpricerange))
        } else if (sortBy === "nameAsc") {
            result.sort((a, b) => a.companyname.localeCompare(b.companyname))
        } else if (sortBy === "nameDesc") {
            result.sort((a, b) => b.companyname.localeCompare(a.companyname))
        } else if (sortBy === "dateAsc") {
            result.sort(
                (a, b) => new Date(a.applicationformdatestart).getTime() - new Date(b.applicationformdatestart).getTime(),
            )
        } else if (sortBy === "dateDesc") {
            result.sort(
                (a, b) => new Date(b.applicationformdatestart).getTime() - new Date(a.applicationformdatestart).getTime(),
            )
        } else if (sortBy === "sizeDesc") {
            result.sort((a, b) => Number.parseFloat(b.issuesize) - Number.parseFloat(a.issuesize))
        }

        setFilteredIpoData(result)
    }, [groupedIpoData, sortBy, searchTerm])

    const groupIpoData = (data: IPOData[]): GroupedIPO[] => {
        const groupedData: { [key: string]: GroupedIPO } = {};

        data.forEach((ipo) => {
            if (!groupedData[ipo.isin]) {
                groupedData[ipo.isin] = {
                    ...ipo,
                    categories: [{ category: ipo.category, ipoid: ipo.ipoid }],
                    selectedCategory: "INDIVIDUAL", // Default to INDIVIDUAL initially
                };
            } else {
                if (!groupedData[ipo.isin].categories.some((c) => c.category === ipo.category)) {
                    groupedData[ipo.isin].categories.push({ category: ipo.category, ipoid: ipo.ipoid });
                }
            }
        });

        // ✅ Ensure "INDIVIDUAL" is selected if available, otherwise choose the first category
        Object.values(groupedData).forEach((ipo) => {
            const individualCategory = ipo.categories.find((c) => c.category === "INDIVIDUAL");
            ipo.selectedCategory = individualCategory ? "INDIVIDUAL" : ipo.categories[0]?.category;
        });

        return Object.values(groupedData);
    };

    const handleApplyIPO = (isin: string) => {
        const selectedIpoData = groupedIpoData.find((ipo) => ipo.isin === isin)
        if (selectedIpoData) {
            const selectedCategoryData = selectedIpoData.categories.find(
                (c) => c.category === selectedIpoData.selectedCategory,
            )
            if (selectedCategoryData) {
                setSelectedIPO({
                    ...selectedIpoData,
                    ipoid: selectedCategoryData.ipoid,
                    category: selectedCategoryData.category,
                })
                router.push(getCompatibleUrl(`/guestIPO/applyIPO?ipoId=${selectedCategoryData.ipoid}`))

            } else {
                toast.error("Invalid IPO category selected :( Please try again.")
            }
        }
    }

    const handleCategorySelect = (isin: string, category: string) => {
        setGroupedIpoData((prevData) =>
            prevData.map((ipo) => (ipo.isin === isin ? { ...ipo, selectedCategory: category } : ipo)),
        )
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
            </div>
        )
    }

    const calculateInvestments = (bidPrice, lotSize, maxLotSize, noOfEquitySharesBid, cutOffPrice) => {
        const minInvestment = noOfEquitySharesBid ? noOfEquitySharesBid * 1 * cutOffPrice : bidPrice * lotSize
        const maxInvestmentValue = bidPrice * lotSize * maxLotSize

        const formattedMinInvestment = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number.parseFloat(minInvestment.toString()))

        return { minInvestment: formattedMinInvestment, maxInvestment: maxInvestmentValue }
    }

    const handleTabChange = (isin: string, tab: string) => {
        setActiveTab((prev) => ({
            ...prev,
            [isin]: tab,
        }))
    }

    const getTimeRemaining = (endDate) => {
        const now = new Date()
        const end = new Date(endDate)
        const diff = end.getTime() - now.getTime()

        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isExpired: true }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        return { days, hours, minutes, isExpired: false }
    }

    const getSubscriptionStatus = (startDate, endDate) => {
        const now = new Date()
        const start = new Date(startDate)
        const end = new Date(endDate)

        if (now < start) return "Not Started"
        if (now > end) return "Closed"

        // Calculate percentage of time elapsed
        const totalDuration = end.getTime() - start.getTime()
        const elapsed = now.getTime() - start.getTime()
        const percentComplete = Math.min(100, Math.round((elapsed / totalDuration) * 100))

        return { status: "Open", percentComplete }
    }

    const formatDateTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString)
            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })
        } catch (error) {
            return dateTimeString
        }
    }

    return (
        <div className="space-y-4">
            {!loading && (
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search by company name or symbol"
                            className="w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* <Select value={filterExchange} onValueChange={setFilterExchange}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Exchange" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Exchanges</SelectItem>
                                {uniqueExchanges.map((exchange) => (
                                    <SelectItem key={exchange} value={exchange}>
                                        {exchange}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select> */}

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[140px]">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                                <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                                <SelectItem value="priceAsc">Price (Low-High)</SelectItem>
                                <SelectItem value="priceDesc">Price (High-Low)</SelectItem>
                                <SelectItem value="dateAsc">Date (Earliest)</SelectItem>
                                <SelectItem value="dateDesc">Date (Latest)</SelectItem>
                                <SelectItem value="sizeDesc">Issue Size (Largest)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {!loading && filteredIpoData.length === 0 ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                    <Package className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No IPOs Found</h3>
                    <p className="text-muted-foreground">{noDataMessage}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {(loading ? Array.from({ length: 6 }) : filteredIpoData).map((ipo: any, index) => {
                        const { minInvestment, maxInvestment } = loading
                            ? { minInvestment: null, maxInvestment: null }
                            : calculateInvestments(
                                Number.parseFloat(ipo.minpricerange),
                                Number.parseFloat(ipo.maxlotsize),
                                Number.parseFloat(ipo.issuesize),
                                Number.parseFloat(ipo.noofequitysharesbid),
                                Number.parseFloat(ipo.cutoffprice),
                            )

                        const timeRemaining =
                            !loading && ipolisttype === "ongoing" ? getTimeRemaining(ipo.applicationformdateend) : null

                        const subscriptionStatus = !loading
                            ? getSubscriptionStatus(ipo.applicationformdatestart, ipo.applicationformdateend)
                            : null

                        return (
                            <motion.div
                                key={ipo?.isin || index}
                                className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                {!loading && ipolisttype === "ongoing" && (
                                    <div className="w-full bg-muted">
                                        {typeof subscriptionStatus === "object" && (
                                            <Progress value={subscriptionStatus?.percentComplete} className="h-1 rounded-none" />
                                        )}
                                    </div>
                                )}

                                {/* Header with blue background matching the screenshot */}
                                <div className="bg-blue-500 p-3 text-white">
                                    {loading ? (
                                        <Skeleton className="h-6 w-3/4 bg-blue-400" />
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <Image
                                                src="/images/ipoImg.jpg"
                                                alt={`${ipo.companyname} logo`}
                                                width={40}
                                                height={40}
                                                className="rounded-[20%] object-contain"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm sm:text-base">{ipo.companyname}</h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Badge className="bg-white text-blue-600 hover:bg-blue-100">{ipo.companysymbol}</Badge>
                                                    <Badge className="bg-white text-blue-600 hover:bg-blue-100">{ipo.companylogoex}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tab buttons for Details and Categories */}
                                {!loading && (
                                    <div className="grid grid-cols-2">
                                        <button
                                            className={`py-2 text-center text-sm font-medium transition-all duration-300 ${activeTab[ipo.isin] === "details"
                                                ? "border-b-2 border-green-500 text-green-600"
                                                : "text-muted-foreground"
                                                }`}
                                            onClick={() => handleTabChange(ipo.isin, "details")}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className={`py-2 text-center text-sm font-medium transition-all duration-300 ${activeTab[ipo.isin] === "categories"
                                                ? "border-b-2 border-green-500 text-green-600"
                                                : "text-muted-foreground"
                                                }`}
                                            onClick={() => handleTabChange(ipo.isin, "categories")}
                                        >
                                            Categories
                                        </button>
                                    </div>
                                )}

                                <div className="p-3">
                                    {loading ? (
                                        <>
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-4 w-3/4 mb-2" />
                                            <Skeleton className="h-4 w-1/2 mb-2" />
                                            <Skeleton className="h-4 w-full mb-2" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Details Tab Content */}
                                            {activeTab[ipo.isin] === "details" && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                                                    {/* Selected Category Display */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-muted-foreground">Selected Category:</span>
                                                        <span className="font-semibold text-sm">{ipo.selectedCategory}</span>
                                                    </div>

                                                    {/* IPO Details Grid - More compact layout */}
                                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                                        <div className="flex items-center">
                                                            <span className="text-muted-foreground">₹ Price Range</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold">
                                                                ₹{ipo.minpricerange || "-"} - ₹{ipo.maxpricerange || "-"}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <span className="text-muted-foreground">↗ Issue Size</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold">{ipo.issuesize || "-"} CR</span>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <span className="text-muted-foreground">⊕ Lot Size</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold">{ipo.maxlotsize || "-"}</span>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <span className="text-muted-foreground">₹ Min Investment</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-semibold">{minInvestment?.replace("₹", "₹") || "-"}</span>
                                                        </div>
                                                    </div>

                                                    {/* Date Information - More compact */}
                                                    <div className="mt-2 pt-2 border-t text-sm">
                                                        <div className="flex items-center mb-1">
                                                            <span className="text-muted-foreground">📅 Period:</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-muted-foreground">Start:</span>
                                                                <span className="font-medium">{formatDateTime(ipo.applicationformdatestart)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-muted-foreground">End:</span>
                                                                <span className="font-medium">{formatDateTime(ipo.applicationformdateend)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Categories Tab Content */}
                                            {activeTab[ipo.isin] === "categories" && (
                                                <motion.div
                                                    className="space-y-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <p className="text-sm text-muted-foreground mb-2">Select a category to apply for this IPO:</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {ipo.categories.map((categoryData) => (
                                                            <Button
                                                                key={categoryData.category}
                                                                variant={ipo.selectedCategory === categoryData.category ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => handleCategorySelect(ipo.isin, categoryData.category)}
                                                                className="w-full justify-center text-xs h-8 transition-all duration-300"
                                                            >
                                                                {categoryData.category}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    <div className="bg-muted p-2 rounded text-xs">
                                                        <p className="font-medium mb-1">Category Information:</p>
                                                        <p className="text-muted-foreground">
                                                            {ipo.selectedCategory === "INDIVIDUAL"
                                                                ? "For individual investors applying in their personal capacity."
                                                                : ipo.selectedCategory === "HNI"
                                                                    ? "For High Net Worth Individuals applying for larger allocations."
                                                                    : `Category: ${ipo.selectedCategory}`}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="mt-3 pt-2 border-t">
                                                {
                                                    ipolisttype === "ongoing" &&
                                                    <div className="flex items-center justify-between gap-3">
                                                        <Button className="w-full" onClick={() => handleApplyIPO(ipo.isin)}>
                                                            {"Apply Now"}
                                                        </Button>
                                                    </div>
                                                }
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

