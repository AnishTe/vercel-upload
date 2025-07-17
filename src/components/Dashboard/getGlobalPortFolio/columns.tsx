"use client"

import type { ColumnDef } from "@tanstack/react-table"

// Define a custom type for conditional columns
type ConditionalColumn = [string, { value: string }[]][]

// Extend the ColumnDef type with our custom properties
export type CustomColumnDef<T> = ColumnDef<T> & {
    conditionalColumn?: ConditionalColumn
    hidden?: boolean
    disabled?: boolean
    deselected?: boolean
    hiddenColumns?: string[] // Add this new property
    dtRender?: any
}

// Define the data type for our rows
export type AnnualPLEntry = {
    NET_AMOUNT: any
    CLOSING_PRICE: any
    NET_QUANTITY: any
    BUY_AMOUNT: any
    NOT_PROFIT: any
    TRADING_AMOUNT: number
    TODATE: string
    SALE_AMOUNT: any
    scrip_name: string
    SCRIP_SYMBOL: string
    BUY_QTY: number
    BUY_RATE: number
    BUY_AMT: number
    BUY_TRADE_DATE: string
    SALE_QTY?: number
    SALE_RATE?: number
    SALE_AMT?: number
    SALE_TRADE_DATE?: Date
    NET_QTY: number
    CURR_AMOUNT: number
    PL_AMT: number
    Closing_Price: number
    PriceDate: string
    TR_TYPE: string
    ISIN: string
    SECTOR: string
    INDUSTRY: string
    onAddPortfolio?: (row: AnnualPLEntry) => void
}

// Define all columns
export const columns: CustomColumnDef<AnnualPLEntry>[] = [
    {
        id: "SCRIP_NAME",
        accessorKey: "SCRIP_NAME",
        header: "Scrip Name",
        disabled: true
    },
    // {
    //     id: "BUY_QUANTITY",
    //     accessorKey: "BUY_QUANTITY",
    //     header: "Buy Quantity",
    // },
    // {
    //     id: "BUY_RATE",
    //     accessorKey: "BUY_RATE",
    //     header: "Buy Rate",
    //     cell: ({ row }) =>
    //         new Intl.NumberFormat("en-IN", {
    //             style: "currency",
    //             currency: "INR",
    //         }).format(row.original.BUY_RATE),
    // },
    // {
    //     id: "BUY_AMOUNT",
    //     accessorKey: "BUY_AMOUNT",
    //     header: "Buy Amount",
    //     cell: ({ row }) => {
    //         const amount = row.original.BUY_AMOUNT
    //         const formatted = new Intl.NumberFormat("en-IN", {
    //             style: "currency",
    //             currency: "INR",
    //         }).format(amount)
    //         return <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>{formatted}</span>
    //     },
    // },
    // {
    //     id: "SALE_QUANTITY",
    //     accessorKey: "SALE_QUANTITY",
    //     header: "Sell Quantity",
    // },
    // {
    //     id: "SALE_RATE",
    //     accessorKey: "SALE_RATE",
    //     header: "Sell Rate",
    //     cell: ({ row }) =>
    //         new Intl.NumberFormat("en-IN", {
    //             style: "currency",
    //             currency: "INR",
    //         }).format(row.original.SALE_RATE ?? 0),
    // },
    // {
    //     id: "SALE_AMOUNT",
    //     accessorKey: "SALE_AMOUNT",
    //     header: "Sell Amount",
    //     cell: ({ row }) => {
    //         const amount = row.original.SALE_AMOUNT
    //         const formatted = new Intl.NumberFormat("en-IN", {
    //             style: "currency",
    //             currency: "INR",
    //         }).format(amount)
    //         return <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>{formatted}</span>
    //     },
    // },
    {
        id: "NET_QUANTITY",
        accessorKey: "NET_QUANTITY",
        header: "Quantity",
        disabled: true
    },
    {
        id: "NET_RATE",
        accessorKey: "NET_RATE",
        header: "Avg Rate",
        disabled: true
    },
    {
        id: "CLOSING_PRICE",
        accessorKey: "CLOSING_PRICE",
        header: "Closing Price",
        disabled: true
    },
    {
        id: "NET_AMOUNT",
        accessorKey: "NET_AMOUNT",
        header: "Invested Amount",
        // cell: ({ row }) => {
        //     const amount = row.original.NET_AMOUNT
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(Math.abs(amount))
        //     return <span >{formatted}</span>
        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(Math.abs(rawValue))

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        },
        disabled: true
    },
    {
        id: "CURR_AMOUNT",
        accessorKey: "CURR_AMOUNT",
        header: "Current Amount",
        // cell: ({ row }) => {
        //     const amount = row.original.CLOSING_PRICE * row.original.NET_QUANTITY
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(amount)
        //     return <span>{formatted}</span>
        // },

        dtRender: function (data, type, row) {
            const rawValue = row.original.CLOSING_PRICE * row.original.NET_QUANTITY // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        },


        disabled: true
    },
    {
        id: "NOT_PROFIT",
        accessorKey: "NOT_PROFIT",
        header: "Overall P/L",
        // cell: ({ row }) => {
        //     const amount = Number(row.original.NOT_PROFIT); // Ensure it's treated as a number

        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(amount);

        //     return (
        //         <div className="flex gap-2">
        //             <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
        //                 {formatted}
        //             </span>
        //         </div>
        //     );
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
        },
        disabled: true
    },
    {
        id: "changePer",
        accessorKey: "changePer",
        header: "% Change",
        sortingFn: (rowA, rowB) => {
            const amountA = rowA.original.NOT_PROFIT;
            const netAmountA = rowA.original.NET_AMOUNT;
            const percA = netAmountA ? (amountA / Math.abs(netAmountA)) * 100 : 0;

            const amountB = rowB.original.NOT_PROFIT;
            const netAmountB = rowB.original.NET_AMOUNT;
            const percB = netAmountB ? (amountB / Math.abs(netAmountB)) * 100 : 0;

            return percA - percB;
        },
        cell: ({ row }) => {
            const amount = row.original.NOT_PROFIT;
            const netAmount = row.original.NET_AMOUNT;

            // Handle division by zero or undefined values
            const perc = netAmount ? (amount / Math.abs(netAmount)) * 100 : 0;

            return (
                <div className="flex gap-2">
                    <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
                        {isNaN(perc) ? "0.00%" : perc.toFixed(2) + "%"}
                    </span>
                </div>
            );
        },
        disabled: true
    },

    // {
    //     id: "TRADING_AMOUNT",
    //     accessorKey: "TRADING_AMOUNT",
    //     header: "Trading Amount",
    //     cell: ({ row }) => (
    //         <div className="flex flex-col">
    //             <span>
    //                 {new Intl.NumberFormat("en-IN", {
    //                     style: "currency",
    //                     currency: "INR",
    //                 }).format(row.original.TRADING_AMOUNT)}
    //             </span>
    //             <span className="text-xs text-muted-foreground">{row.original.TODATE}</span>
    //         </div>
    //     ),
    // },
    {
        id: "FULL_SCRIP_SYMBOL",
        accessorKey: "FULL_SCRIP_SYMBOL",
        header: "Scrip Symbol",
        deselected: true,
    },
    {
        id: "ISINDATA",
        accessorKey: "ISINDATA",
        header: "ISIN",
        deselected: true,
    },
    {
        id: "COMPANY_CODE",
        accessorKey: "COMPANY_CODE",
        header: "Company Code",
        deselected: true,
    },

]