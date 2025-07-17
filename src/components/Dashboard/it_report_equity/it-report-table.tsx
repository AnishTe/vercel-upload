"use client"

import { useRef, memo } from "react"
import dynamic from "next/dynamic"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { columns, hiddenColumns } from "./columns"

// Dynamically import the DataTable component with no SSR
const DatatableNet = dynamic(() => import("@/components/DataTableNet"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

interface ITReportTableProps {
    sortedGroupedData: Record<string, { rows: any[]; sum: number }>
    processedExpensesData: any[]
    totalExpenses: number
    onAddPortfolio: (rowData: any) => void
    financialYear: string
    fromDate: string
    toDate: string
    ref: any
}

// Add a check to prevent unnecessary re-renders when props change
export const ITReportTable = memo(
    function ITReportTable({
        sortedGroupedData,
        processedExpensesData,
        totalExpenses,
        onAddPortfolio,
        financialYear,
        fromDate,
        toDate,
        ref
    }: ITReportTableProps) {

        return (
            <div className="overflow-x-auto">
                <DatatableNet
                    ref={ref}
                    columns={columns}
                    data={sortedGroupedData}
                    hiddenColumns={hiddenColumns}
                    filterColumn="scrip_name1"
                    filterPlaceholder="Filter Scrip..."
                    showAllRows={true}
                    includeFileData={true}
                    year={financialYear}
                    fromDate={fromDate}
                    toDate={toDate}
                    columnSearch={true}
                    totalDataSummary={{
                        unrealized: Object.entries(sortedGroupedData)
                            .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
                            .reduce((acc, [, { sum }]) => acc + sum, 0),
                        realized:
                            Object.entries(sortedGroupedData)
                                .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
                                .reduce((acc, [, { sum }]) => acc + sum, 0) - Math.abs(Number(totalExpenses)),
                        liabilities: sortedGroupedData["LIABILITIES"]?.sum || 0,
                    }}
                    expensesData={{
                        rowKey: "BUY_COMPANY_CODE",
                        rowAmount: "PL_AMT",
                        rows: processedExpensesData,
                        total: totalExpenses,
                    }}
                    columnsWithTotals={["BUY_QTY", "BUY_AMT", "SALE_QTY", "SALE_AMT", "NET_QTY", "CURR_AMOUNT", "PL_AMT"]}
                    showPagination={false}
                    downloadFileName={"IT_REPORT_EQUITY"}
                    onAddPortfolio={onAddPortfolio}
                />
            </div>
        )
    },
    (prevProps, nextProps) => {
        // Only re-render if data changes
        return (
            prevProps.sortedGroupedData === nextProps.sortedGroupedData &&
            prevProps.processedExpensesData === nextProps.processedExpensesData &&
            prevProps.totalExpenses === nextProps.totalExpenses
        )
    },
)
