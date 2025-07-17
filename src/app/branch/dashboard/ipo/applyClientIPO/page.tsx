import { Suspense } from "react"
import ApplyClientIPODetails from "./applyClientIPODetails"

export const metadata = {
    title: "Apply Client IPO",
}

export default function ApplyClientIPO() {
    return <Suspense fallback={<div>Loading...</div>}>
        <ApplyClientIPODetails />
    </Suspense>
}
