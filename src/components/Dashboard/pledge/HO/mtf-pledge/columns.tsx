import * as React from "react"
import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"

declare module "@tanstack/react-table" {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => void
    }
}

export type MTFPledgeHOEntry = {
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
        />
    )
}

export type CustomColumnDef<T> = ColumnDef<T> & {
    deselected?: boolean
    dtRender?: any
    width?: any
    hidden?: boolean
}

export const columns: CustomColumnDef<MTFPledgeHOEntry>[] = [
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
        //     return <ApplyQuantity row={row} table={table} />
        // },
    },
    {
        id: "amountInp",
        accessorKey: "amount",
        header: "Amount",
        width: "20px",
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

