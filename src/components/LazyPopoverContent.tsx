import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { PopoverContent } from "@/components/ui/popover"

interface LazyPopoverContentProps {
    hiddenColumnsData: { header: string; value: any }[]
}

export default function LazyPopoverContent({ hiddenColumnsData }: LazyPopoverContentProps) {
    return (
        <PopoverContent className="w-auto p-0">
            <Table>
                <TableBody>
                    {hiddenColumnsData.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.header}</TableCell>
                            <TableCell>{item.value}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </PopoverContent>
    )
}

