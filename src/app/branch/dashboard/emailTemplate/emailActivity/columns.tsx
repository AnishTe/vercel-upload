import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"

export type EPNRecordsEntry = {
    [x: string]: any
    attachment: any
    status: any
    datetime: string | number | Date
    symbol: string
    clientId: string
    quantity: number
    boid: string
    isin: string
    tradeDate: string
    createdTime: string
    lastUpdatedTime: string
}

export type CustomColumnDef<T> = ColumnDef<T> & {
    dtRender?: any
}

export const columns: CustomColumnDef<EPNRecordsEntry>[] = [
    {
        id: "client/branch_ID",
        header: "Client/Branch ID",
        cell: ({ row }) => {
            const branchId = row.original.branch
            const clientId = row.original.client_id
            if (clientId) return `C-${clientId}`
            if (branchId) return `B-${branchId}`
            return "-"
        }
    },
    {
        id: "template_name",
        accessorKey: "template_name",
        header: "Template Name",
    },
    {
        id: "email",
        accessorKey: "email",
        header: "Email",
    },
    {
        id: "datetime",
        accessorKey: "datetime",
        header: "Date Time",
        // cell: ({ row }) => {
        //     const date = new Date(row.original.datetime)
        //     return date.toLocaleString("en-IN", {
        //         day: "2-digit",
        //         month: "2-digit",
        //         year: "numeric",
        //         hour: "2-digit",
        //         minute: "2-digit",
        //         second: "2-digit",
        //         hour12: true,
        //     })
        // },
        dtRender: function (data, type, row, meta) {
            // Normalize the date string (replace space with 'T' for ISO format)
            const dateStr = typeof data === "string" ? data.replace(" ", "T") : data;
            const date = new Date(dateStr);

            if (type === "display") {
                return `
                    <span data-order="${date.getTime()}" data-search="${date.toISOString()}">
                        ${date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })}
                    </span>`;
            }

            if (type === "sort" || type === "type") {
                return date.getTime();
            }

            return data;
        }

    },
    {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status
            return (
                <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${status === "PROCESSED"
                            ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                            : status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                        }`}
                >
                    {String(status)}
                </div>
            )
        },
    },
    {
        id: "attachment",
        accessorKey: "attachment",
        header: "Attachment",
        cell: ({ row }) => {
            const attachment = row.original.attachment

            if (!attachment) {
                return <span className="text-gray-500">No attachment</span>
            }

            return (
                <Button variant="outline" className="action-btn" data-action="atchbtn">
                    Download
                </Button>
            )
        },
    },
]

