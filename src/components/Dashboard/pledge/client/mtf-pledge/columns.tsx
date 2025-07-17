import * as React from "react"
import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"

declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MTFPledgeEntry = {
    clientId: string
    scriptName: string
    boID: string
    isin: string
    totalQuantity: number
    unpledgedQuantity: number
    amount: number
    quantity: number
    inputs: Record<string, any>
}

const ApplyQuantity = ({ row, table }) => {
    const [localValue, setLocalValue] = useState(
        row.original.quantity?.toString() || row.original.unpledgedQuantity?.toString() || "",
    )

    const validateQuantity = (value: number) => {
        if (value > row.original.unpledgedQuantity) {
            toast.error(
                `You can't pledge more than the unpledged quantity for ${row.original.scriptName}. Maximum allowed: ${row.original.unpledgedQuantity}.`,
            )
            return false
        }
        return true
    }

    useEffect(() => {
        setLocalValue(row.original.quantity?.toString() || row.original.unpledgedQuantity?.toString() || "")
    }, [row.original.quantity, row.original.unpledgedQuantity])

    return (
        <Input
            name="quantity"
            type="number"
            placeholder="Pledge Quantity"
            value={localValue}
            onChange={(e) => {
                const newValue = Number(e.target.value)
                setLocalValue(e.target.value)
                if (validateQuantity(newValue)) {
                    table.options.meta?.updateData(row.index, "unpledgedQuantity", newValue, "quantity")
                }
            }}
        // return (
        //     <Input
        //         name="quantity"
        //         type="number"
        //         placeholder="Pledge Quantity"
        //         value={localValue}
        //         onChange={(e) => {
        //             setLocalValue(e.target.value)
        //         }}
        //         onBlur={(e) => {
        //             const newValue = Number(e.target.value)
        //             if (validateQuantity(newValue)) {
        //                 table.options.meta?.updateData(row.index, "unpledgedQuantity", newValue, "quantity")
        //             } else {
        //                 setLocalValue(row.original.unpledgedQuantity.toString())
        //             }
        //         }}
        />
    )
}

export const columns: ColumnDef<MTFPledgeEntry>[] = [
    {
        id: "scriptName",
        accessorKey: "scriptName",
        header: "Scrip Name",
    },
    {
        id: "boID",
        accessorKey: "boID",
        header: "BOID",
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
    },
    {
        id: "totalQuantity",
        accessorKey: "totalQuantity",
        header: "Total Quantity",
    },
    {
        id: "unpledgedQuantityInp",
        accessorKey: "unpledgedQuantity",
        header: "Quantity to Pledge",
        // cell: ({ row, table }) => {
        //     return <ApplyQuantity row={row} table={table} />
        // },
    },
    {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
    },

]

