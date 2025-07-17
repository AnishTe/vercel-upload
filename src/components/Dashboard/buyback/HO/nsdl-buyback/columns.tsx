"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type NSDLBuybackOrdersHO = {
  id: number
  isin: string
  branchcode: string
  clientId: string
  dpid: string
  boid: string
  quantity: number
  appliedDate: string
  original: any
  onDelete?: (order: NSDLBuybackOrdersHO) => void
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<NSDLBuybackOrdersHO>[] = [
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

