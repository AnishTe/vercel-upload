import { ColumnDef } from "@tanstack/react-table"

type CustomColumnDef<T> = ColumnDef<T> & {
    dtRender?: any
    disabled?: boolean
}

export type GlobalReportEntry = {
    MTM: number
}

export const MtfFundedcolumns: CustomColumnDef<GlobalReportEntry>[] = [
    {
        id: "NSEScrip",
        accessorKey: "NSEScrip",
        header: "Scrip",
        disabled: true,

    },
    {
        id: "ISIN",
        accessorKey: "ISIN",
        header: "ISIN",
    },
    {
        id: "Qty",
        accessorKey: "Qty",
        header: "Qty",
    },
    {
        id: "FundedAmount",
        accessorKey: "FundedAmount",
        header: "Funded Amount",
    },
    {
        id: "TotalMargin",
        accessorKey: "TotalMargin",
        header: "Margin",
    },
    {
        id: "ReqMargin",
        accessorKey: "ReqMargin",
        header: "Net Margin",
    },
    {
        id: "Rate",
        accessorKey: "Rate",
        header: "Market Rate",
    },
    {
        id: "MarketAmount",
        accessorKey: "MarketAmount",
        header: "Market Amount",
    },
    {
        id: "MTM",
        accessorKey: "MTM",
        header: "MTM P/L",
        // cell: ({ row }) => {
        //     const amount = row.original.MTM
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(Math.abs(amount))
        //     return <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>{formatted}</span>
        // },

        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                const className = rawValue >= 0 ? 'text-green-600' : 'text-red-600'
                return `<span data-sort="${rawValue}" class="${className}">${formatted}</span>`
            }

            return rawValue
        }
    },
]

// export const MtfFundedScripColumnsWithTotals = ["3", "5", "8"]
export const MtfFundedScripColumnsWithTotals = ["FundedAmount", "ReqMargin", "MTM"]
// export const MtfFundedScripColumnsWithTotals = ["FundedAmount", "ReqMargin"]
