import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"

declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MailBounceCount = {
    client_id: string
    nse_ucc_created_date: any
    bse_ucc_created_date: any
    clientId: string
    count: number
}

export const columns: ColumnDef<MailBounceCount>[] = [
    {
        id: "client_id",
        accessorKey: "client_id",
        header: "Client ID",
        cell: ({ row }) => {
            const value = row.original.client_id ?? "-";
            return <div className="font-medium">{value}</div>;
        }
    },
    {
        id: "client_name",
        accessorKey: "client_name",
        header: "Client Name",
    },
    {
        id: "boid",
        accessorKey: "boid",
        header: "BOID",
    },
    {
        id: "default_acc",
        accessorKey: "default_acc",
        header: "Default Account",
    },
    {
        id: "bse_ucc_status",
        accessorKey: "bse_ucc_status",
        header: "BSE UCC Status",
    },
    {
        id: "bse_ucc_pan_status",
        accessorKey: "bse_ucc_pan_status",
        header: "BSE UCC PAN Status",
    },
    {
        id: "bse_ucc_created_date",
        accessorKey: "bse_ucc_created_date",
        header: "BSE UCC Created Date",
        cell: ({ row }) => {
            const value = row.original.bse_ucc_created_date;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
    },
    {
        id: "nse_ucc_status",
        accessorKey: "nse_ucc_status",
        header: "NSE UCC Status",
    },
    {
        id: "nse_ucc_pan_status",
        accessorKey: "nse_ucc_pan_status",
        header: "NSE UCC PAN Status",
    },
    {
        id: "nse_ucc_created_date",
        accessorKey: "nse_ucc_created_date",
        header: "NSE UCC Created Date",
        cell: ({ row }) => {
            const value = row.original.nse_ucc_created_date;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
    }


]



