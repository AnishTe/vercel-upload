import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type OngoingRightsIssueConfig = {
  rightsissueid: number
  scrip: string
  price: number
  isin: string
  fromdate: Date | string
  todate: Date | string
  activestatus: "ACTIVE" | "INACTIVE"
}

type CustomColumnDef<T> = ColumnDef<T> & {
  dtRender?: any
  disabled?: boolean
}

export const columns: CustomColumnDef<OngoingRightsIssueConfig>[] = [
  {
    id: "rightsissueid",
    accessorKey: "rightsissueid",
    header: "ID",
  },
  {
    id: "scrip",
    accessorKey: "scrip",
    header: "Scrip",
  },
  {
    id: "price",
    accessorKey: "price",
    header: "Price",
    // cell: ({ row }) => {
    //   const price = Number.parseFloat(row.original.price.toString())
    //   const formatted = new Intl.NumberFormat("en-IN", {
    //     style: "currency",
    //     currency: "INR",
    //   }).format(price)
    //   return <div className="font-medium">{formatted}</div>
    // },
    dtRender: function (data, type, row) {
      const rawValue = parseFloat(data) // Make sure this is the numeric value
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(rawValue)

      if (type === 'display') {
        return `<span data-sort="${rawValue}">${formatted}</span>`
      }

      return rawValue
    },
  },
  {
    id: "isin",
    accessorKey: "isin",
    header: "ISIN",
  },
  {
    id: "fromdate",
    accessorKey: "fromdate",
    header: "From Date",
    cell: ({ row }) => {
      const value = row.original.fromdate
      return value
        ? new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
        : "-"
    },
  },
  {
    id: "todate",
    accessorKey: "todate",
    header: "To Date",
    cell: ({ row }) => {
      const value = row.original.todate
      return value
        ? new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
        : "-"
    },
  },
  {
    id: "activestatus",
    accessorKey: "activestatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.activestatus as "ACTIVE" | "INACTIVE"
      return (
        <Badge
          variant={status === "ACTIVE" ? "default" : "secondary"}
          className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${status === "ACTIVE"
              ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
              : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
            }
          `}
        >
          {status}
        </Badge>
      )
    },
  }
]

