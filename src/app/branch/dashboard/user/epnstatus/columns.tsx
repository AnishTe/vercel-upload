import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type EPNRecordsEntry = {
    epnStatus: any
    symbol: string
    clientId: string
    quantity: number
    boid: string
    isin: string
    tradeDate: string
    createdTime: string
    lastUpdatedTime: string
}

export const columns: ColumnDef<EPNRecordsEntry>[] = [

    {
        id: "clientId",
        accessorKey: "clientId",
        header: "Client ID",
        cell: ({ row }) => {
            const value = row.original.clientId ?? "-";
            return <div className="font-medium">{value}</div>;
        }
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
    },
    {
        id: "symbol",
        accessorKey: "symbol",
        header: "Symbol",
    },
    {
        id: "buySell",
        accessorKey: "buySell",
        header: "Buy/Sell",
    },
    {
        id: "quantity",
        accessorKey: "quantity",
        header: "Quantity",
    },
    {
        id: "price",
        accessorKey: "price",
        header: "Price",
    },
    {
        id: "epnStatus",
        accessorKey: "epnStatus",
        header: "EPN Status",
        cell: ({ row }) => {
            const status = row.original.epnStatus

            if (!status) return "-"

            // Convert status to lowercase for case-insensitive comparison
            const statusLower = status.toLowerCase()

            let badgeClass = ""
            const badgeVariant = "default"

            // Handle specific status values
            if (statusLower === "processed") {
                badgeClass = "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
            } else if (statusLower === "applied") {
                badgeClass = "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            } else {
                badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
            }

            return <Badge className={badgeClass}>{status}</Badge>
        },
    },
    {
        id: "odinDeliveryStatus",
        accessorKey: "odinDeliveryStatus",
        header: "Margin/Delivery Status",
    },
    {
        id: "tradeDate",
        accessorKey: "tradeDate",
        header: "Trade Date",
    },
    {
        id: "tradeTime",
        accessorKey: "tradeTime",
        header: "Trade Time",
    },
]