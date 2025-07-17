"use client"

import DecryptedText from "@/components/ui/DecryptedText"
import { Skeleton } from "@/components/ui/skeleton"
import type React from "react"
import { useMemo } from "react"

interface DataRow {
    code: string
    sum: number
}

interface CompanyCodeSummaryProps {
    data: DataRow[]
    loading: boolean
}

export const CompanyCodeSummary: React.FC<CompanyCodeSummaryProps> = ({ data, loading }) => {
    if (loading) {
        return (
            [...Array(3)].map((_, index) => (
                <div
                    key={index}
                    className="flex border flex-wrap gap-2 items-center justify-between p-2 rounded-md shadow-sm"
                >
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))
        )
    }

    if (data.length === 0) return null

    return (
        data.map(({ code, sum }) => (
            <div
                key={code}
                className="flex border flex-wrap gap-2 items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-all duration-300 ease-in-out group shadow-sm hover:shadow-md"
            >
                <h3 className="text-sm font-semibold group-hover:underline transition-all duration-200">{code === "CAPITAL" ? "EQUITY" : code}</h3>
                <p className={`text-xs font-regular`}>{sum >= 0 ? "Profit" : "Loss"}</p>
                <p
                    className={`text-xs ${sum >= 0 ? "text-green-600" : "text-red-600"} transition-colors duration-300 flex gap-2`}
                >
                    <DecryptedText
                        animateOn="view"
                        revealDirection="center"
                        characters="123456789"
                        text={new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                        }).format(sum)}
                    />
                </p>
            </div>
        ))

    )
}

