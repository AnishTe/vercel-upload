import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge"

export type AvailableRepledgeStocksEntry = {
    boid: string
    isin: string
    clientId: string
    psn: string
    pledgedquantity: number
    amount: number
    pledgeType: string
    segment: string
    orderStatus: string
    repledgeStatus: string
    timeApplied: string
    original: any
    onDelete?: (order: AvailableRepledgeStocksEntry) => void
}

export type CustomColumnDef<T> = ColumnDef<T> & {
    deselected?: boolean
    hidden?: boolean
}

export const columns: CustomColumnDef<AvailableRepledgeStocksEntry>[] = [
    {
        id: "boid",
        accessorKey: "boid",
        header: "BOID",
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
    },
    {
        id: "clientId",
        accessorKey: "clientId",
        header: "UCC",
        cell: ({ row }) => {
            const value = row.original.clientId ?? "-";
            return <div className="font-medium">{value}</div>;
        }
    },
    {
        id: "psn",
        accessorKey: "psn",
        header: "PSN",
    },
    {
        id: "pledgedquantity",
        accessorKey: "pledgedquantity",
        header: "Pledged Quantity",
    },
    {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
    },
    {
        id: "pledgeType",
        accessorKey: "pledgeType",
        header: "Pledge Type",
        hidden: true
    },
    {
        id: "segment",
        accessorKey: "segment",
        header: "Segment",
    },
    {
        id: "orderStatus",
        accessorKey: "orderStatus",
        header: "Order Status",
        cell: ({ row }) => {
            const status = row.original.orderStatus

            if (!status) return "-"

            // Convert status to lowercase for case-insensitive comparison
            const statusLower = status.toLowerCase()

            let badgeClass = ""
            const badgeVariant = "default"

            // Handle specific status values
            if (statusLower === "cdsl success") {
                badgeClass =
                    "bg-green-50 text-green-800 hover:bg-green-200 border border-green-200 text-xs px-1.5 py-0.5 whitespace-nowrap"
            } else if (statusLower === "cdsl fail") {
                badgeClass =
                    "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-300 text-xs px-1.5 py-0.5 whitespace-nowrap"
            } else if (statusLower === "with pesb") {
                badgeClass =
                    "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs px-1.5 py-0.5 whitespace-nowrap"
            } else if (statusLower === "cancelled") {
                badgeClass =
                    "bg-red-50 text-red-800 hover:bg-red-200 border border-red-200 text-xs px-1.5 py-0.5 whitespace-nowrap"
            } else {
                badgeClass =
                    "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200 text-xs px-1.5 py-0.5 whitespace-nowrap"
            }

            return <Badge className={badgeClass}>{status}</Badge>
        },
    },
    {
        id: "repledgeStatus",
        accessorKey: "repledgeStatus",
        header: "Repledge Status",
    },
    {
        id: "timeApplied",
        accessorKey: "timeApplied",
        header: "Time",
        cell: ({ row }) => {
            const value = row.original.timeApplied;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
        // cell: ({ row }) => {
        //     const value = row.original.timeApplied;
        //     return value ? new Date(value).toLocaleString("en-US", {
        //         year: "numeric",
        //         month: "short",
        //         day: "numeric",
        //         hour: "2-digit",
        //         minute: "2-digit",
        //         second: "2-digit",
        //         hour12: true,
        //     }) : "-";
        // },
    }
]