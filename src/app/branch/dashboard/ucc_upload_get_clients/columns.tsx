import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MailBounceCount = {
    bse_ucc_reason: string
    nse_ucc_reason: string
    bse_ucc_status: string
    nse_ucc_status: string
    client_id: string
    count: number
}

export const columns: ColumnDef<MailBounceCount>[] = [

    {
        id: "client_id",
        accessorKey: "client_id",
        header: "ClientID",
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
    // {
    //     id: "default_acc",
    //     accessorKey: "default_acc",
    //     header: "DP Default Account",
    // },
    {
        id: "bse_upload",
        header: "BSE Upload",
        cell: ({ row }) => {
            const clientId = row.original.client_id;

            // 👉 Don't render anything if client_id is missing
            if (!clientId) return null;

            return (
                <Button
                    className="action-btn"
                    data-action="handleBseUpload"
                    data-id={clientId}
                    disabled={row.original.bse_ucc_status === "SUCCESS"}
                >
                    Upload
                </Button>
            );
        },
    },
    {
        id: "bse_ucc_status",
        accessorKey: "bse_ucc_status",
        header: "BSE UCC Upload Status",
    },
    {
        id: "bse_ucc_reason",
        accessorKey: "bse_ucc_reason",
        header: "BSE Upload Status/Reason",
        cell: ({ row }) => {
            return (
                <div className="max-w-[400px] max-h-[80px] whitespace-normal break-words overflow-y-auto">
                    {row.original.bse_ucc_reason}
                </div>
            );
        }
    },
    {
        id: "bse_ucc_pan_status",
        accessorKey: "bse_ucc_pan_status",
        header: "BSE UCC PAN Status",
    },
    {
        id: "nse_upload",
        header: "NSE Upload",
        cell: ({ row }) => {
            const clientId = row.original.client_id;

            // 👉 Don't render anything if client_id is missing
            if (!clientId) return null;

            return (
                <Button
                    className="action-btn"
                    data-action="handleNseUpload"
                    data-id={`${row.original.client_id} || ''`}
                    // disabled={!row.original.nse_ucc_status.includes("SUCCESS")}
                    disabled={row.original.nse_ucc_status?.includes("SUCCESS")}
                >
                    Upload</Button>
            );
        },
    },
    {
        id: "nse_ucc_status",
        accessorKey: "nse_ucc_status",
        header: "NSE UCC Upload Status",
    },

    {
        id: "nse_ucc_reason",
        accessorKey: "nse_ucc_reason",
        header: "NSE Upload Status/Reason",
        cell: ({ row }) => {
            return (
                <div className="max-w-[400px] max-h-[80px] whitespace-normal break-words overflow-y-auto">
                    {row.original.nse_ucc_reason}
                </div>
            );
        }
    },
    {
        id: "nse_ucc_pan_status",
        accessorKey: "nse_ucc_pan_status",
        header: "NSE UCC PAN Status",
    },


]



