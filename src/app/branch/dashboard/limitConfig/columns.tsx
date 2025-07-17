import type { ColumnDef } from "@tanstack/react-table"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type LimitConfig = {
  id: string
  clientId: string
  clientType: "FAMILY" | "INDIVIDUAL"
  activeStatus: "ACTIVE" | "INACTIVE"
  applyToCash: string | number
  applyToFo: string | number
  applyToMcx: string | number
  applyToCds: string | number
  original: any
}

// Helper function to standardize the check/x rendering
const renderBooleanCell = (value: string | number) => {
  // Handle both string and number values
  const normalizedValue = typeof value === "string" ? Number.parseInt(value, 10) : value
  const isActive = normalizedValue === 1

  return (
    <div className="">
      <div
        className={`
          relative flex items-center justify-center w-8 h-8 rounded-full 
          ${isActive
            ? "bg-green-100 text-green-600 border border-green-300"
            : "bg-red-100 text-red-600 border border-red-300"
          }
          transition-all duration-200 hover:scale-110 group
        `}
        title={isActive ? "Active" : "Inactive"}
      >
        {isActive ? (
          <Check className="h-4 w-4 transition-transform group-hover:scale-110" />
        ) : (
          <X className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
        {/* <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-1000">
          {isActive ? "Enabled" : "Disabled"}
        </span> */}
      </div>
    </div>
  )
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<LimitConfig>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.original.clientId}</div>,
  },
  {
    id: "clientType",
    accessorKey: "clientType",
    header: "Client Type",
    cell: ({ row }) => <div className="font-medium">{row.original.clientType}</div>,
  },
  {
    id: "applyToCash",
    accessorKey: "applyToCash",
    header: "Cash",
    cell: ({ row }) => renderBooleanCell(row.original.applyToCash),
  },
  {
    id: "applyToFo",
    accessorKey: "applyToFo",
    header: "FO",
    cell: ({ row }) => renderBooleanCell(row.original.applyToFo),
  },
  {
    id: "applyToMcx",
    accessorKey: "applyToMcx",
    header: "MCX",
    cell: ({ row }) => renderBooleanCell(row.original.applyToMcx),
  },
  {
    id: "applyToCds",
    accessorKey: "applyToCds",
    header: "CDS",
    cell: ({ row }) => renderBooleanCell(row.original.applyToCds),
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
          className={
            status === "ACTIVE"
              ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800"
              : "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"
          }
        >
          {status}
        </Badge>
      )
    },
  },
]
