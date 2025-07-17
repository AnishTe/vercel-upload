"use client"

import { Button } from "@/components/ui/button"

import dynamic from "next/dynamic"

const StatementPDF = dynamic(() => import("./StatementPDF"), {
    ssr: false,
    loading: () => <div>Loading..</div>,
})


// import StatementPDF from "./StatementPDF"
// import StatementPDF from "./global-report"
import { Suspense } from "react"

export default function StatementPage() {
    return (
        <Suspense fallback={<div>Loading..</div>}>
            <StatementPDF />
        </Suspense>
    )
}

