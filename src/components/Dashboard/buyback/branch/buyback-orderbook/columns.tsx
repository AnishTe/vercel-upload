"use client"

import type { ColumnDef } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type BuybackOrderBookDetailsBranch = {
  clientId: string
  scrip: string
  branchcode: string
  quantity: number
  isin: string
  boid: string
  dpid: string
  dp: number
}

export const columns: ColumnDef<BuybackOrderBookDetailsBranch>[] = [
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
    header: "Quantity",
  },
  {
    id: "dp",
    accessorKey: "dp",
    header: "DP",
  },
]

