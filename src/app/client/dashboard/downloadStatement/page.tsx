export const metadata = {
    title: "STT Certificate",
}


// import StatementPDF from "./StatementPDF"
// import StatementPDF from "./global-report"
import { Suspense } from "react"
import StatementPage from "./StatementPage"

export default function Home() {
    return (
        <StatementPage />
    )
}

