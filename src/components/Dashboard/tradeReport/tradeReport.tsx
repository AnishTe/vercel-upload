/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { useEffect, useState, useCallback, useRef } from "react"
import DashboardLayout from "../dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DataTableSkeleton from "@/components/DataTable-Skeleton"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

import { FileX, RefreshCw, AlertCircle } from "lucide-react"
import { getTradeDetails } from "@/api/auth"
import { columns } from "./columns"
import { useUser } from "@/contexts/UserContext"
import { useSearchParams } from "next/navigation"
import { parse, parseISO, isValid, isSameDay, format, startOfDay, endOfDay, subDays } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import our custom components
import { DateRangeSelector } from "./date-range-selector"
import { TradeSummary } from "./trade-summary"
import { TradeCalendar } from "./trade-calendar"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

export default function TradeReport() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<any[] | null>(null)
    const [filteredData, setFilteredData] = useState<any[] | null>(null)
    const [selectedSegment, setSelectedSegment] = useState<string>("")
    // Initialize with default dates for "WEEK" period
    const today = new Date()
    const [fromDate, setFromDate] = useState<Date>(startOfDay(subDays(today, 6)))
    const [toDate, setToDate] = useState<Date>(endOfDay(today))
    const [selectedPeriod, setSelectedPeriod] = useState<string>("WEEK")
    const [tradeDates, setTradeDates] = useState<Date[]>([])
    const [isCustomDate, setIsCustomDate] = useState(false)
    const [dataFetched, setDataFetched] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [filteringStatus, setFilteringStatus] = useState<string | null>(null)
    const [tableKey, setTableKey] = useState(0) // Key to force table re-render
    const [isInitialized, setIsInitialized] = useState(false)
    const [currentSearchCriteria, setCurrentSearchCriteria] = useState<string>("")

    // Ref to track if filtering has been applied
    const filterApplied = useRef(false)

    const { currentUser, userDetails } = useUser()
    const [paramsData, setParamsData] = useState<any>(userDetails || {})
    const [paramscurrentUser, setParamsCurrentUser] = useState<any>(currentUser || {})
    const searchParams = useSearchParams()

    const availableSegments = paramsData?.segments?.split(",")

    // Initialize date range based on selected period
    const initializeDateRange = useCallback((period: string) => {
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
            // For CUSTOM, we don't change the dates here
        }
    }, [])

    // Initialize date range on component mount
    useEffect(() => {
        if (!isInitialized) {
            initializeDateRange(selectedPeriod)
            setIsInitialized(true)
        }
    }, [selectedPeriod, initializeDateRange, isInitialized])

    // Update date range when period changes
    useEffect(() => {
        if (isInitialized && selectedPeriod !== "CUSTOM") {
            initializeDateRange(selectedPeriod)
        }
    }, [selectedPeriod, initializeDateRange, isInitialized])

    // Parse a date string using multiple formats
    const parseTradeDate = useCallback((dateStr: string): Date | null => {
        if (!dateStr) return null

        let parsedDate: Date | null = null

        try {
            // Try "DD MMM YYYY" format (e.g., "01 Jan 2023")
            parsedDate = parse(dateStr, "dd MMM yyyy", new Date())
            if (!isValid(parsedDate)) {
                // Try "DD-MM-YYYY" format (e.g., "01-01-2023")
                parsedDate = parse(dateStr, "dd-MM-yyyy", new Date())
            }
            if (!isValid(parsedDate)) {
                // Try "YYYY-MM-DD" format (e.g., "2023-01-01")
                parsedDate = parseISO(dateStr)
            }
        } catch (e) {
            console.error("Error parsing date:", dateStr, e)
            return null
        }

        return isValid(parsedDate) ? parsedDate : null
    }, [])

    // useEffect(() => {
    //     const searchParamsClientID = searchParams.get("clientId")
    //     const searchParamsBranchClientCheck = searchParams.get("branchClientCheck")

    //     if (searchParamsClientID && searchParamsBranchClientCheck) {
    //         const cookieValue = sessionStorage.getItem(`branchClientCheck_${searchParamsClientID}`)
    //         const cookiesData = cookieValue ? JSON.parse(cookieValue) : null
    //         setParamsCurrentUser(searchParamsClientID)
    //         setParamsData(cookiesData)
    //     } else {
    //         setParamsCurrentUser(currentUser)
    //         setParamsData(userDetails)
    //     }
    // }, [searchParams, userDetails, currentUser])

    useEffect(() => {
        const clientId = searchParams.get("clientId");
        const isBranchClientCheck = searchParams.get("branchClientCheck") === "true";
        const isfamilyClientCheck = searchParams.get("familyClientCheck") === "true";

        if (clientId && (isBranchClientCheck || isfamilyClientCheck)) {
            const key = isBranchClientCheck
                ? `branchClientCheck_${clientId}`
                : `familyClientCheck_${clientId}`;

            const storedValue = sessionStorage.getItem(key);
            const parsedData = storedValue ? JSON.parse(storedValue) : null;

            setParamsCurrentUser(clientId);
            setParamsData(parsedData);
        } else {
            setParamsCurrentUser(currentUser);
            setParamsData(userDetails);
        }
    }, [searchParams, userDetails, currentUser]);


    // Filter data when selected date changes
    useEffect(() => {
        if (!data) return

        setFilteringStatus("Filtering data...")
        filterApplied.current = true

        if (!selectedDate) {
            // console.log("No date selected, showing all data")
            setFilteredData(data)
            setFilteringStatus(null)
            setTableKey((prev) => prev + 1) // Force table re-render
            return
        }

        const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
        // console.log(`Filtering for date: ${format(selectedDate, "dd MMM yyyy")} (${selectedDateStr})`)

        // Sample the first few records to debug date formats
        if (data.length > 0) {
            // console.log("Sample trade date formats:")
            data.slice(0, 3).forEach((item, index) => {
                // console.log(`Record ${index}: TRADE_DATE = "${item.TRADE_DATE}"`)
                const parsed = parseTradeDate(item.TRADE_DATE)
                // console.log(`  Parsed as: ${parsed ? format(parsed, "yyyy-MM-dd") : "Invalid date"}`)
            })
        }

        const filtered = data.filter((item) => {
            const parsedDate = parseTradeDate(item.TRADE_DATE)
            if (!parsedDate) {
                // console.log(`Failed to parse date: ${item.TRADE_DATE}`)
                return false
            }

            const matches = isSameDay(parsedDate, selectedDate)
            if (matches) {
                // console.log(`Match found: ${item.TRADE_DATE} matches ${format(selectedDate, "dd MMM yyyy")}`)
            }
            return matches
        })

        // console.log(`Found ${filtered.length} trades for ${format(selectedDate, "dd MMM yyyy")}`)
        setFilteredData(filtered)
        setFilteringStatus(null)
        setTableKey((prev) => prev + 1) // Force table re-render
    }, [selectedDate, data, parseTradeDate])

    // Generate a unique search criteria identifier
    const generateSearchCriteriaId = useCallback((segment: string, from: Date, to: Date) => {
        return `${segment}_${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}`
    }, [])

    const handleSearch = async () => {
        if (!selectedSegment) return

        setLoading(true)
        setError(null)
        setSelectedDate(null) // Reset selected date when searching

        // Generate a unique identifier for this search criteria
        const searchCriteriaId = generateSearchCriteriaId(selectedSegment, fromDate, toDate)

        // If search criteria has changed, clear previous data
        if (searchCriteriaId !== currentSearchCriteria) {
            setData(null)
            setFilteredData(null)
            setTradeDates([])
            setDataFetched(false)
        }

        setCurrentSearchCriteria(searchCriteriaId)
        filterApplied.current = false

        try {
            const response = await getTradeDetails({
                clientId: paramscurrentUser,
                cocd: selectedSegment,
                fromDate: fromDate
                    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                    .replace(/\//g, "/"),
                toDate: toDate
                    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                    .replace(/\//g, "/"),
            })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            // Directly access the data array
            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                const description = parsedData["Success Description"]
                // console.log(`Received ${description.length} trade records`)

                // Log the first few records to see their structure
                if (description.length > 0) {
                    // console.log("Sample data structure:", description[0])
                }

                setData(description)
                setFilteredData(description) // Initialize filtered data with all data
                setDataFetched(true)
                setTableKey((prev) => prev + 1) // Force table re-render

                // Extract trade dates from the data
                const dates = description
                    .map((item: any) => {
                        const parsed = parseTradeDate(item.TRADE_DATE)
                        if (parsed) {
                            return parsed
                        }
                        return null
                    })
                    .filter(Boolean) as Date[]

                // console.log(`Extracted ${dates.length} unique trade dates`)
                setTradeDates(dates)
            } else if (parsedData.Success === "False" && parsedData["Error Description"]) {
                // Clear previous data when error occurs
                setData([])
                setFilteredData([])
                setTradeDates([])
                setDataFetched(true) // Still set dataFetched to true to show "No records found" message
                setError(parsedData["Error Description"])
            } else {
                // Clear previous data when error occurs
                setData([])
                setFilteredData([])
                setTradeDates([])
                setDataFetched(true) // Still set dataFetched to true to show "No records found" message
                throw new Error("Failed to fetch data.")
            }
        } catch (error: any) {
            // Clear previous data when error occurs
            setData([])
            setFilteredData([])
            setTradeDates([])
            setDataFetched(true) // Still set dataFetched to true to show "No records found" message

            // Check if it's a Java heap error (OutOfMemoryError)
            if (
                error.response?.status === 500 &&
                (error.response?.data?.includes("OutOfMemoryError") ||
                    error.response?.data?.includes("Java heap space") ||
                    error.message?.includes("OutOfMemoryError") ||
                    error.message?.includes("Java heap space"))
            ) {
                setError("Trade volume exceeds system limits for the selected range. Please download in smaller date intervals")
            } else {
                setError(error.message || "An error occurred while fetching data.")
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle date selection in calendar
    const handleDateSelect = (date: Date | null) => {
        // console.log("Date selected:", date ? format(date, "dd MMM yyyy") : "None")
        setSelectedDate(date)
    }

    // Reset filters
    const handleResetFilters = () => {
        setSelectedDate(null)
        setFilteredData(data)
        setTableKey((prev) => prev + 1) // Force table re-render
    }

    // Auto-search when segment changes or date range changes
    useEffect(() => {
        if (selectedSegment) {
            handleSearch()
        }
    }, [selectedSegment, fromDate, toDate])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle>Trade Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <DateRangeSelector
                                    selectedPeriod={selectedPeriod}
                                    setSelectedPeriod={setSelectedPeriod}
                                    fromDate={fromDate}
                                    setFromDate={setFromDate}
                                    toDate={toDate}
                                    setToDate={setToDate}
                                    isCustomDate={isCustomDate}
                                    setIsCustomDate={setIsCustomDate}
                                    availableSegments={availableSegments}
                                    selectedSegment={selectedSegment}
                                    setSelectedSegment={setSelectedSegment}
                                    onSearch={handleSearch}
                                />

                                {dataFetched && data && data.length > 0 && (
                                    <>
                                        <TradeSummary data={filteredData} fromDate={fromDate} toDate={toDate} />

                                        {tradeDates.length > 0 && (
                                            <TradeCalendar
                                                tradeDates={tradeDates}
                                                fromDate={fromDate}
                                                toDate={toDate}
                                                selectedPeriod={selectedPeriod}
                                                selectedDate={selectedDate}
                                                onSelectDate={handleDateSelect}
                                                tradeData={data}
                                            />
                                        )}
                                    </>
                                )}

                                {filteringStatus && (
                                    <Alert variant="default" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{filteringStatus}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Only show error if we have data but encountered an error */}
                                {error && filteredData !== null && filteredData.length > 0 && (
                                    <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
                                )}

                                {loading ? (
                                    <DataTableSkeleton columns={5} rows={10} />
                                ) : (
                                    <>
                                        {!dataFetched ? (
                                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                                <p className="text-muted-foreground">Select a segment and date range to view trade data</p>
                                            </div>
                                        ) : filteredData === null || filteredData.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                                <div className="rounded-full bg-muted p-3 mb-4">
                                                    <FileX className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-medium mb-2">No records found</h3>
                                                <p className="text-muted-foreground mb-4 max-w-md">
                                                    {selectedDate
                                                        ? `No trades found for ${format(selectedDate, "dd MMM yyyy")}.`
                                                        : error
                                                            ? <span className="text-red-500">{error}</span>  // Show the error message in the no records found section
                                                            : "There are no records available for this criteria."}
                                                </p>
                                                {selectedDate && data && data.length > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleResetFilters}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        Show All Trades
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-primary/10 p-3 rounded-md text-sm flex justify-between items-center">
                                                    <div>
                                                        {selectedDate ? (
                                                            <>
                                                                <span className="font-medium">Filtered:</span> Showing trades for{" "}
                                                                <span className="font-medium">{format(selectedDate, "dd MMM yyyy")}</span>
                                                                <span className="ml-2 text-muted-foreground">
                                                                    ({filteredData.length} of {data?.length} trades)
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium">Showing:</span> All trades from{" "}
                                                                <span className="font-medium">{format(fromDate, "dd MMM yyyy")}</span> to{" "}
                                                                <span className="font-medium">{format(toDate, "dd MMM yyyy")}</span>
                                                                <span className="ml-2 text-muted-foreground">({filteredData?.length || 0} trades)</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {selectedDate && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleResetFilters}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                            Show All
                                                        </Button>
                                                    )}
                                                </div>

                                                <DataTableArray
                                                    key={tableKey} // Force re-render when key changes
                                                    columns={columns}
                                                    data={filteredData || []}
                                                    showPagination={true}
                                                // columnsWithTotals={["AMOUNT"]}
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}
