import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, FileX } from "lucide-react"
import { useState } from "react"
import DecryptedText from "@/components/ui/DecryptedText"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
interface LedgerEntry {
    TITAL: string
    COCD: string
    AMOUNT: string
}

interface GroupedTotal {
    cocd: string
    total: number
}

interface LedgerDataDisplayProps {
    error: string | null
    loading: boolean
    ledgerMrgCollAmount: number
    filteredDataWithLedgerMrgColl: LedgerEntry[]
    groupedTotals: GroupedTotal[]
    data: LedgerEntry[]
}

export function LedgerDataDisplay({
    error,
    loading,
    ledgerMrgCollAmount,
    filteredDataWithLedgerMrgColl,
    groupedTotals,
    data,
}: LedgerDataDisplayProps) {
    const [isLedgerExpanded, setIsLedgerExpanded] = useState(false)

    const handleLedgerToggle = () => {
        setIsLedgerExpanded((prev) => !prev)
    }

    const ledgerRows = filteredDataWithLedgerMrgColl.filter((row) => row.TITAL === "Ledger")
    const nonLedgerRows = filteredDataWithLedgerMrgColl
        .map((row) => {
            if (row.TITAL === "Ledger+Mrg+Coll") {
                // Calculate sum of AMOUNT for rows where TITAL starts with "DP Ledger-"
                const dpLedgerAmount = filteredDataWithLedgerMrgColl
                    .filter((item) => typeof item.TITAL === "string" && item.TITAL.startsWith("DP Ledger-"))
                    .reduce((sum, item) => sum + Number.parseFloat(item.AMOUNT || "0"), 0);
                return { ...row, AMOUNT: (Number.parseFloat(row.AMOUNT || "0") + dpLedgerAmount).toString() };
            }
            return row;
        })
        .filter((row) => row.TITAL !== "Ledger" && row.TITAL !== "Net" && row.TITAL !== "Total Ledger");

    const ledgerTotal = ledgerRows.reduce((total, row) => total + Number.parseFloat(row.AMOUNT || "0"), 0)

    const calculateCollateralTotal = (rows: LedgerEntry[]) => {
        return rows
            .filter((row) => row.TITAL === "COLLETRAL")
            .reduce((total, row) => total + Number.parseFloat(row.AMOUNT || "0"), 0)
    }

    const collateralTotal = calculateCollateralTotal(nonLedgerRows)

    if (error) {
        return <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
            <div className="rounded-full bg-muted p-3 mb-4">
                <FileX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Data found</h3>
            <p className="text-muted-foreground mb-4 max-w-md">There are no Ledger records available.</p>
        </div>
    }

    return (
        <Card className="border-hidden shadow-none mt-0">
            <CardContent className="p-1">
                {error && <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                    <div className="rounded-full bg-muted p-3 mb-4">
                        <FileX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Data found</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">There are no Ledger records available.</p>
                </div>}

                {loading ? (
                    <Skeleton className="h-8 w-full" />
                ) : (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 m-1 text-center sm:text-left">
                        <span className="font-[400] text-sm sm:text-base">Total Available Funds as of previous day:</span>
                        <span className={`font-semibold text-sm sm:text-base ${ledgerMrgCollAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <DecryptedText
                                animateOn="view"
                                revealDirection="center"
                                characters="123456789"
                                text={new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                }).format(ledgerMrgCollAmount)}
                            />
                        </span>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="border rounded-md">
                        <div className="flex justify-between p-4 font-semibold border-b">
                            <span>Type</span>
                            <span>Total Amount</span>
                        </div>

                        {loading ? (
                            [...Array(7)].map((_, index) => (
                                <div key={index} className="flex justify-between items-center p-3">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="flex justify-between items-center p-3">
                                    <div className="flex items-center gap-2">
                                        <span>Ledger</span>
                                        <Button name="expand" variant="ghost" size="sm" onClick={handleLedgerToggle}>
                                            {isLedgerExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                        </Button>
                                    </div>
                                    <div className={`${ledgerTotal >= 0 ? "" : "text-red-500"}`}>
                                        <span className="mr-1">
                                            {new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                                maximumFractionDigits: 2,
                                            }).format(ledgerTotal)}
                                        </span>

                                    </div>
                                </div>

                                {isLedgerExpanded && (
                                    <div className="pl-4 space-y-2 m-2">
                                        {ledgerRows.map((row, index) => (
                                            <div key={index} className="flex justify-between items-center p-3">
                                                <span className="text-sm ">{row.COCD}</span>
                                                <span className={`text-sm  ${Number.parseFloat(row.AMOUNT || "0") >= 0 ? "" : "text-red-500"}`}>
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(Number.parseFloat(row.AMOUNT))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {nonLedgerRows?.map((row, index) => {
                                    const matchingGroup = groupedTotals?.find((group) => group.cocd === row.TITAL)
                                    const isLastOccurrence =
                                        matchingGroup && data.findIndex((r, idx) => r.TITAL === matchingGroup.cocd && idx > index) === -1

                                    const isLedgerMrgColl = row.TITAL === "Ledger+Mrg+Coll"
                                    const isCollateral = row.TITAL === "COLLETRAL"

                                    if (isCollateral && index > 0 && nonLedgerRows[index - 1].TITAL === "COLLETRAL") {
                                        return null // Skip rendering for subsequent COLLETRAL rows
                                    }
                                    if (row.AMOUNT === ".00" || row.AMOUNT === null) {
                                        return null
                                    }

                                    return (
                                        <div key={index} className="border-t">
                                            <div className="flex flex-wrap gap-4 justify-between items-center p-3">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="cursor-pointer hover:underline">
                                                            <span
                                                                className="text-md truncate inline-block max-w-[150px] sm:max-w-[300px] overflow-hidden text-ellipsis"
                                                            >
                                                                {row.TITAL === "COLLETRAL" ? "COLLATERAL" : row.TITAL}
                                                            </span>
                                                            {!isCollateral && <span className="text-xs truncate">{row.COCD}</span>}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto max-w-xs">
                                                        <p className="text-sm font-medium">{row.TITAL}</p>
                                                    </PopoverContent>
                                                </Popover>

                                                <span
                                                    className={`whitespace-nowrap ${isLedgerMrgColl ? `font-semibold ${collateralTotal >= 0 ? "text-green-600" : "text-red-600"}` : `${Number.parseFloat(row.AMOUNT) >= 0 ? "" : "text-red-600"}`}`}
                                                >
                                                    {isCollateral
                                                        ? new Intl.NumberFormat("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                            maximumFractionDigits: 2,
                                                        }).format(collateralTotal)
                                                        : new Intl.NumberFormat("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                            maximumFractionDigits: 2,
                                                        }).format(Number.parseFloat(row.AMOUNT))}
                                                </span>
                                            </div>
                                            {isLastOccurrence && matchingGroup && !isCollateral && (
                                                <div className="flex justify-end p-2 border-t">
                                                    <span className="font-semibold">
                                                        {new Intl.NumberFormat("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                            maximumFractionDigits: 2,
                                                        }).format(matchingGroup.total)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}

export default LedgerDataDisplay

