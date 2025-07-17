
import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"


export type CustomColumnDef<T> = ColumnDef<T> & {
    deselected?: boolean
    hidden?: boolean
    width?: string
}

export type TradeReportEntry = {
    SELL_NET_PRICE: any
    BUY_NET_PRICE: any
    SELL_PRICE: any
    BUY_PRICE: any
    SELL_QUANTITY: number
    BUY_QUANTITY: number
    SCRIP_NAME: string
    TRADE_DATE: string
    action: string
    quantity: number
    price: number
    amount: number
    TRADE_TIME: string
    ORDER_NUMBER: string
    TRADE_NUMBER: string
    ISIN: string
}


export const columns: CustomColumnDef<TradeReportEntry>[] = [
    {
        id: "SCRIP_NAME",
        accessorKey: "SCRIP_NAME",
        header: "Scrip Name",
    },

    {
        id: "action",
        accessorKey: "action",
        header: "Action",
        width: "60px",
        cell: ({ row }) => {
            const buyQuantity = Number(row.original.BUY_QUANTITY);
            const sellQuantity = Number(row.original.SELL_QUANTITY);

            let buySell: "BUY" | "SELL" | "UNKNOWN";
            if (buyQuantity > 0) {
                buySell = "BUY";
            } else if (sellQuantity > 0) {
                buySell = "SELL";
            } else {
                buySell = "UNKNOWN";
            }

            return (
                <Badge
                    variant={buySell === "BUY" ? "default" : "secondary"}
                    className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${buySell === "BUY"
                            ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                            : buySell === "SELL"
                                ? "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
                                : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                        }
              `}
                >
                    {buySell}
                </Badge>
            );
        },
    },
    {
        id: "quantity",
        accessorKey: "quantity",
        width: "60px",
        header: "Quantity",
        cell: ({ row }) => {
            const buyQuantity = Number(row.original.BUY_QUANTITY);
            const sellQuantity = Number(row.original.SELL_QUANTITY);
            let quantity = 0;
            if (buyQuantity > 0) {
                quantity = buyQuantity;
            }
            else if (sellQuantity > 0) {
                quantity = sellQuantity;
            } else {
                quantity = 0;
            }
            return <div className="font-medium">{quantity}</div>;
        },
    },
    {
        id: "price",
        accessorKey: "price",
        width: "80px",
        header: "Price",
        cell: ({ row }) => {
            const buyPrice = Number(row.original.BUY_NET_PRICE);
            const sellPrice = Number(row.original.SELL_NET_PRICE);
            let price = 0;
            if (buyPrice > 0) {
                price = buyPrice;
            }
            else if (sellPrice > 0) {
                price = sellPrice;
            } else {
                price = 0;
            }
            return <div className="font-medium">{price}</div>;
        },
    },
    {
        id: "AMOUNT",
        accessorKey: "AMOUNT",
        width: "80px",
        header: "Amount",
    },
    {
        id: "TRADE_DATE",
        accessorKey: "TRADE_DATE",
        header: "Trade Date",
        width: "150px",
    },
    {
        id: "TRADE_TIME",
        accessorKey: "TRADE_TIME",
        width: "150px",
        header: "Trade Time",
    },
    {
        id: "ORDER_NUMBER",
        accessorKey: "ORDER_NUMBER",
        header: "Order Number",
    },
    {
        id: "TRADE_NUMBER",
        accessorKey: "TRADE_NUMBER",
        header: "Trade Number",
    },
    {
        id: "ISIN",
        accessorKey: "ISIN",
        header: "ISIN",
        deselected: true
    }
]

