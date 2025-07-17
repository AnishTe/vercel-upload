export const metadata = {
    title: "Update IPO Details",
}
import { Suspense } from 'react'
import UpdateDetails from './update-details'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UpdateDetails />
        </Suspense>
    )
}