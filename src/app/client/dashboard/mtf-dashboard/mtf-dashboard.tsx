"use client"

import { getMtfFundedScripDetails, getMtfMarginSummary, mtfCollateralScripDetails } from "@/api/auth";
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton";

import dynamic from "next/dynamic";
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false });

// import DataTableArray from "@/components/DataTableArray";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation";
import { useEffect, useState } from "react";
import { MtfFundedcolumns, MtfFundedScripColumnsWithTotals } from "./MtfFundedcolumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mtfCollateralScripColumns, mtfCollateralScripColumnsWithTotals } from "./mtfCollateralScripColumns";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX } from "lucide-react";

export default function MTFDashboard() {
    const [mtfCollateralScriploading, setmtfCollateralScripLoading] = useState(false)
    const [mtfCollateralScriptotal, setmtfCollateralScripTotal] = useState(0)
    const [mtfCollateralScripdata, setmtfCollateralScripdata] = useState<[]>([])
    const [mtfCollateralScriperror, setmtfCollateralScripError] = useState("")

    const [MtfFundedScriperror, setMtfFundedScripError] = useState("")
    const [MtfFundedScripTotal, setMtfFundedScripTotal] = useState(0)
    const [MtfFundedScripdata, setMtfFundedScripdata] = useState<[]>([])
    const [MtfFundedScriploading, setMtfFundedScripLoading] = useState(false)

    const [mtfMarginSummaryLoading, setmtfMarginSummaryLoading] = useState(false)
    const [mtfMarginSummaryError, setmtfMarginSummaryError] = useState("")
    const [mtfMarginSummarydata, setmtfMarginSummarydata] = useState<[]>([])

    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)

    useEffect(() => {
        const fetchmtfCollateralScripDetails = async () => {
            setmtfCollateralScripLoading(true)
            try {
                const response = await mtfCollateralScripDetails()
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }

                let parsedData: any
                if (typeof response.data.data === "string") {
                    parsedData = response.data.data.trim().startsWith("Error")
                        ? response.data.data
                        : JSON.parse(response.data.data)
                } else {
                    parsedData = response.data.data
                }

                if (parsedData.Success === "True" && parsedData["Success Description"]) {
                    const description = parsedData["Success Description"]
                    // const total = parsedData.reduce((acc: number, curr: any) => acc + curr.A, 0)
                    setmtfCollateralScripdata(description)
                    // setmtfCollateralScripTotal(total)
                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
                }
            } catch (error: any) {
                setmtfCollateralScripError(error.message || "An unknown error occurred while fetching data.")
            } finally {
                setmtfCollateralScripLoading(false)
            }
        }

        const fetchMtfFundedScripDetails = async () => {
            setMtfFundedScripLoading(true)
            try {
                const response = await getMtfFundedScripDetails()
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }

                let parsedData: any
                if (typeof response.data.data === "string") {
                    parsedData = response.data.data.trim().startsWith("Error")
                        ? response.data.data
                        : JSON.parse(response.data.data)
                } else {
                    parsedData = response.data.data
                }

                if (parsedData.Success === "True" && parsedData["Success Description"]) {
                    const description = parsedData["Success Description"]; // Assuming it's the same for all rows

                    // const total = parsedData.reduce((acc: number, curr: any) => acc + (Number(curr.MTM) || 0), 0);

                    setMtfFundedScripdata(description);
                    // setMtfFundedScripTotal(total);

                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
                }
            } catch (error: any) {
                setMtfFundedScripError(error.message || "An unknown error occurred while fetching data.")
            } finally {
                setMtfFundedScripLoading(false)
            }
        }

        const fetchMtfMarginSummary = async () => {
            setmtfMarginSummaryLoading(true)
            try {
                const response = await getMtfMarginSummary()
                const tokenIsValid = validateToken(response)
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true)
                    return
                }

                let parsedData: any
                if (typeof response.data.data === "string") {
                    parsedData = response.data.data.trim().startsWith("Error")
                        ? response.data.data
                        : JSON.parse(response.data.data)
                } else {
                    parsedData = response.data.data
                }

                if (parsedData.Success === "True" && parsedData["Success Description"]) {
                    const description = parsedData["Success Description"][0]
                    setmtfMarginSummarydata(description)
                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch data.")
                }
            } catch (error: any) {
                setmtfMarginSummaryError(error.message || "An unknown error occurred while fetching data.")
            } finally {
                setmtfMarginSummaryLoading(false)
            }
        }

        fetchmtfCollateralScripDetails()
        fetchMtfFundedScripDetails()
        fetchMtfMarginSummary()
    }, [])

    const displaySummary = [
        "MTF_Cash_Collatral",
        "MTF_Share_Collatral",
        "TotalCollatral",
        "TotalMargin",
        "MTMLoss",
        "MarginShortAcess",
        "TotalFundedAmount",
        "NetRisk",
        "NetRiskPer",
        "MTFClAuto",
        "MFT_Max_Amount",
        "Int_Rate",
    ];

    const keyLabels: Record<string, string> = {
        MTF_Cash_Collatral: "MTF Cash Collateral",
        MTF_Share_Collatral: "MTF Share Collateral",
        TotalCollatral: "Total Collateral",
        TotalMargin: "Total Margin",
        MTMLoss: "MTM Loss",
        MarginShortAcess: "Margin Short Access",
        TotalFundedAmount: "Total Funded Amount", // ✅ Proper structure
        NetRisk: "Net Risk",
        NetRiskPer: "Net Risk %",
        MTFClAuto: "MTF CL Auto",
        MFT_Max_Amount: "MTF Max Amount",
    };

    const formatValue = (value: any): string => {
        if (!isNaN(value) && value !== null && value !== undefined && value !== "") {
            // ✅ Convert string numbers to actual numbers and format as currency
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
            }).format(Number(value));
        }
        // ✅ If the value is a non-numeric string (like "Y"), return as it is
        return String(value);
    };

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4 flex flex-col gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Financial Information(Global)</CardTitle>
                        </CardHeader>
                        <CardContent>

                            {mtfMarginSummaryError &&
                                <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                    <div className="rounded-full bg-muted p-3 mb-4">
                                        <FileX className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">No Data found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-md">There are no Financial Information available.</p>
                                </div>
                            }

                            <div className="space-y-4 lg:w-[50%] md:w-auto">
                                <div className="border rounded-md">
                                    {mtfMarginSummaryLoading ? (
                                        [...Array(10)].map((_, index) => (
                                            <div key={index} className="flex justify-between items-center p-3">
                                                <Skeleton className="h-4 w-1/3" />
                                                <Skeleton className="h-4 w-1/4" />
                                            </div>
                                        ))
                                    ) : (
                                        <div>
                                            {displaySummary
                                                .filter((key) => mtfMarginSummarydata.hasOwnProperty(key)) // ✅ Only include existing keys
                                                .filter((key) => Number(mtfMarginSummarydata[key]) !== 0) // ✅ Skip zero values
                                                .map((key, index) => (
                                                    <div
                                                        key={key}
                                                        className={`flex flex-wrap gap-2 justify-between items-center p-3 ${index !== 0 ? "border-t" : ""}`}
                                                    >
                                                        {/* ✅ Use `keyLabels` for proper display name */}
                                                        <span className="text-sm sm:text-base break-words max-w-[70%]">
                                                            {keyLabels[key] || key.replace(/_/g, " ")}
                                                        </span>
                                                        {/* ✅ Ensure value is always formatted as currency */}
                                                        <span
                                                            className={`text-sm sm:text-base whitespace-nowrap ${Number(mtfMarginSummarydata[key]) < 0 ? "text-red-500" : ""
                                                                }`}
                                                        >
                                                            {
                                                                key === "Int_Rate" ? `${mtfMarginSummarydata[key]}%` : formatValue(mtfMarginSummarydata[key])
                                                            }
                                                        </span>


                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>MTF Funded Scrip Details</CardTitle>
                        </CardHeader>
                        <CardContent>

                            {MtfFundedScriploading ? (
                                <DataTableSkeleton columns={4} rows={5} />
                            ) : MtfFundedScriperror ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                    <div className="rounded-full bg-muted p-3 mb-4">
                                        <FileX className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">No Data found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-md">There are no MTF Funded Scrip Details available.</p>
                                </div>

                            ) : (
                                <>
                                    <DataTableArray
                                        columns={MtfFundedcolumns}
                                        data={MtfFundedScripdata}
                                        showAllRows={true}
                                        showPagination={false}
                                        columnsWithTotals={MtfFundedScripColumnsWithTotals}
                                        downloadFileName="MTF_Funded_Scrip_Details"
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>MTF Collateral Scrip Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {mtfCollateralScriploading ? (
                                <DataTableSkeleton columns={4} rows={5} />
                            ) : mtfCollateralScriperror ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                    <div className="rounded-full bg-muted p-3 mb-4">
                                        <FileX className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">No Data found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-md">{mtfCollateralScriperror}</p>
                                </div>
                            ) : (
                                <>
                                    <DataTableArray
                                        columns={mtfCollateralScripColumns}
                                        data={mtfCollateralScripdata}
                                        showAllRows={true}
                                        showPagination={false}
                                        columnsWithTotals={mtfCollateralScripColumnsWithTotals}
                                        downloadFileName="MTF_Collateral_Scrip_Details"
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    );
}
