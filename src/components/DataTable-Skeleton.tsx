import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const DataTableSkeleton = ({ columns, rows }) => {
    return (
        <div className="w-full p-4 space-y-4">
            {/* Skeleton for table header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(columns || 4)].map((_, index) => (
                    <div
                        key={`header-${index}`}
                        className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800"
                    >
                        <Skeleton className="w-full h-full" />
                    </div>
                ))}
            </div>

            {/* Skeleton for table rows */}
            <div className="space-y-2">
                {[...Array(rows || 10)].map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                        {[...Array(columns || 4)].map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800"
                            >
                                <Skeleton className="w-full h-full" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataTableSkeleton;
