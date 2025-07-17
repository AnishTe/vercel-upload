"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type ApplicableIsinMarginPledge = {
  id: number
  symbol: string
  securityName: string
  isin: string
  activeStatus: "ACTIVE" | "INACTIVE"
  original: any
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
  dtRender?: any
}

export const columns: CustomColumnDef<ApplicableIsinMarginPledge>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
    hidden: true,
  },
  {
    id: "symbol",
    accessorKey: "symbol",
    header: "Symbol",
  },
  {
    id: "securityName",
    accessorKey: "securityName",
    header: "Security Name",
    cell: ({ row }) => {
      const securityName = row.original.securityName
      return (
        <div className="font-medium text-gray-700 max-w-[250px] truncate" title={securityName}>
          {securityName}
        </div>
      )
    },
  },
  {
    id: "isin",
    accessorKey: "isin",
    header: "ISIN",
    cell: ({ row }) => {
      const isin = row.original.isin
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors">
          {isin}
        </div>
      )
    },
  },
  {
    id: "activeStatus",
    accessorKey: "activeStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.activeStatus as "ACTIVE" | "INACTIVE"
      return (
        <div className="flex items-center space-x-1.5">
          <Badge
            variant={status === "ACTIVE" ? "default" : "secondary"}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
              ${
                status === "ACTIVE"
                  ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                  : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
              }
            `}
          >
            {status}
          </Badge>
        </div>
      )
    },
  },
]
