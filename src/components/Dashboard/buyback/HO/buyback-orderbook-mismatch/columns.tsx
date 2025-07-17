"use client"

import type { ColumnDef } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type BuybackOrderBookMismatch = {
  branchcode: string
  clientId: string
  boid: string
  applied: number
  orderbookQuantity: number
  difference: number
}

export const columns: ColumnDef<BuybackOrderBookMismatch>[] = [
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
    id: "boid",
    accessorKey: "boid",
    header: "BOID",
  },
  {
    id: "applied",
    accessorKey: "applied",
    header: "Applied Quantity",
  },
  {
    id: "orderbookQuantity",
    accessorKey: "orderbookQuantity",
    header: "Orderbook Quantity",
  },
  {
    id: "difference",
    accessorKey: "difference",
    header: "Difference",
    cell: ({ row }) => {
      const value = row.original.difference as number
      let colorClass = ""

      if (value < 0) {
        colorClass = "text-red-700"
      } else if (value > 0) {
        colorClass = "text-red-700"
      } else {
        colorClass = ""
      }

      return <div className={colorClass}>{value}</div>
    },
  },
]

