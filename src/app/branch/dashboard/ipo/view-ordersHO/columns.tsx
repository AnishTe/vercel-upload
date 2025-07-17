import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export type Order = {
    id: string
    companyname: string
    clientId: string
    pan: string
    dpid: string
    boid: string
    category: string
    formType: string
    applicationno: string
    applicationstatus: string
    bseStatus: string
    lotsapplied: string
    upiid: string
    investmentamount: string
    issueprice: string
    orderId: string
    appliedDate: string
    onDelete: (order: Order) => void
}

export type CustomColumnDef<T> = ColumnDef<T> & {
    dtRender?: any
}

export const columns: CustomColumnDef<Order>[] = [
    {
        id: "companyname",
        accessorKey: "companyname",
        header: "Company Name",
    },
    {
        id: "clientId",
        accessorKey: "clientId",
        header: "Client ID",
        cell: ({ row }) => {
            const value = row.original.clientId ?? "-";
            return <span>{value}</span>;
        }
    },
    {
        id: "pan",
        accessorKey: "pan",
        header: "PAN",
    },
    {
        id: "applicationno",
        accessorKey: "applicationno",
        header: "Application No",
    },
    {
        id: "applicationstatus",
        accessorKey: "applicationstatus",
        header: "Status",
    },
    {
        id: "lotsapplied",
        accessorKey: "lotsapplied",
        header: "Lot Applied",
    },
    {
        id: "investmentamount",
        accessorKey: "investmentamount",
        header: "Investment Amount",
        // cell: ({ row }) => {
        //     // const amount = Number.parseFloat(row.getValue("investmentamount"))
        //     const amount = Number.parseFloat(row.original.investmentamount)
        //     const formatted = new Intl.NumberFormat("en-IN", {
        //         style: "currency",
        //         currency: "INR",
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
        id: "message",
        accessorKey: "message",
        header: "Message",
    },
    {
        id: "bseStatus",
        accessorKey: "bseStatus",
        header: "Status",
    },
    {
        id: "upiid",
        accessorKey: "upiid",
        header: "UPI ID",
    },
]

