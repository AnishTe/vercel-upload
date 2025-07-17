"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { PlusCircle } from "lucide-react"

// Define a custom type for conditional columns
type ConditionalColumn = [string, { value: string }[]][]

// Extend the ColumnDef type with our custom properties
export type CustomColumnDef<T> = ColumnDef<T> & {
    conditionalColumn?: ConditionalColumn
    width?: string
    sortable?: boolean
    profitLoss?: boolean
    hidden?: boolean
    disabled?: boolean
    deselected?: boolean
    hiddenColumns?: string[] // Add this new property
    dtRender?: any
}

// Define the data type for our rows
export type AnnualPLEntry = {
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
        id: "scrip_name1",
        accessorKey: "scrip_name1",
        header: "Scrip Name",
        disabled: true,
        sortable: false,
        width: "160px",
        cell: ({ row }) => {
            return <div className="flex items-center gap-2">
                {row["TR_TYPE"] === "LIABILITIES" &&
                    <Button className="add-portfolio-btn" data-row={JSON.stringify(row)} variant="ghost" size="icon" onClick={() => row.original.onAddPortfolio?.(row.original)}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                }

                <span>{row["scrip_name1"]}</span>
            </div>
        }
    },

    {
        id: "SCRIP_SYMBOL",
        accessorKey: "SCRIP_SYMBOL",
        header: "Scrip Symbol",
        deselected: true,
    },
    {
        id: "scrip_name",
        accessorKey: "scrip_name",
        header: "Scrip Detail",
        deselected: true,
    },
    {
        id: "BUY_QTY",
        accessorKey: "BUY_QTY",
        header: "Buy Quantity",
        width: "90px",
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
        },
        width: "90px",
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
        width: "90px",
    },
    {
        id: "BUY_TRADE_DATE",
        accessorKey: "BUY_TRADE_DATE",
        header: "Buy Date",
        width: "90px",

    },
    {
        id: "SALE_QTY",
        accessorKey: "SALE_QTY",
        header: "Sell Quantity",
        conditionalColumn: [["TR_TYPE", [{ value: "OP_ASSETS" }, { value: "ASSETS" }]]],
        width: "90px",

    },
    {
        id: "SALE_RATE",
        accessorKey: "SALE_RATE",
        header: "Sell Rate",
        width: "90px",
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
        id: "SALE_TRADE_DATE",
        accessorKey: "SALE_TRADE_DATE",
        header: "Sell Date",
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
        //     const rawValue = row["CURR_AMOUNT"];
        //     const amount = parseFloat(rawValue);
        //     if (!isNaN(amount)) {
        //         return new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(amount);
        //     }

        //     return "0";
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
        //     return "0";
        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) || 0 // Make sure this is the numeric value
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
]

export const liabilitiesColumn: CustomColumnDef<AnnualPLEntry> = {
    id: "actions",
    header: "Add Folio",
    cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => row.original.onAddPortfolio?.(row.original)}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Add to Portfolio</span>
        </Button>
    ),
}

export const hiddenColumns = columns.filter((col) => col.hidden).map((col) => col.id as string)

