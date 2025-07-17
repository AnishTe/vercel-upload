import React from 'react';
import { ExternalLink } from 'lucide-react';
import DecryptedText from "@/components/ui/DecryptedText";

interface DataSummaryProps {
    sortedGroupedData: Record<string, { rows: any[]; sum: number }>;
    processedExpensesData: Record<string, { rows: any[]; sum: number }>;
    totalExpenses: number;
    handleTypeClick: (type: string) => void;
}

const TotalDataSummary: React.FC<DataSummaryProps> = ({
    sortedGroupedData,
    processedExpensesData,
    totalExpenses,
    handleTypeClick
}) => {
    if (Object.keys(sortedGroupedData).length === 0) return null;

    const totalUnrealized = Object.entries(sortedGroupedData)
        .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
        .reduce((acc, [, { sum }]) => acc + sum, 0);

    const totalRealized = Object.entries(sortedGroupedData)
        .filter(
            ([type]) =>
                type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES"
        )
        .reduce((acc, [, { sum }]) => acc + sum, 0) - Math.abs(Number(totalExpenses))

    return (
        <div className="flex justify-start items-center">
            <div className="w-full max-w-screen-xl px-4">
                <div className="flex flex-col justify-start gap-4 mb-3 md:mb-2 lg:mb-2">

                    {/* Unrealized Group */}
                    <div className="flex flex-wrap justify-start items-center lg:gap-6 sm:gap-3">
                        <h2 className="text-lg font-bold flex gap-2 items-center py-2">
                            Unrealized
                            <p className={`text-sm font-regular`}>
                                {totalUnrealized >= 0 ? 'Profit' : 'Loss'}
                            </p>
                            <p className={`text-sm font-regular ${totalUnrealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                }).format(totalUnrealized).replace(/^(\D?)(.+)$/, (_, symbol, amount) => `(${symbol} ${amount})`)}
                            </p>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(sortedGroupedData)
                                .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
                                .map(([type, { sum }]) => (
                                    <div
                                        key={type}
                                        className="flex flex-wrap border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
                                        onClick={() => handleTypeClick(type)}
                                    >
                                        <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                            {type === "OP_ASSETS" ? "OPENING ASSETS" : type.toUpperCase()}
                                        </h3>

                                        <p className={`text-xs font-regular`}>
                                            {sum >= 0 ? 'Profit' : 'Loss'}
                                        </p>
                                        <p className={`text-xs ${sum >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(sum)}
                                            />
                                            <ExternalLink
                                                size={15}
                                                className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Realized Group */}
                    <div className="flex flex-wrap justify-start items-center lg:gap-6 sm:gap-3">
                        <h2 className="text-lg font-bold flex gap-2 items-center py-2">
                            Realized
                            <p className={`text-sm font-regular`}>
                                {totalRealized >= 0 ? 'Profit' : 'Loss'}
                            </p>
                            <p className={`text-sm font-regular ${totalRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                }).format(totalRealized).replace(/^(\D?)(.+)$/, (_, symbol, amount) => `(${symbol}${amount})`)}
                            </p>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(sortedGroupedData)
                                .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
                                .map(([type, { sum }]) => (
                                    <div
                                        key={type}
                                        className="flex border flex-wrap gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
                                        onClick={() => handleTypeClick(type)}
                                    >
                                        <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                            {type.toUpperCase()}
                                        </h3>
                                        <p className={`text-xs font-regular`}>
                                            {sum >= 0 ? 'Profit' : 'Loss'}
                                        </p>
                                        <p className={`text-xs ${sum >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(sum)}
                                            />
                                            <ExternalLink
                                                size={15}
                                                className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </p>
                                    </div>
                                ))}
                            {
                                (processedExpensesData && Object.keys(processedExpensesData).length > 0) && (
                                    <div
                                        key="expenses"
                                        className="flex border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
                                        onClick={() => handleTypeClick("expenses")}
                                    >
                                        <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                            EXPENSES
                                        </h3>
                                        <p className={`text-xs ${totalExpenses >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format((Math.abs(Number(totalExpenses))))}
                                            />
                                            <ExternalLink
                                                size={15}
                                                className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </p>
                                    </div>
                                )
                            }

                        </div>
                    </div>

                    {/* Liabilities Group */}
                    <div className="flex justify-start items-center gap-2">
                        <div className="flex gap-4">
                            {Object.entries(sortedGroupedData)
                                .filter(([type]) => type === "LIABILITIES")
                                .map(([type, { sum }]) => (
                                    <div
                                        key={type}
                                        className="flex border gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
                                        onClick={() => handleTypeClick(type)}
                                    >
                                        <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">
                                            {type.toUpperCase()}
                                        </h3>
                                        <p className={`text-xs font-regular`}>
                                            {sum >= 0 ? 'Profit' : 'Loss'}
                                        </p>
                                        <p className={`text-xs ${sum >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}>
                                            <DecryptedText
                                                animateOn="view"
                                                revealDirection="center"
                                                characters="123456789"
                                                text={new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(sum)}
                                            />
                                            <ExternalLink
                                                size={15}
                                                className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default TotalDataSummary;
