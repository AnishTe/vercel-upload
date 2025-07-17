import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type OngoingBuybackConfig = {
  original: any
  buybackid: number
  scrip: string
  buybackprice: number | string
  isin: string
  fromdate: Date | string | null
  todate: Date | string | null
  activestatus: "ACTIVE" | "INACTIVE"
  nsesettno: string
  bsesettno: string
  cdslOrders: number
  nsdlOrders: number
  nsescripcode: string
  bsescripcode: string
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  dtRender?: any
  hidden?: boolean
}

export const columns: CustomColumnDef<OngoingBuybackConfig>[] = [
  {
    id: "buybackid",
    accessorKey: "buybackid",
    header: "ID",
  },
  {
    id: "scrip",
    accessorKey: "scrip",
    header: "Scrip",
  },
  {
    id: "nsescripcode",
    accessorKey: "nsescripcode",
    header: "NSE Scrip Code",
  },
  {
    id: "bsescripcode",
    accessorKey: "bsescripcode",
    header: "BSE Scrip Code",
    deselected: true,
  },
  {
    id: "buybackprice",
    accessorKey: "buybackprice",
    header: "Buyback Price",
    // cell: ({ row }) => {
    //   const price =
    //     typeof row.original.buybackprice === "string"
    //       ? Number.parseFloat(row.original.buybackprice)
    //       : (row.original.buybackprice as number)

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
    }
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
        ? new Date(value as string | Date).toLocaleString("en-US", {
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
        ? new Date(value as string | Date).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
        : "-"
    },
  },
  {
    id: "cdslOrders",
    accessorKey: "cdslOrders",
    header: "CDSL Order Count",
  },
  {
    id: "nsdlOrders",
    accessorKey: "nsdlOrders",
    header: "NSDL Order Count",
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
  },

  {
    id: "nsesettno",
    accessorKey: "nsesettno",
    header: "NSE Settlement No",
  },
  {
    id: "bsesettno",
    accessorKey: "bsesettno",
    header: "BSE Settlement No",
  },
]

