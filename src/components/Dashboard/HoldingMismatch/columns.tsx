import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export type HoldingMismatchEntry = {
    scripName: string
    scripSymbol: string
    isin: string
    globalQuantity: number
    holdingQuantity: number
    onAddPortfolio: (row: HoldingMismatchEntry) => void
}

export const columns: ColumnDef<HoldingMismatchEntry>[] = [
    {
        id: "scripName",
        accessorKey: "scripName",
        header: "Scrip Name",
        cell: ({ row }) => {
            const scripName: any = row.original.scripName;
            const [firstPart, secondPart] = scripName.split("#");
            return (
                <div>
                    <div>{firstPart}</div>
                    <div className="text-sm text-gray-500">{secondPart}</div>
                </div>
            );
        },
    },
    {
        id: "scripSymbol",
        accessorKey: "scripSymbol",
        header: "Scrip Symbol",
    },
    {
        id: "isin",
        accessorKey: "isin",
        header: "ISIN",
    },
    {
        id: "globalQuantity",
        accessorKey: "globalQuantity",
        header: "Global Quantity",
    },
    {
        id: "holdingQuantity",
        accessorKey: "holdingQuantity",
        header: "Holding Quantity",
    },
    // {
    //     id: "actions",
    //     cell: ({ row }) => (
    //         <Button variant="ghost" size="icon" onClick={() => row.original.onAddPortfolio(row.original)}>
    //             <PlusCircle className="h-4 w-4" />
    //             <span className="sr-only">Add to Portfolio</span>
    //         </Button>
    //     ),
    //     header: "Add Folio",
    // },
]

