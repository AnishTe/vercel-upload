import type { ColumnDef } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MailBounceLog = {
    message: string
    clientId: string
    mobile: string
    wh_msgstatus: string
    wh_errmsg: string
    last_updated_time: string


}

export const columns: ColumnDef<MailBounceLog>[] = [
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
        id: "mobile",
        accessorKey: "mobile",
        header: "Mobile",
    },
    {
        id: "message",
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => {
            return (
                <div className="max-w-[400px] max-h-[80px] whitespace-normal break-words overflow-y-auto">
                    {row.original.message}
                </div>
            );
        }
    },

    {
        id: "wh_msgstatus",
        accessorKey: "wh_msgstatus",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.wh_msgstatus;
            return (
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                    {String(status)}
                </div>
            )
        }
    },

    {
        id: "wh_errmsg",
        accessorKey: "wh_errmsg",
        header: "Error Message",
        cell: ({ row }) => {
            const value = row.original.wh_errmsg;
            return value == "NA_" ? "" : value;
        },



    },
    {
        id: "last_updated_time",
        accessorKey: "last_updated_time",
        header: "Last Updated At",
        cell: ({ row }) => {
            const timestamp = new Date(row.original.last_updated_time);
            const day = String(timestamp.getDate()).padStart(2, '0');
            const month = timestamp.toLocaleString('default', { month: 'short' }); // Get abbreviated month
            const year = timestamp.getFullYear();

            let hours = timestamp.getHours();
            const minutes = String(timestamp.getMinutes()).padStart(2, '0');
            const seconds = String(timestamp.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12; // Convert to 12-hour format
            const hours1 = hours ? String(hours).padStart(2, '0') : '12'; // the hour '0' should be '12'

            return `${day}-${month}-${year} ${hours1}:${minutes}:${seconds} ${ampm}`;
        },

    }
]

