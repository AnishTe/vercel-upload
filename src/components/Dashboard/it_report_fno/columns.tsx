"use client"

import type { ColumnDef } from "@tanstack/react-table"

type CustomColumnDef<T> = ColumnDef<T> & {
    accessorFn?: (row: T) => unknown;
    hiddenColumns?: string[] // Add this new property
    hidden?: boolean
    disabled?: boolean
    deselected?: boolean
    dtRender?: any
};

// Define the data type for our rows
export type AnnualPL_FNO_Entry = {
    NOTIONAL: any;
    SHORTQTY: null;
    LONGQTY: null;
    SCRIP_SYMBOL: string
    BUYQTY: number
    BUYRATE: number
    BUYAMT: number
    SALEQTY?: number
    SALERATE?: number
    SALEAMT?: number
    NET_PLAMT: number
}

// Define all columns
export const columns: CustomColumnDef<AnnualPL_FNO_Entry>[] = [
    {
        id: "SCRIP_SYMBOL",
        accessorKey: "SCRIP_SYMBOL",
        header: "Scrip Symbol",
        enableSorting: false,
        disabled: true,
    },
    {
        id: "BUYQTY",
        accessorKey: "BUYQTY",
        header: "Buy Quantity",
        enableSorting: false,
    },
    {
        id: "BUYRATE",
        accessorKey: "BUYRATE",
        header: "Buy Rate",
        enableSorting: false,
        // cell: ({ row }) =>
        //     new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(row.original.BUYRATE),
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
        id: "BUYAMT",
        accessorKey: "BUYAMT",
        header: "Buy Amount",
        enableSorting: false,
        // cell: ({ row }) =>
        //     new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(row.original.BUYAMT),
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
        id: "SALEQTY",
        accessorKey: "SALEQTY",
        header: "Sell Quantity",
        enableSorting: false,
    },
    {
        id: "SALERATE",
        accessorKey: "SALERATE",
        header: "Sell Rate",
        enableSorting: false,
        // cell: ({ row }) =>
        //     row.original.SALERATE
        //         ? new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(row.original.SALERATE)
        //         : "-",
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
        id: "SALEAMT",
        accessorKey: "SALEAMT",
        header: "Sell Amount",
        enableSorting: false,
        // cell: ({ row }) =>
        //     row.original.SALEAMT
        //         ? new Intl.NumberFormat("en-IN", {
        //             style: "currency",
        //             currency: "INR",
        //         }).format(row.original.SALEAMT)
        //         : "-",
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
        id: "NOTIONAL",
        accessorKey: "NOTIONAL",
        header: "Net Amount",
        // cell: ({ row }) => {
        //     const amount = row.original.LONGQTY !== null || row.original.SHORTQTY !== null ? row.original.NOTIONAL : row.original.NET_PLAMT;
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(amount);

        //     return (
        //         <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
        //             {formatted}
        //             {/* {row.original.SALEQTY?.toString() === "0" || row.original.BUYQTY?.toString() === "0"
        //                 ? "0"
        //                 : formatted} */}
        //         </span>
        //     );
        // },
        dtRender: function (data, type, row) {
            const rawValue = parseFloat(row.original.LONGQTY !== null || row.original.SHORTQTY !== null ? row.original.NOTIONAL : row.original.NET_PLAMT) // Make sure this is the numeric value
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
        id: "INSTRUMENT_TYPE",
        accessorKey: "INSTRUMENT_TYPE",
        header: "Instrument Type",
        deselected: true,
    },
    {
        id: "EXPIRY_DATE",
        accessorKey: "EXPIRY_DATE",
        header: "Expiry Date",
        deselected: true,
    },
    {
        id: "SCRIP_NAME",
        accessorKey: "SCRIP_NAME",
        header: "Scrip Name",
        deselected: true
    },

]

