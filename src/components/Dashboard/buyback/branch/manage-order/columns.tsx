import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge"

export type BuybackBranchModify = {
  orderStatus: any;
  id: number
  clientId: string
  boid: string
  isin: string
  branchcode: string
  quantity: number
  applied: number
  appliedDate: string
  onDelete?: (order: BuybackBranchModify) => void
  original: any
  inputs: Record<string, any>
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<BuybackBranchModify>[] = [
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
    hidden: true
  },
  {
    id: "branchcode",
    accessorKey: "branchcode",
    header: "Branch Code",
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: "Total Quantity",
  },
  {
    id: "applied",
    accessorKey: "applied",
    header: "Applied Quantity",
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

      // Handle specific status values
      if (statusLower === "processed") {
        badgeClass = "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
      } else if (statusLower === "applied") {
        badgeClass = "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
      } else if (statusLower === "cancelled") {
        badgeClass = "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
      } else {
        badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
      }

      return <Badge className={badgeClass}>{status}</Badge>
    },
  },
  {
    id: "appliedDate",
    accessorKey: "appliedDate",
    header: "Time",
    cell: ({ row }) => {
      const value = row.original.appliedDate;
      return value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
    },
  },
  // {
  //   id: "actions",
  //   header: "Actions",
  //   cell: ({ row }) => (
  //     <Button
  //       variant="destructive"
  //       size="sm"
  //       onClick={() => row.original.onDelete && row.original.onDelete(row.original)}
  //       disabled={!row.original.onDelete}
  //     >
  //       Delete
  //     </Button>
  //   ),
  // },
]

