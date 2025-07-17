import { ColumnDef } from "@tanstack/react-table"

export type CustomColumnDef<T> = ColumnDef<T> & {
    deselected?: boolean,
    amountToBe?: boolean,
    dtRender?: any
}

export type GlobalReportEntry = {
    SCRIP_SYMBOL: string
    COMPANY_CODE: string
    COMPCODE: string
    EXPIRY_DATE1: string
    TRADING_QUANTITY: number
    TRADING_AMOUNT: number
    BUY_QUANTITY: number
    BUY_RATE: number
    BUY_AMOUNT: number
    SALE_QUANTITY: number
    SALE_RATE: number
    SALE_AMOUNT: number
    NET_QUANTITY: number
    NET_RATE: number
    NET_AMOUNT: number
    CLOSING_PRICE: number
    NOT_PROFIT: number
}

export const columns: CustomColumnDef<GlobalReportEntry>[] = [
    {
        id: "SCRIP_SYMBOL",
        accessorKey: "SCRIP_SYMBOL",
        header: "Scrip Symbol",
        cell: ({ row }) => {
            // const date = new Date(row.original.EXPIRY_DATE1); // Format the date here
            return (
                <div className="flex flex-col">
                    <span>{row.original.SCRIP_SYMBOL}</span>
                    {/* <span className="text-xs text-muted-foreground">
                        Company Code: {row.original.COMPANY_CODE}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        COMPCODE: {row.original.COMPCODE}
                    </span> */}
                    {/* <span className="text-xs text-muted-foreground">
                        Date:{" "}
                        {date.toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                        })}
                    </span> */}
                </div>
            );
        },
    },
    {
        id: "COMPANY_CODE",
        accessorKey: "COMPANY_CODE",
        header: "Company Code",
        deselected: true,
    },
    {
        id: "COMPCODE",
        accessorKey: "COMPCODE",
        header: "COMPCODE",
        deselected: true,
    },
    {
        id: "TRADING_QUANTITY",
        accessorKey: "TRADING_QUANTITY",
        header: "Opening Quantity",
    },
    {
        id: "TRADING_AMOUNT",
        accessorKey: "TRADING_AMOUNT",
        header: "Opening Amount",
        amountToBe: true,
        // cell: ({ row }) => {
        //     const amount = parseFloat(row.original.TRADING_AMOUNT.toString())
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR"
        //     }).format(amount)
        //     return formatted
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
        id: "BUY_QUANTITY",
        accessorKey: "BUY_QUANTITY",
        header: "Buy Quantity",
    }, {
        id: "BUY_RATE",
        accessorKey: "BUY_RATE",
        header: "Buy Rate",
    },
    {
        id: "BUY_AMOUNT",
        accessorKey: "BUY_AMOUNT",
        header: "Buy Amount",
        amountToBe: true,
        // cell: ({ row }) => {
        //     const amount = parseFloat(row.original.BUY_AMOUNT.toString())
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR"
        //     }).format(amount)
        //     return formatted
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
        amountToBe: true,
        // cell: ({ row }) => {
        //     const amount = parseFloat(row.original.SALE_AMOUNT.toString())
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR"
        //     }).format(amount)
        //     return formatted
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
        amountToBe: true,
        // cell: ({ row }) => {
        //     const amount = row.original.NET_AMOUNT;
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(amount);
        //     return (
        //         <span
        //             className={`flex ${amount >= 0 ? "text-green-600" : "text-red-600"}`}
        //         >
        //             {formatted}
        //         </span>
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
    },

    {
        id: "CLOSING_PRICE",
        accessorKey: "CLOSING_PRICE",
        header: "Closing Price",
        amountToBe: true,
    },
    {
        id: "NOT_PROFIT",
        accessorKey: "NOT_PROFIT",
        header: "Net Profit",
        amountToBe: true,
        // cell: ({ row }) => {
        //     const amount = row.original.NOT_PROFIT;
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
        //     }).format(amount);
        //     return (
        //         <span
        //             className={amount >= 0 ? "text-green-600" : "text-red-600"}
        //         >
        //             {formatted}
        //         </span>
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
    },


]
