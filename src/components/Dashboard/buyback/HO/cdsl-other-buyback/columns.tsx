"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type CDSLOtherBuybackOrdersHO = {
  orderType: string;
  orderStatus: any;
  id: number
  isin: string
  branchcode: string
  clientId: string
  dpid: string
  boid: string
  quantity: number
  appliedDate: string
  original: any
  onDelete?: (order: CDSLOtherBuybackOrdersHO) => void
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<CDSLOtherBuybackOrdersHO>[] = [
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
    id: "clientId",
    accessorKey: "clientId",
    header: "Client ID",
    cell: ({ row }) => {
      const value = row.original.clientId ?? "-";
      return <div className="font-medium">{value}</div>;
    }
  },
  {
    id: "orderType",
    accessorKey: "orderType",
    header: "Depository",
    cell: ({ row }) => {
      const orderType = row.original.orderType as string
      {

        if (orderType === "CDSL OTHER") {
          return "CDSL";
        } else if (orderType === "NSDL OTHER") {
          return "NSDL";
        }

        return orderType;
      }
    },
  },
  {
    id: "dpid",
    accessorKey: "dpid",
    header: "DPID",
  },
  {
    id: "boid",
    accessorKey: "boid",
    header: "BOID",
  },
  {
    id: "quantity",
    accessorKey: "quantity",
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

