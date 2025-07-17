import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns";

export type EPNRecordsEntry = {
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
        id: "symbol",
        accessorKey: "symbol",
        header: "Symbol",
    },
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
        id: "quantity",
        accessorKey: "quantity",
        header: "Quantity",
    },

    {
        id: "tradeDate",
        accessorKey: "tradeDate",
        header: "Trade Date",
    },

    {
        id: "createdTime",
        accessorKey: "createdTime",
        header: "Created Date",
        cell: ({ row }) => {
            const value = row.original.createdTime;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
    },
    {
        id: "lastUpdatedTime",
        accessorKey: "lastUpdatedTime",
        header: "Last Updated Date",
        cell: ({ row }) => {
            const value = row.original.lastUpdatedTime;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
    },
    // {
    //     id: "lastUpdatedTime",
    //     accessorKey: "lastUpdatedTime",
    //     header: "Last Updated Date",
    // cell: ({ row }) => {
    //     const value = row.original.lastUpdatedTime;
    //     return value ? new Date(value).toLocaleString("en-US", {
    //         year: "numeric",
    //         month: "short",
    //         day: "numeric",
    //         hour: "2-digit",
    //         minute: "2-digit",
    //         second: "2-digit",
    //         hour12: false,
    //     }) : "-";
    // },
    // }

]