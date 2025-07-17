import { ColumnDef } from "@tanstack/react-table"

type CustomColumnDef<T> = ColumnDef<T> & {
    disabled?: boolean
    dtRender?: any
}

export type GlobalReportEntry = {
    FULL_SCRIP_SYMBOL: string
    OSQTY: number
    OSRATE: number
    OSAMT: number
    BQTY: number
    BRATE: number
    BAMT: number
    SQTY: number
    SRATE: number
    SAMT: number
}

export const columns: CustomColumnDef<GlobalReportEntry>[] = [
    {
        id: "FULL_SCRIP_SYMBOL",
        accessorKey: "FULL_SCRIP_SYMBOL",
        header: "Scrip Symbol",
        disabled: true,

    },
    // {
    //     id: "OSQTY",
    //     accessorKey: "OSQTY",
    //     header: "OSQTY",
    // },
    // {
    //     id: "OSRATE",
    //     accessorKey: "OSRATE",
    //     header: "OSRATE",
    // },
    // {
    //     id: "OSAMT",
    //     accessorKey: "OSAMT",
    //     header: "OSAMT",
    // },

    {
        id: "BQTY",
        accessorKey: "BQTY",
        header: "Buy Quantity",
    }, {
        id: "BRATE",
        accessorKey: "BRATE",
        header: "Buy Rate",
    },
    {
        id: "BAMT",
        accessorKey: "BAMT",
        header: "Buy Amount",
        // cell: ({ row }) => {
        //     const amount = parseFloat(row["BAMT"])
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
        },
    },
    {
        id: "SQTY",
        accessorKey: "SQTY",
        header: "Sell Quantity",
    },

    {
        id: "SRATE",
        accessorKey: "SRATE",
        header: "Sell Rate",
    },
    {
        id: "SAMT",
        accessorKey: "SAMT",
        header: "Sell Amount",
        // cell: ({ row }) => {
        //     const amount = parseFloat(row["SAMT"])
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
        },
    },
]