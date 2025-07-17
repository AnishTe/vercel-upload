export const metadata = {
    title: "View Buyback Orders",
}
import { ViewOrderBuybackSkeleton } from '@/components/Dashboard/buyback/client/viewOrders/ViewOrderBuybackSkeleton'
import ViewOrder from '@/components/Dashboard/buyback/client/viewOrders/page'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<ViewOrderBuybackSkeleton />}>
            <ViewOrder />
        </Suspense>
    )
}