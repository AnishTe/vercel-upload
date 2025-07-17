export const metadata = {
    title: "Birthday Stock Suggestions",
}
import { Suspense } from 'react'
import StockUploadPage from './birthdayStockSuggestions'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StockUploadPage />
        </Suspense>
    )
}