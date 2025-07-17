"use client"

import type { ColumnDef } from "@tanstack/react-table"

// Define a custom type for conditional columns
type ConditionalColumn = [string, { value: string }[]][]

// Extend the ColumnDef type with our custom properties
export type CustomColumnDef<T> = ColumnDef<T> & {
    conditionalColumn?: ConditionalColumn
    hidden?: any
    deselected?: any
    sortable?: boolean
    profitLoss?: boolean
    dtRender?: any
    hiddenColumns?: string[] // Add this new property
}

// Define the data type for our rows
export type AnnualPL_SummaryEntry = {
    SCRIP_NAME: string
    SCRIP_SYMBOL: string
    BUY_QTY: number
    BUY_RATE: number
    BUY_AMT: number
    SALE_QTY?: number
    SALE_RATE?: number
    SALE_AMT?: number
    NET_QTY: number
    CURR_AMOUNT: number
    PL_AMT: number
    Closing_Price: number
    PriceDate: string
    TR_TYPE: string
    ISIN: string
    SECTOR: string
    INDUSTRY: string
}

// Define all columns
export const columns: CustomColumnDef<AnnualPL_SummaryEntry>[] = [
    //     ISIN
    //     SCRIP_SYMBOL


    //     Closing_Price
    // PriceDate


    {
        id: "SCRIP_NAME",
        accessorKey: "SCRIP_NAME",
        header: "Scrip Name",
        sortable: false
    },
    {
        id: "BUY_QTY",
        accessorKey: "BUY_QTY",
        header: "Buy Quantity",
    },
    {
        id: "BUY_RATE",
        accessorKey: "BUY_RATE",
        header: "Buy Rate",
        // cell: ({ row }) => {
        //     const buyRate = row["BUY_RATE"] || undefined;
        //     return buyRate !== undefined
        //         ? new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(buyRate)
        //         : "N/A"; // or a default value if BUY_RATE is missing
        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        }
    },
    {
        id: "BUY_AMT",
        accessorKey: "BUY_AMT",
        header: "Buy Amount",
        // cell: ({ row }) => {
        //     const buyAmt = row["BUY_AMT"] || undefined;
        //     return buyAmt !== undefined ?
        //         new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(buyAmt) : "N/A";
        // }
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        }
    },

    {
        id: "SALE_QTY",
        accessorKey: "SALE_QTY",
        header: "Sell Quantity",
        conditionalColumn: [["TR_TYPE", [{ value: "OP_ASSETS" }, { value: "ASSETS" }]]],
    },
    {
        id: "SALE_RATE",
        accessorKey: "SALE_RATE",
        header: "Sell Rate",
        // cell: ({ row }) => {
        //     const SALE_RATE = row["SALE_RATE"] || undefined;
        //     return SALE_RATE !== undefined ?
        //         new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(SALE_RATE) : "N/A";

        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        },
        conditionalColumn: [["TR_TYPE", [{ value: "OP_ASSETS" }, { value: "ASSETS" }]]],
    },
    {
        id: "SALE_AMT",
        accessorKey: "SALE_AMT",
        header: "Sell Amount",
        // cell: ({ row }) => {
        //     const SALE_AMT = row["SALE_AMT"] || undefined;
        //     return SALE_AMT !== undefined ?
        //         new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(SALE_AMT) : "N/A";

        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        },
        conditionalColumn: [["TR_TYPE", [{ value: "OP_ASSETS" }, { value: "ASSETS" }]]],
    },
    {
        id: "NET_QTY",
        accessorKey: "NET_QTY",
        header: "Net Quantity",
        conditionalColumn: [["TR_TYPE", [{ value: "SHORTTERM" }, { value: "LONGTERM" }, { value: "TRADING" }]]],
    },
    {
        id: "CURR_AMOUNT",
        accessorKey: "CURR_AMOUNT",
        header: "Current Amount",
        conditionalColumn: [["TR_TYPE", [{ value: "SHORTTERM" }, { value: "LONGTERM" }, { value: "TRADING" }]]],
        // cell: ({ row }) => {
        //     const CURR_AMOUNT = row["CURR_AMOUNT"] || undefined;
        //     return CURR_AMOUNT !== undefined ?
        //         new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(CURR_AMOUNT) : "N/A";

        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                return `<span data-sort="${rawValue}">${formatted}</span>`
            }

            return rawValue
        },

    },
    {
        id: "PL_AMT",
        accessorKey: "PL_AMT",
        header: "P&L Amount",
        profitLoss: true,
        // cell: ({ row }) => {
        //     const data = row["PL_AMT"];
        //     if (data !== undefined) {
        //         const formatted = new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(data);
        //         const colorClass = data >= 0 ? "text-green-600" : "text-red-600";
        //         return <span className={colorClass}>{formatted}</span>;
        //     }
        //     return "N/A";
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

    {
        id: "Closing_Price",
        accessorKey: "Closing_Price",
        header: "Closing Price",
        // cell: ({ row }) => {
        //     const data = row["Closing_Price"];
        //     if (data !== undefined) {
        //         const formatted = new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(data);
        //         return (
        //             <div className="flex flex-col">
        //                 <span>{formatted}</span>
        //                 <span className="text-xs text-muted-foreground">{row["PriceDate"] || ""}</span>
        //             </div>
        //         );
        //     }
        //     return "N/A";
        // },

        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) || "0" // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                const classname = "flex flex-col"
                return `
                    <div data-sort="${rawValue}" class="${classname}">
                        <span >${formatted}</span>
                        <span class="text-xs text-muted-foreground">${row["PriceDate"] || ""}</span>
                    </div>
                `
            }

            return rawValue
        }
    },

    {
        id: "SCRIP_SYMBOL",
        accessorKey: "SCRIP_SYMBOL",
        header: "Scrip Symbol",
        deselected: true,
    },
    {
        id: "ISIN",
        accessorKey: "ISIN",
        header: "ISIN",
        deselected: true,
    },

]

export const hiddenColumns = columns.filter((col) => col.hidden).map((col) => col.id as string)

