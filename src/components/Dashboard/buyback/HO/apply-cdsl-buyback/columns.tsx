"use client"
import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type BuybackHOEntry = {
  clientId: string
  scrip: string
  branchcode: string
  quantity: number
  pledgedquantity: number
  alreadyApplied: number
  applyQuantity: number
  isin: string
  boid: string
  buybackId: number
  applied: number
  original: any
  inputs: Record<string, any>
}

const ApplyQuantity = ({ row, table }) => {
  const [localValue, setLocalValue] = useState(row.original.applied?.toString() || row.original.quantity?.toString() || "")

  const validateQuantity = (value: number) => {
    if (value > row.original.quantity) {
      toast.error(`Applied Quantity cannot exceed the free quantity. Maximum allowed: ${row.original.quantity}.`)
      return false
    }
    return true
  }

  // Use useEffect to handle value changes and prevent recursive updates
  useEffect(() => {
    setLocalValue(row.original.applied?.toString() || row.original.quantity?.toString() || "")
  }, [row.original.applied, row.original.quantity, row.original.unpledgedQuantity])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setLocalValue(e.target.value)

    // Debounce the validation and update to prevent excessive re-renders
    const timer = setTimeout(() => {
      if (validateQuantity(newValue)) {
        table.options.meta?.updateData(row.index, "quantity", newValue, "applied")
      }
    }, 300)

    return () => clearTimeout(timer)
  }

  return (
    <Input
      id="quantity"
      name="quantity"
      type="number"
      placeholder="Quantity"
      value={localValue}
      onChange={handleChange}
      onBlur={(e) => {
        const newValue = Number(e.target.value)
        if (validateQuantity(newValue)) {
          table.options.meta?.updateData(row.index, "applyQuantity", newValue)
          // Update the applied field as well
          table.options.meta?.updateData(row.index, "applied", newValue)
        } else {
          setLocalValue(row.original.applied?.toString() || "")
        }
      }}
    />
  )
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<BuybackHOEntry>[] = [
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
    id: "scrip",
    accessorKey: "scrip",
    header: "Scrip Name",
    hidden: true
  },
  {
    id: "branchcode",
    accessorKey: "branchcode",
    header: "Branch Code",
  },
  {
    id: "boidinp",
    accessorKey: "boid",
    header: "BOID",
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: "Free Quantity",
  },
  {
    id: "pledgedquantity",
    accessorKey: "pledgedquantity",
    header: "Pledged",
  },
  {
    id: "alreadyApplied",
    accessorKey: "alreadyApplied",
    header: "Already Applied",
  },
  {
    id: "applyQuantityInp",
    accessorKey: "quantity",
    header: "Apply",
    // cell: ({ row, table }) => {
    //   return <ApplyQuantity row={row} table={table} />
    // },
  },
  {
    id: "isin",
    accessorKey: "isin",
    header: "ISIN",
    hidden: true
  },
]

