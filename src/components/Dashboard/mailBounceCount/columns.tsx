import type { ColumnDef } from "@tanstack/react-table"
declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MailBounceCount = {
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
        id: "message_count",
        accessorKey: "message_count",
        header: "Count",
    }
]



