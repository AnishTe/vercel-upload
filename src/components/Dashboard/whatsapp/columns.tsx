import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns";


declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MailBounceCount = {
    updatedTime: any;
    createdTime: any;
    clientId: string
    count: number
}

export const columns: ColumnDef<MailBounceCount>[] = [
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
        id: "mobileNo",
        accessorKey: "mobileNo",
        header: "Mobile No",
    },
    {
        id: "message",
        accessorKey: "message",
        header: "Message",
    },
    {
        id: "messageType",
        accessorKey: "messageType",
        header: "Message Type",
    },
    {
        id: "ownMsgStatus",
        accessorKey: "ownMsgStatus",
        header: "Own Message Status",
    },
    {
        id: "whMsgStatus",
        accessorKey: "whMsgStatus",
        header: "WhatsApp Message Status",
    },
    {
        id: "reason",
        accessorKey: "reason",
        header: "Error",
    },
    {
        id: "createdTime",
        accessorKey: "createdTime",
        header: "Created Time",
        cell: ({ row }) => {
            const value = row.original.createdTime;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },

    },
    {
        id: "updatedTime",
        accessorKey: "updatedTime",
        header: "Updated Time",
        cell: ({ row }) => {
            const value = row.original.updatedTime;
            return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
        },
    }
]



