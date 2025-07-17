export const metadata = {
    title: "Applicable ISIN For Margin Pledge",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
import { Suspense } from 'react'
import ApplicableIsinMarginPledge from './applIsinMarginPledge'

export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <ApplicableIsinMarginPledge />
        </Suspense>
    )
}