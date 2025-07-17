/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import LedgerDataDisplay from '../ledger/LedgerDataDisplay'
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { getDailyClientLimit, getLedger, getUtradeLimit, setUtradeLimit } from '@/api/auth'
import DecryptedText from '@/components/ui/DecryptedText'
import DailyLimit from './DailyLimit'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PopoverClose } from '@radix-ui/react-popover'

export function LimitTransfer() {
    const [limitLoading, setLimitLoading] = useState(true)
    const [ledgerLoading, setLedgerLoading] = useState(true)
    const [dailyClientLimitLoading, setDailyClientLimitLoading] = useState(true)
    const [ledgerError, setLedgerError] = useState<string | null>(null)
    const [dailyClientLimitError, setDailyClientLimitError] = useState<string | null>(null)
    const [limitError, setLimitError] = useState<string | null>(null)
    const [ledgerData, setLedgerData] = useState<any>(null)
    const [dailyClientLimit, setDailyClientLimit] = useState<any>(null)
    const [groupedData, setGroupedData] = useState<any>(null)
    const [ledgerMrgCollAmount, setLedgerMrgCollAmount] = useState(0)
    const [limit, setLimit] = useState(0);
    const [newLimit, setNewLimit] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

    useEffect(() => {
        fetchLedgerData()
        fetchLimitData()
        fetchDailyClientLimit()
    }, [])

    const fetchLedgerData = async () => {
        setLedgerLoading(true);
        try {
            const response = await getLedger();
            const tokenIsValid = validateToken(response);
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true);
                return;
            }

            const parsedData = typeof response.data.data === "string"
                ? JSON.parse(response.data.data)
                : response.data.data;
            if (parsedData.Success === "True" && parsedData["Success Description"]) {
                const description = parsedData["Success Description"];
                setLedgerData(description);
                setGroupedData(groupedData);
            } else {
                throw new Error(parsedData["Error Description"] || "Failed to fetch ledger data.");
            }
        } catch (error: any) {
            setLedgerError("An error occurred while fetching data.");
        } finally {
            setLedgerLoading(false);
        }
    };

    const fetchDailyClientLimit = async () => {
        setDailyClientLimitLoading(true);
        try {
            const response = await getDailyClientLimit();
            const tokenIsValid = validateToken(response);
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true);
                return;
            }

            if (response.data.data) {
                setDailyClientLimit(response.data.data);
            } else {
                throw new Error("Failed to fetch limit.");
            }
        } catch (error: any) {
            setDailyClientLimitError(error.message || "An error occurred");
        } finally {
            setDailyClientLimitLoading(false);
        }
    };

    const fetchLimitData = async () => {
        setLimitLoading(true);
        try {
            const response = await getUtradeLimit();
            const tokenIsValid = validateToken(response);
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true);
                return;
            }

            if (response.data.data.status === "success") {
                setLimit(response.data.data.limit);
            } else {
                throw new Error("Failed to fetch limit.");
            }
        } catch (error: any) {
            setLimitError(error.message || "An error occurred");
        } finally {
            setLimitLoading(false);
        }
    };

    useEffect(() => {
        if (ledgerData) {
            const ledgerMrgCollRow = ledgerData.find(
                (row: any) => row.TITAL === "Ledger+Mrg+Coll" || row.COCD === "Ledger+Mrg+Coll"
            )
            if (ledgerMrgCollRow) {
                setLedgerMrgCollAmount(parseFloat(ledgerMrgCollRow.AMOUNT) || 0)
            }
        }
    }, [ledgerData])

    const handleLimitSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await setUtradeLimit({
                updatedLimit: newLimit,
            });
            const tokenIsValid = validateToken(response);
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true);
                return;
            }

            if (response.data.data.status === "success") {
                setLimit(parseFloat(newLimit)); // Update limit after successful submission
                setNewLimit(""); // Clear input field
                toast.success("New Limit Set successfully!", { position: "top-center" });
            } else {
                throw new Error("Failed to set limit.");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred", { position: "top-center" });
        } finally {
            setSubmitting(false);
        }
    };

    const excludedValues = [
        "Associate Ledger",
        "FD",
        "Beneficiary",
        "UnConcile Credit",
        "Pending Receipt",
    ]

    const filteredData = Array.isArray(ledgerData)
        ? ledgerData.filter(
            (row) => row.TITAL !== "Ledger+Mrg+Coll" && !excludedValues.includes(row.TITAL)
        )
        : []

    const filteredDataWithLedgerMrgColl = [
        ...filteredData,
        ...(Array.isArray(ledgerData)
            ? ledgerData.filter(
                (row) =>
                    (row.TITAL === "Ledger+Mrg+Coll" || row.COCD === "Ledger+Mrg+Coll") &&
                    !excludedValues.includes(row.TITAL)
            )
            : []),
    ]

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Funds</CardTitle>
                        </CardHeader>
                        <CardContent >
                            <div className="grid md:grid-cols-[60%_40%] gap-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Funds</CardTitle>
                                            </CardHeader>
                                            <CardContent className='p-4'>
                                                <LedgerDataDisplay
                                                    error={ledgerError}
                                                    loading={ledgerLoading}
                                                    ledgerMrgCollAmount={ledgerMrgCollAmount}
                                                    filteredDataWithLedgerMrgColl={filteredDataWithLedgerMrgColl}
                                                    groupedTotals={groupedData}
                                                    data={ledgerData}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div>
                                        <Card>
                                            <CardHeader>
                                                <div className='flex lg:items-center justify-between w-full sm:flex-row flex-col'>
                                                    <CardTitle>Assigned Limit</CardTitle>
                                                    <div className="flex items-center gap-2 m-2">
                                                        <span className="font-[400]">as on:</span>
                                                        <span className={`font-semibold `}>
                                                            {dailyClientLimit && new Date(dailyClientLimit.lastUpdatedTime).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: 'numeric',
                                                                minute: 'numeric',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className='p-4'>
                                                <DailyLimit
                                                    error={dailyClientLimitError}
                                                    loading={dailyClientLimitLoading}
                                                    data={dailyClientLimit}
                                                />

                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Algo Limit Transfer</CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-4'>
                                            {limitLoading ? (
                                                <div className="space-y-4">
                                                    <Skeleton className="h-8 w-full" />
                                                    <Skeleton className="h-8 w-full" />
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            ) : limitError ? (
                                                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{limitError}</div>
                                            ) : (
                                                <div className="space-y-4 break-words">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center">
                                                            <span className="mr-2">Requested Algo Limit:</span>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="p-0 h-auto"
                                                                    >
                                                                        <Info size={16} />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    className="min-w-[50px] max-w-[250px] p-4 m-2 bg-gray-800 text-white rounded-md shadow-md relative"
                                                                    sideOffset={5}
                                                                >
                                                                    <div className="absolute right-1 top-1">
                                                                        <PopoverClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                                                            <X className="h-4 w-4" />
                                                                            <span className="sr-only">Close</span>
                                                                        </PopoverClose>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <p className="text-sm">
                                                                            The maximum limit previously set by the client for transferring funds to Algo from their available limit.
                                                                        </p>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <span className="font-bold">
                                                            {new Intl.NumberFormat("en-IN", {
                                                                style: "currency",
                                                                currency: "INR"
                                                            }).format(limit)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <div className="flex items-center">
                                                            <span className="mr-2">Update Algo Limit:</span>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="p-0 h-auto"
                                                                    >
                                                                        <Info size={16} />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    className="min-w-[50px] max-w-[250px] p-4 m-2 bg-gray-800 text-white rounded-md shadow-md relative"
                                                                    sideOffset={5}
                                                                >
                                                                    <div className="absolute right-1 top-1">
                                                                        <PopoverClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                                                            <X className="h-4 w-4" />
                                                                            <span className="sr-only">Close</span>
                                                                        </PopoverClose>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <p className="text-sm">
                                                                            The maximum limit currently set by you for transferring funds to Algo from your available limit.
                                                                        </p>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            value={newLimit}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                // const storedLimit = sessionStorage.getItem('limit');
                                                                const storedLimit = "100000000";
                                                                if (parseFloat(value) >= 0 || value === "") {
                                                                    if (storedLimit && parseFloat(value) > parseFloat(storedLimit)) {
                                                                        toast.warning(`The entered value exceeds maximum permissible limit: ${storedLimit}`);
                                                                    }
                                                                    setNewLimit(value);
                                                                }
                                                            }}
                                                            placeholder="Enter new limit"
                                                            className="max-w-[200px]"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleLimitSubmit}
                                                        disabled={submitting || !newLimit || (parseFloat(newLimit) > parseFloat("100000000"))}
                                                        className="w-full"
                                                    >
                                                        {submitting ? "Submitting..." : "Submit"}
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="p-4 break-words">
                                                <p>* Tip - The requested changes will take effect from the next trading day</p>

                                                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                                                <div className="space-y-4">
                                                    <p>Please review the cases below to understand how the limit transfer works:</p>
                                                    <div>
                                                        <h4 className="font-semibold">Case 1: Available Limit Equals Current Algo Limit</h4>
                                                        <p><strong>Current Algo Limit:</strong> ₹50,000</p>
                                                        <p><strong>Available Limit:</strong> ₹50,000</p>
                                                        <p>Since the available limit matches the current Algo limit:</p>
                                                        <ul className="list-disc pl-5">
                                                            <li>₹50,000 will be transferred to Algo.</li>
                                                            <li>₹0 will be allocated to other trading platforms.</li>
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">Case 2: Available Limit Less Than Current Algo Limit</h4>
                                                        <p><strong>Current Algo Limit:</strong> ₹50,000</p>
                                                        <p><strong>Available Limit:</strong> ₹30,000</p>
                                                        <p>In this case, the available limit is less than the current Algo limit:</p>
                                                        <ul className="list-disc pl-5">
                                                            <li>₹30,000 will be transferred to Algo (equal to the available limit).</li>
                                                            <li>₹0 will be allocated to other trading platforms because there is no remaining limit.</li>
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">Case 3: Available Limit Greater Than Current Algo Limit</h4>
                                                        <p><strong>Current Algo Limit:</strong> ₹50,000</p>
                                                        <p><strong>Available Limit:</strong> ₹70,000</p>
                                                        <p>Here, the available limit exceeds the current Algo limit:</p>
                                                        <ul className="list-disc pl-5">
                                                            <li>₹50,000 will be transferred to Algo (up to the current Algo limit).</li>
                                                            <li>₹20,000 (remaining limit) will be available for other trading platforms.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout >

            {showSessionExpiredModal && <SessionExpiredModal />
            }
        </>
    )
}

