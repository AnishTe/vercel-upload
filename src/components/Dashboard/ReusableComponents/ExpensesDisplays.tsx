import type React from "react"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import DecryptedText from "@/components/ui/DecryptedText"

interface ExpensesDisplayProps {
    processedExpensesData: any[]
    totalExpenses: number
    expenseRowKey: string
    expenseRowAmount: string
}

const ExpensesDisplay: React.FC<ExpensesDisplayProps> = ({ processedExpensesData, totalExpenses, expenseRowKey, expenseRowAmount }) => {
    if (processedExpensesData && processedExpensesData.length > 0) {
        return (
            <div className="mt-6 border rounded-lg shadow-md bg-background max-w-sm p-4" id="expenses">
                <div className="flex justify-between items-center m-2">
                    <div className="flex gap-1 items-center">
                        <h3 className="text-lg font-semibold">Expenses</h3>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-pointer">
                                    <Info size={16} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="min-w-[50px] max-w-[250px] p-4 m-2 bg-gray-800 text-white rounded-md shadow-md">
                                <p>
                                    Represents costs incurred during trading or portfolio management, such as brokerage fees, taxes,
                                    transaction charges, and other operational expenses deducted from profits.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <span className={`font-bold ${totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {`${new Intl.NumberFormat("en-IN", {
                            maximumFractionDigits: 2,
                        }).format(Math.abs(Number(totalExpenses)))}`}
                    </span>
                </div>
                <Separator className="my-4" />
                <ul className="space-y-4">
                    {processedExpensesData.map((expense: any, index: number) => (
                        <li key={index} className="flex justify-between items-center p-2">
                            <span className="font-medium">{expense[expenseRowKey]}</span>
                            <span>
                                <DecryptedText
                                    animateOn="view"
                                    revealDirection="center"
                                    characters="123456789"
                                    text={new Intl.NumberFormat("en-IN", {
                                        maximumFractionDigits: 2,
                                    }).format(Math.abs(Number(expense[expenseRowAmount])))}
                                />
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )
    }
    return null
}

export default ExpensesDisplay

