"use client"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, LinkIcon } from "lucide-react"

export type LedgerBookEntry = {
    original: any
    VOUCHERDATE?: string | any
    NARRATION: string
    CTRCODE?: string
    MKT_TYPE?: string
    BILL_DATE?: string
    SETTLEMENT_NO?: string
    OpeningBalance: number
    Amount: number
    ClosingBalance: number
}

export type SelectedColumnsEntry = {
    SCRIP_SYMBOL?: string
    open_QUANTITY?: number
    Open_AMOUNT?: number
    BUY_QUANTITY?: number
    BUY_RATE?: number
    BUY_AMOUNT?: number
    SALE_QUANTITY?: number
    SALE_RATE?: number
    SALE_AMOUNT?: number
    NET_QUANTITY?: number
    NET_RATE?: number
    NET_AMOUNT?: number | string
}

export type CustomColumnDef<T> = ColumnDef<T> & {
    dtRender?: any
}

export const columns: CustomColumnDef<LedgerBookEntry>[] = [
    {
        id: "COCD",
        enableSorting: false,
        accessorKey: "COCD",
        header: "COCD",
    },
    {
        id: "VOUCHERDATE",
        enableSorting: false,
        accessorKey: "VOUCHERDATE",
        header: "Date",
        // custom property, not part of ColumnDef type
        dtRender: function (data, type, row, meta) {
            const date = new Date(data);

            if (type === "display") {
                return `
              <span data-order="${date.getTime()}" data-search="${date.toISOString()}">
                ${date.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                })}
              </span>`;
            }

            if (type === "sort" || type === "type") {
                return date.getTime();
            }

            return data;
        },
    },

    {
        id: "NARRATION",
        enableSorting: false,
        accessorKey: "NARRATION",
        header: "Narration",
        cell: ({ row }) => (
            <div className="max-w-[500px] min-w-[200px] whitespace-normal break-words" title={row.original.NARRATION}>
                {row.original.NARRATION}
            </div>
        ),
    },
    {
        id: "OpeningBalance",
        header: "Opening Balance",
        // cell: ({ row }) => (
        //     <span>
        //         {new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //             minimumFractionDigits: 2,
        //         }).format(row.original.OpeningBalance)}
        //     </span>
        // ),
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) || "0" // Make sure this is the numeric value
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
        id: "Amount",
        header: "Amount",
        accessorKey: "Amount",
        cell: ({ row }) => {
            const value = row.original.Amount
            const isNegative = value < 0
            return (
                <div className="flex items-center gap-2">
                    <span
                        style={{
                            color: isNegative ? "red" : "inherit",
                        }}
                    >
                        {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 2,
                        }).format(value)}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 action-btn"
                        data-action="modal"
                        data-id="${row.original.id || ''}"
                    // onClick={() => {
                    //     console.log("clicked", row.original);
                    // }}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    },
    {
        id: "ClosingBalance",
        header: "Closing Balance",
        // cell: ({ row }) => {
        //     const value = row.original.ClosingBalance
        //     const isNegative = value < 0
        //     return (
        //         <span
        //             style={{
        //                 color: isNegative ? "red" : "inherit",
        //             }}
        //         >
        //             {new Intl.NumberFormat("en-IN", {
        //                 style: "currency",
        //                 currency: "INR",
        //                 minimumFractionDigits: 2,
        //             }).format(value)}
        //         </span>
        //     )
        // },

        dtRender: function (data, type, row) {
            const rawValue = parseFloat(data) || 0 // Make sure this is the numeric value
            const formatted = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(rawValue)

            if (type === 'display') {
                const className = rawValue >= 0 ? 'inherit' : 'text-red-600'
                return `<span data-sort="${rawValue}" class="${className}">${formatted}</span>`
            }

            return rawValue
        },
    },
]

export const selectedColumns: ColumnDef<SelectedColumnsEntry>[] = [
    {
        id: "SCRIP_SYMBOL",
        accessorKey: "SCRIP_SYMBOL",
        header: "Scrip Symbol",
    },
    {
        id: "open_QUANTITY",
        accessorKey: "open_QUANTITY",
        header: "Open Quantity",
    },
    {
        id: "Open_AMOUNT",
        accessorKey: "Open_AMOUNT",
        header: "Open Amount",
    },
    {
        id: "BUY_QUANTITY",
        accessorKey: "BUY_QUANTITY",
        header: "Buy Quantity",
    },
    {
        id: "BUY_RATE",
        accessorKey: "BUY_RATE",
        header: "Buy Rate",
    },
    {
        id: "BUY_AMOUNT",
        accessorKey: "BUY_AMOUNT",
        header: "Buy Amount",
    },
    {
        id: "SALE_QUANTITY",
        accessorKey: "SALE_QUANTITY",
        header: "Sell Quantity",
    },
    {
        id: "SALE_RATE",
        accessorKey: "SALE_RATE",
        header: "Sell Rate",
    },
    {
        id: "SALE_AMOUNT",
        accessorKey: "SALE_AMOUNT",
        header: "Sell Amount",
    },
    {
        id: "NET_QUANTITY",
        accessorKey: "NET_QUANTITY",
        header: "Net Quantity",
    },
    {
        id: "NET_RATE",
        accessorKey: "NET_RATE",
        header: "Net Rate",
    },
    {
        id: "NET_AMOUNT",
        accessorKey: "NET_AMOUNT",
        header: "Net Amount",
    },
]

