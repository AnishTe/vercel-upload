"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export type MarginPledgeBranchEntry = {
  scriptName: string
  boID: string
  isin: string
  totalQuantity: number
  unpledgedQuantity: number
  pledgeQuantity: number
  amount: number
  segment: string
  quantity: number
  inputs: Record<string, any>
}

export const ApplyQuantity = ({ row, table }) => {
  const [localValue, setLocalValue] = useState(
    row.original.quantity?.toString() || row.original.unpledgedQuantity?.toString() || "",
  )

  const validateQuantity = (value: number) => {
    if (value > row.original.unpledgedQuantity) {
      toast.error(
        `You can't pledge more than the unpledged quantity for ${row.original.scriptName}. Maximum allowed: ${row.original.unpledgedQuantity}.`,
        { duration: 3000 },
      )
      return false
    }
    return true
  }

  // Use useEffect to handle value changes and prevent recursive updates
  useEffect(() => {
    setLocalValue(row.original.quantity?.toString() || row.original.unpledgedQuantity?.toString() || "")
  }, [row.original.quantity, row.original.unpledgedQuantity])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setLocalValue(e.target.value)

    // Debounce the validation and update to prevent excessive re-renders
    const timer = setTimeout(() => {
      if (validateQuantity(newValue)) {
        table.options.meta?.updateData(row.index, "unpledgedQuantity", newValue, "quantity")
      }
    }, 300)

    return () => clearTimeout(timer)
  }

  return (
    <Input
      name="quantity"
      id='quantity'
      type="number"
      placeholder="Pledge Quantity"
      value={localValue}
      onChange={handleChange}
      className="transition-all duration-200"
    />
  )
}

const SelectedSegment = ({ row, table }: { row: any; table: any }) => {
  const [segment, setSegment] = useState(row.original.segment || "CM")

  // Use useEffect to handle value changes and prevent recursive updates
  useEffect(() => {
    setSegment(row.original.segment || "CM")
  }, [row.original.segment])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setSegment(newValue)
    table.options.meta?.updateData(row.index, "segment", newValue)
  }

  return (
    <div className="flex justify-center align-center gap-1">
      <select
        id={`segment-${row.index}`}
        name="segment"
        title="segment"
        value={segment}
        className="p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
        onChange={handleChange}
      >
        <option value="CM">CASH</option>
        <option value="FO">FO</option>
        <option value="CO">MCX</option>
        <option value="CD">CDS</option>
      </select>

      <Button
        size="sm"
        id="action-btn"
        className="px-2 py-1 h-8 text-xs action-btn hidden transition-opacity duration-200"
        data-action="applySeg"
        data-id={`${row.original.id || ""}`}
        title="Apply same segment to all"
      >
        <PlusCircle />
      </Button>
    </div>
  )
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  dtRender?: any
  width?: any
  hidden?: boolean
}

export const columns: CustomColumnDef<MarginPledgeBranchEntry>[] = [
  {
    id: "scriptName",
    accessorKey: "scriptName",
    header: "Scrip Name",
    width: "20px",
  },
  {
    id: "boID",
    accessorKey: "boID",
    header: "BOID",
    width: "20px",
  },
  {
    id: "isin",
    accessorKey: "isin",
    header: "ISIN",
    width: "20px",
  },
  {
    id: "unpledgedQuantityInp",
    accessorKey: "unpledgedQuantity",
    header: "Quantity to Pledge",
    width: "20px",
    // cell: ({ row, table }) => {
    //   return <ApplyQuantity row={row} table={table} />
    // },
  },
  {
    id: "amountInp",
    accessorKey: "amount",
    header: "Amount",
    width: "20px",
  },
  {
    id: "segment",
    accessorKey: "segment",
    header: "Segment",
    width: "20px",
    // cell: ({ row, table }) => {
    //   return <SelectedSegment row={row} table={table} />
    // },
  },
  {
    id: "unpledgedQuantity",
    accessorKey: "unpledgedQuantity",
    header: "Free Quantity",
    width: "20px",
  },
  {
    id: "totalQuantity",
    accessorKey: "totalQuantity",
    header: "Total Quantity",
    width: "20px",
  },
  {
    id: "pledgeQuantity",
    accessorKey: "pledgeQuantity",
    header: "Pledged Quantity",
    width: "20px",
  },
]

