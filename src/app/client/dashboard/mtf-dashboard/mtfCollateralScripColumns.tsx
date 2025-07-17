import { ColumnDef } from "@tanstack/react-table"

type CustomColumnDef<T> = ColumnDef<T> & {
    dtRender?: any
    disabled?: boolean
}

export type GlobalReportEntry = {
    A: number
}

export const mtfCollateralScripColumns: CustomColumnDef<GlobalReportEntry>[] = [
    {
        id: "Scrip_Name",
        accessorKey: "Scrip_Name",
        header: "Scrip",
        disabled: true,
    },
    {
        id: "ISIN",
        accessorKey: "ISIN",
        header: "ISIN",
    },
    {
        id: "NET_Qty",
        accessorKey: "NET_Qty",
        header: "Net Qty",
    },
    {
        id: "Price",
        accessorKey: "Price",
        header: "Market Rate",
    },
    {
        id: "HAIRCUT",
        accessorKey: "HAIRCUT",
        header: "HAIRCUT",
    },
    {
        id: "HAIRPRICE",
        accessorKey: "HAIRPRICE",
        header: "HAIRCUT PRICE",
    },
    {
        id: "A",
        accessorKey: "A",
        header: "AMOUNT",
        // cell: ({ row }) => {
        //     const amount = row.original.A
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

export const mtfCollateralScripColumnsWithTotals = ["A"]
// export const mtfCollateralScripColumnsWithTotals = ["6"]