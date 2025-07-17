import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"

export type EPNRecordsEntry = {
    id: any
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
    deselected?: boolean
    hidden?: boolean
    dtRender?: any
}

export const columns: CustomColumnDef<EPNRecordsEntry>[] = [
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
        id: "boid",
        accessorKey: "boid",
        header: "BOID",
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
        cell: ({ row }) => {
            return (
                <Button
                    variant="link"
                    className="p-0 h-auto font-normal action-btn"
                    data-action="isinOpen"
                    data-id={`${row.original.isin} || ''`}
                >
                    {row.original.isin}
                </Button>
            )
        },
    },
    {
        id: "scrip",
        accessorKey: "scrip",
        header: "Scrip Name",
    },
    {
        id: "free_balance_quantity",
        accessorKey: "free_balance_quantity",
        header: "Free Quantity",
    },
    {
        id: "current_balance_quantity",
        accessorKey: "current_balance_quantity",
        header: "Current Quantity",
    },
    {
        id: "holdingValuation",
        accessorKey: "holdingValuation",
        header: "Holding Valuation",
    },
    {
        id: "pledged_balance_quantity",
        accessorKey: "pledged_balance_quantity",
        header: "Pledged Quantity",
    },
    {
        id: "locked_in_balance_quantity",
        accessorKey: "locked_in_balance_quantity",
        header: "Locked In Quantity",
    },
    {
        id: "earmarked_balance_quantity",
        accessorKey: "earmarked_balance_quantity",
        header: "Earmarked Quantity",
    },
    {
        id: "avl_balance_quantity",
        accessorKey: "avl_balance_quantity",
        header: "Available Quantity",
        hidden: true,
    },
    // {
    //     id: "lend_balance_quantity",
    //     accessorKey: "lend_balance_quantity",
    //     header: "Lend Balance Quantity",
    // },
    // {
    //     id: "borrow_balance_quantity",
    //     accessorKey: "borrow_balance_quantity",
    //     header: "Borrow Balance Quantity",
    // },
    // {
    //     id: "safe_keep_balance",
    //     accessorKey: "safe_keep_balance",
    //     header: "Safe Keep Balance",
    // },
]

export const isinColumns: ColumnDef<EPNRecordsEntry>[] = [
    {
        id: "symbol",
        accessorKey: "symbol",
        header: "Symbol",
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
    },
    {
        id: "scrip",
        accessorKey: "scrip",
        header: "Scrip Name",
    },
    {
        id: "VarMarginPercentage",
        accessorKey: "VarMarginPercentage",
        header: "Var Margin Percentage",
    },
    {
        id: "isOngoingBuyback",
        accessorKey: "isOngoingBuyback",
        header: "Is Ongoing Buyback",
    },
    {
        id: "VarMarginFound",
        accessorKey: "VarMarginFound",
        header: "Var Margin Found",
    },
    {
        id: "isApplicableForPledge",
        accessorKey: "isApplicableForPledge",
        header: "Is Applicable For Pledge",
    },
]

