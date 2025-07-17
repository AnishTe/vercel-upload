export const metadata = {
    title: "Margin Pledge",
}
import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/client/margin-pledge/MarginPledgeSkeleton'
import MarginPledge from '@/components/Dashboard/pledge/client/margin-pledge/page'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <MarginPledge />
        </Suspense>
    )
}