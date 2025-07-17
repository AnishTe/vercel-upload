export const metadata = {
    title: "Buyback",
}
import { BuybackSkeleton } from '@/components/Dashboard/buyback/client/BuybackSkeleton'
import Buyback from '@/components/Dashboard/buyback/client/page'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<BuybackSkeleton />}>
            <Buyback />
        </Suspense>
    )
}