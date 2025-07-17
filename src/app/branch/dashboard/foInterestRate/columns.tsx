import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type FoInterestRate = {
  id: any
  clientId: string
  segment: string
  rate: number
  clientType: "FAMILY" | "INDIVIDUAL"
  activeStatus: "ACTIVE" | "INACTIVE"
  original: any
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
  dtRender?: any
}

export const columns: CustomColumnDef<FoInterestRate>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
    hidden: true,
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
    id: "clientType",
    accessorKey: "clientType",
    header: "Client Type",
    cell: ({ row }) => <div className="font-medium">{row.original.clientType}</div>,
  },
  {
    id: "segment",
    accessorKey: "segment",
    header: "Segment",
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.original.segment}
        </div>
      )
    },
  },
  // {
  //   id: "rate",
  //   accessorKey: "rate",
  //   header: "Interest Rate (%)",
  //   dtRender: function (data, type, row) {
  //     const rawValue = parseFloat(data) // Make sure this is the numeric value
  //     const formatted = new Intl.NumberFormat('en-IN', {
  //       style: 'currency',
  //       currency: 'INR'
  //     }).format(rawValue)

  //     if (type === 'display') {
  //       return `<span data-sort="${rawValue}">${formatted}</span>`
  //     }

  //     return rawValue
  //   },
  // },
  {
    id: "rate",
    accessorKey: "rate",
    header: "Interest Rate (%)",
    dtRender: function (data, type, row) {
      const rawValue = parseFloat(data) // Make sure this is the numeric value

      // Format as a number with 2 decimal places, no currency symbol and no percentage
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(rawValue)

      if (type === 'display') {
        return `<span data-sort="${rawValue}">${formatted}</span>`
      }

      return rawValue
    },
  },
  {
    id: "activeStatus",
    accessorKey: "activeStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.activeStatus as "ACTIVE" | "INACTIVE"
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
]
