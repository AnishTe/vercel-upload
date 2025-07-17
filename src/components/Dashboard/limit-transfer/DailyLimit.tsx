import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import DecryptedText from "@/components/ui/DecryptedText"

interface LedgerDataDisplayProps {
    error: string | null
    loading: boolean
    data: { [key: string]: any }
}

export function DailyLimit({
    error,
    loading,
    data,
}: LedgerDataDisplayProps) {
    const [isLimitCashExpanded, setIsLimitCashExpanded] = useState(false)
    const [isLimitMCXExpanded, setIsLimitMCXExpanded] = useState(false)
    const [isLimitCDExpanded, setIsLimitCDExpanded] = useState(false)

    useEffect(() => {
        if (!loading && !error && data) {
            const limitValue = (Number(data.cashCC || 0) + Number(data.cashLedger || 0));
            sessionStorage.setItem('limit', (limitValue * 2).toString());
        }
    }, [loading, error, data]);

    const handleLimitCashToggle = () => {
        setIsLimitCashExpanded((prev) => !prev)
    }

    const handleLimitMCXToggle = () => {
        setIsLimitMCXExpanded((prev) => !prev)
    }

    const handleLimitCDToggle = () => {
        setIsLimitCDExpanded((prev) => !prev)
    }

    const limitCashRows = Object.entries(data || {})
        .filter(([key, value]) => (key.endsWith('Ledger') || key.endsWith('Collateral')) && Number(value) !== 0)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const limitCashTotal = Object.values(limitCashRows || {})
        .reduce((total: number, value) => total + Number(value), 0);

    const limitMCXRows = Object.entries(data || {})
        .filter(([key]) => key.includes('mcxLedger') || key.includes('mcxCollateral'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const limitMCXTotal = Object.values(limitMCXRows || {})
        .reduce((total: number, value) => total + Number(value), 0);

    const limitCDRows = Object.entries(data || {})
        .filter(([key]) => key.includes('cdLedger') || key.includes('cdCollateral'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const limitCDTotal = Object.values(limitCDRows || {})
        .reduce((total: number, value) => total + Number(value), 0);

    const rows: { [key: string]: number } = Object.entries(data || {})
        .filter(([key]) => key.endsWith('LedgerInput') || key.endsWith('CC') || key.endsWith('NCC'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: Number(value) }), {});

    return (
        <Card className="border-hidden shadow-none mt-0">
            <CardContent className="space-y-4 ">
                {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}

                {/* {loading ? (
                    <Skeleton className="h-8 w-full" />
                ) : (
                    <div className="flex justify-center items-center gap-6 m-2">
                        <span className="font-[400]">Limit as on:</span>
                        <span className={`font-semibold `}>
                            {new Date(data.lastUpdatedTime).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true
                            })}
                        </span>
                    </div>
                )} */}

                {/* collateral consideration for above limit calculation */}
                <div className="space-y-4">
                    <div className="border rounded-md">
                        {loading ? (
                            [...Array(7)].map((_, index) => (
                                <div key={index} className="flex justify-between items-center p-3">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            ))
                        ) : (
                            <div>
                                <h3 className="text-sm lg:text-lg font-semibold p-3 pb-1">Considerations for Limit calculation: </h3>
                                {(() => {
                                    const filteredKeys = Object.keys(rows).filter(
                                        key =>
                                            key !== 'clientId' &&
                                            key !== 'createdTime' &&
                                            key !== 'lastUpdatedTime' &&
                                            Number(rows[key]) !== 0
                                    );

                                    // If no visible values, show cashLedgerInput
                                    if (filteredKeys.length === 0 && rows.cashLedgerInput !== undefined) {
                                        return (
                                            <div className="flex flex-wrap gap-2 justify-between items-center p-3">
                                                <span className="text-sm sm:text-base break-words max-w-[70%]">
                                                    Ledger Input <span className="text-xs sm:text-sm">(EQ + FO)</span>
                                                </span>
                                                <span className="text-sm sm:text-base whitespace-nowrap">
                                                    {new Intl.NumberFormat('en-IN', {
                                                        style: 'currency',
                                                        currency: 'INR',
                                                        maximumFractionDigits: 2,
                                                    }).format(rows.cashLedgerInput)}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Default render when there are values
                                    return filteredKeys.map((rowKey, index) => {
                                        // Find previous visible index (non-zero value)
                                        const prevVisibleIndex = filteredKeys.findIndex((_, i) => i < index && Number(rows[filteredKeys[i]]) !== 0);

                                        return (
                                            <div key={index} className={`flex flex-wrap gap-2 justify-between items-center p-3 ${prevVisibleIndex === -1 ? '' : 'border-t'}`}>
                                                <span className="text-sm sm:text-base break-words max-w-[70%]">
                                                    {rowKey.endsWith('NCC') ? (
                                                        <>
                                                            Non Cash Collateral <span className="text-xs sm:text-sm">({rowKey.includes('cash') ? 'EQ + FO' : rowKey.includes('mcx') ? 'MCX' : rowKey.includes('cds') ? 'CDS' : rowKey.includes('fo') ? 'FO' : ''})</span>
                                                        </>
                                                    ) : rowKey.endsWith('CC') ? (
                                                        <>
                                                            Cash Collateral <span className="text-xs sm:text-sm">({rowKey.includes('cash') ? 'EQ + FO' : rowKey.includes('mcx') ? 'MCX' : rowKey.includes('cds') ? 'CDS' : rowKey.includes('fo') ? 'FO' : ''})</span>
                                                        </>
                                                    ) : rowKey.endsWith('LedgerInput') ? (
                                                        <>
                                                            Ledger Input <span className="text-xs sm:text-sm">({rowKey.includes('cash') ? 'EQ + FO' : rowKey.includes('mcx') ? 'MCX' : rowKey.includes('cds') ? 'CDS' : rowKey.includes('fo') ? 'FO' : rowKey.includes('mtf') ? 'MTF' : ''})</span>
                                                        </>
                                                    ) : rowKey}
                                                </span>
                                                <span className="text-sm sm:text-base whitespace-nowrap">
                                                    {new Intl.NumberFormat('en-IN', {
                                                        style: 'currency',
                                                        currency: 'INR',
                                                        maximumFractionDigits: 2,
                                                    }).format(rows[rowKey])}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}

                            </div>
                        )}

                    </div>
                </div>
                <div className="space-y-4">
                    <div className="border rounded-md">

                        {loading ? (
                            [...Array(7)].map((_, index) => (
                                <div key={index} className="flex justify-between items-center p-3">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 justify-between items-center p-3 border-b">
                                    <h3 className="text-sm lg:text-lg font-semibold">Total Assigned Limit: </h3>
                                    <span className={`font-semibold text-sm sm:text-base `}>
                                        <DecryptedText
                                            animateOn="view"
                                            revealDirection="center"
                                            characters="123456789"
                                            text={new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                                maximumFractionDigits: 2,
                                                minimumFractionDigits: 2,
                                            }).format(data?.utradeLimit + data?.mtfLedgerOutput + limitCashTotal + limitMCXTotal + limitCDTotal)}
                                        />
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-between items-center p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm sm:text-base">Limit (EQ + FO)</span>
                                        <Button variant="ghost" size="sm" onClick={handleLimitCashToggle}>
                                            {isLimitCashExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                        </Button>
                                    </div>
                                    <div className={`flex items-center ${limitCashTotal >= 0 ? "" : "text-red-500"}`}>
                                        <span className="mr-1 text-sm sm:text-base whitespace-nowrap">
                                            {new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                                maximumFractionDigits: 2,
                                            }).format(limitCashTotal)}
                                        </span>
                                    </div>
                                </div>

                                {isLimitCashExpanded && (
                                    <div className="pl-4 space-y-2 m-2">
                                        {Object.keys(limitCashRows).map((row, index) => (

                                            <div key={index} className="flex flex-wrap gap-2 justify-between items-center p-3">
                                                <span className="text-xs sm:text-sm ">{row.includes('cashLedger') ? 'Ledger' : 'Collateral'}</span>
                                                <span className={`text-xs sm:text-sm  whitespace-nowrap ${Number.parseFloat(limitCashRows[row] || "0") >= 0 ? "" : "text-red-500"}`}>
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(Number.parseFloat(limitCashRows[row] || "0"))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {limitMCXTotal > 0 && (
                                    <>
                                        <div className="flex flex-wrap gap-2 justify-between items-center p-3 border-t">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm sm:text-base">MCX Limit</span>
                                                <Button variant="ghost" size="sm" onClick={handleLimitMCXToggle}>
                                                    {isLimitMCXExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                                </Button>
                                            </div>
                                            <div className={`flex items-center ${limitMCXTotal >= 0 ? "" : "text-red-500"}`}>
                                                <span className="mr-1 text-sm sm:text-base whitespace-nowrap">
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(limitMCXTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isLimitMCXExpanded && (
                                    <div className="pl-4 space-y-2 m-2">
                                        {Object.keys(limitMCXRows).map((row, index) => (
                                            <div key={index} className="flex flex-wrap gap-2 justify-between items-center p-3">
                                                <span className="text-xs sm:text-sm text-gray-500">{row.includes('mcxLedger') ? 'Ledger' : 'Collateral'}</span>
                                                <span className={`text-xs sm:text-sm text-gray-500 whitespace-nowrap ${Number.parseFloat(limitMCXRows[row] || "0") >= 0 ? "" : "text-red-500"}`}>
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(Number.parseFloat(limitMCXRows[row] || "0"))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {limitCDTotal > 0 && (
                                    <>
                                        <div className="flex flex-wrap gap-2 justify-between items-center p-3 border-t">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm sm:text-base">CD Limit</span>
                                                <Button variant="ghost" size="sm" onClick={handleLimitCDToggle}>
                                                    {isLimitCDExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                                </Button>
                                            </div>
                                            <div className={`flex items-center ${limitCDTotal >= 0 ? "" : "text-red-500"}`}>
                                                <span className="mr-1 text-sm sm:text-base whitespace-nowrap">
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(limitCDTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isLimitCDExpanded && (
                                    <div className="pl-4 space-y-2 m-2">
                                        {Object.keys(limitCDRows).map((row, index) => (
                                            <div key={index} className="flex flex-wrap gap-2 justify-between items-center p-3">
                                                <span className="text-xs sm:text-sm text-gray-500">{row.includes('cdLedger') ? 'Ledger' : 'Collateral'}</span>
                                                <span className={`text-xs sm:text-sm text-gray-500 whitespace-nowrap ${Number.parseFloat(limitCDRows[row] || "0") >= 0 ? "" : "text-red-500"}`}>
                                                    {new Intl.NumberFormat("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                        maximumFractionDigits: 2,
                                                    }).format(Number.parseFloat(limitCDRows[row] || "0"))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 justify-between items-center p-3 border-t">
                                    <span className="text-sm sm:text-base">Algo Limit</span>
                                    <div className={`flex items-center ${Number.parseFloat(data?.utradeLimit || "0") >= 0 ? "" : "text-red-500"}`}>
                                        <span className="mr-1 text-sm sm:text-base whitespace-nowrap">
                                            {new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                                maximumFractionDigits: 2,
                                            }).format(data?.utradeLimit || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-between items-center p-3 border-t">
                                    <span className="text-sm sm:text-base">MTF Limit</span>
                                    <div className={`flex items-center ${Number.parseFloat(data?.mtfLedgerOutput || "0") >= 0 ? "" : "text-red-500"}`}>
                                        <span className="mr-1 text-sm sm:text-base whitespace-nowrap">
                                            {new Intl.NumberFormat("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                                maximumFractionDigits: 2,
                                            }).format(data?.mtfLedgerOutput || 0)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    )
}

export default DailyLimit

