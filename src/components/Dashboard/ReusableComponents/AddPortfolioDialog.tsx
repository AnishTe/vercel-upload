import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SegmentedControl } from "../HoldingMismatch/SegmentedControl"
import { addPortfolio } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { format, parseISO } from "date-fns"

type AddPortfolioDialogProps = {
    isOpen: boolean
    onClose: () => void
    rowData: any
    isFromCardHeader: boolean
}

export function AddPortfolioDialog({ isOpen, onClose, rowData, isFromCardHeader }: AddPortfolioDialogProps) {
    const [formData, setFormData] = useState({
        tradeDate: "",
        scripName: "",
        scrip: "",
        isin: "",
        buySell: "B",
        narration: "",
        quantity: 0,
        rate: 0,
        fromEquity: false, // Added to handle fromEquity prop
    })
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)

    useEffect(() => {
        if (rowData) {
            setFormData({
                tradeDate: "",
                scrip: rowData?.scrip?.toString() || "",
                scripName: rowData.scripName,
                isin: rowData.isin,
                narration: "",

                // buySell: rowData.holdingQuantity - rowData.globalQuantity > 0 ? "B" : "S",
                // quantity: Math.abs(rowData.holdingQuantity - rowData.globalQuantity),

                buySell: rowData.fromEquity
                    ? "B"
                    : rowData.quantity
                        ? "S"
                        : (rowData.holdingQuantity - rowData.globalQuantity) > 0
                            ? "B"
                            : "S",

                quantity: rowData.quantity ? rowData.quantity : Math.abs(rowData.holdingQuantity - rowData.globalQuantity),
                // quantity: (rowData.holdingQuantity && rowData.globalQuantity) ? Math.abs(rowData.holdingQuantity - rowData.globalQuantity) : rowData.quantity,
                rate: 0,
                fromEquity: false,
            })
        }
    }, [rowData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const requestData = {
                ...formData,
                tradeDate: format(parseISO(formData.tradeDate), "dd/MM/yyyy"),
            }

            const response = await addPortfolio(requestData)
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpiredModal(true)
                return
            }

            toast.success("Portfolio added successfully")

            setFormData({
                tradeDate: "",
                scrip: "",
                isin: "",
                scripName: "",
                buySell: "B",
                narration: "",
                quantity: 0,
                rate: 0,
                fromEquity: false,
            });
            onClose()
        } catch (error) {
            console.error("Error adding portfolio:", error)
            toast.error("Failed to add portfolio")
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "rate" ? parseFloat(value) || 0 : value,
        }));
    };


    const handleBuySellChange = (value: string) => {
        setFormData((prev) => ({ ...prev, buySell: value }))
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent >
                    <DialogHeader>
                        <DialogTitle>Add to Portfolio</DialogTitle>
                        <DialogDescription>Add to Portfolio with these values!</DialogDescription>
                    </DialogHeader>


                    <form onSubmit={handleSubmit}>
                        <h3 className="font-semibold text-md m-2 text-center">{formData.scripName || ""} </h3>
                        <div className="grid gap-4 py-4">

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tradeDate" className="text-right">
                                    Trade Date
                                </Label>
                                <Input
                                    id="tradeDate"
                                    name="tradeDate"
                                    type="date"
                                    value={formData.tradeDate}
                                    onChange={handleInputChange}
                                    className="col-span-3"
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="scrip" className="text-right">
                                    Scrip
                                </Label>
                                <Input
                                    id="scrip"
                                    name="scrip"
                                    value={formData.scrip}
                                    onChange={handleInputChange}
                                    className="col-span-3"
                                    required
                                    readOnly={!isFromCardHeader}
                                    disabled={!isFromCardHeader}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isin" className="text-right">
                                    ISIN
                                </Label>
                                <Input
                                    id="isin"
                                    name="isin"
                                    value={formData.isin}
                                    onChange={handleInputChange}
                                    className={`col-span-3 ${!isFromCardHeader ? "disabled:opacity-90" : ""}`}
                                    required
                                    readOnly={!isFromCardHeader}
                                    disabled={!isFromCardHeader}
                                />

                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="buySell" className="text-right">
                                    Buy/Sell
                                </Label>
                                <div className="col-span-auto">
                                    <SegmentedControl
                                        options={[
                                            { value: "B", label: "Buy", color: "bg-green-600" },
                                            { value: "S", label: "Sell", color: "bg-red-600" },
                                        ]}
                                        value={formData.buySell}
                                        onChange={handleBuySellChange}
                                        name="buySell"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="narration" className="text-right">
                                    Narration
                                </Label>
                                <Input
                                    id="narration"
                                    name="narration"
                                    value={formData.narration}
                                    onChange={handleInputChange}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="quantity" className="text-right">
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    className="col-span-3"
                                    required
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rate" className="text-right">
                                    Rate
                                </Label>
                                <Input
                                    id="rate"
                                    name="rate"
                                    type="number"
                                    value={formData.rate}
                                    onChange={handleInputChange}
                                    className="col-span-3"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <DialogFooter className="border-t p-2">
                            <Button type="submit" className="m-2">Add to Portfolio</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

