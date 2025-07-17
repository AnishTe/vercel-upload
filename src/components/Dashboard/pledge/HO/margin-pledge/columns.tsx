"use client"
import { useState, useEffect } from "react"
import type React from "react"

import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
  }
}

export type MarginPledgeHOEntry = {
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


export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  dtRender?: any
  width?: any
  hidden?: boolean
}

export const columns: CustomColumnDef<MarginPledgeHOEntry>[] = [
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
    accessorKey: "unpledgedQuantity", // Add this line to link to the actual data property
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
    accessorKey: "segment", // Add this line to link to the actual data property
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
    hidden: true
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
