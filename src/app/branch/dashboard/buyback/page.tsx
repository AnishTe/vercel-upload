
export const metadata = {
    title: "Buyback",
}
import { BuybackSkeleton } from '@/components/Dashboard/buyback/branch/apply-cdsl-buyback/BuybackSkeleton'
import Buyback from '@/components/Dashboard/buyback/branch/apply-cdsl-buyback/page'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<BuybackSkeleton />}>
            <Buyback />
        </Suspense>
    )
}