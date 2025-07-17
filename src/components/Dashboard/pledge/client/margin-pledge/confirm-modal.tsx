import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/DataTable"

type ConfirmModalProps = {
    selectedRows: any[]
    onConfirm: () => void
    onClose: () => void
}

const columns: ColumnDef<any>[] = [
    {
        id: "quantity",
        accessorKey: "quantity",
        header: "Quantity",
    },
    {
        id: "scriptName",
        accessorKey: "scriptName",
        header: "Script Name",
    },
]

export function ConfirmModal({ selectedRows, onConfirm, onClose }: ConfirmModalProps) {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Pledge</DialogTitle>
                    <DialogDescription>Are you sure you want to pledge the following shares?</DialogDescription>
                </DialogHeader>
                <DataTable columns={columns} data={selectedRows} showAllRows={false} />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

