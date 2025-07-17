export const metadata = {
    title: "Margin Pledge",
}
import MarginPledgeNew from '@/components/Dashboard/pledge/HO/margin-pledge/margin-pledge'
import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/HO/margin-pledge/MarginPledgeSkeleton'
import MarginPledge from '@/components/Dashboard/pledge/HO/margin-pledge/page'
import MarginPledgeHOUpdated from '@/components/Dashboard/pledge/HO/margin-pledge/page-updated'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            {/* <MarginPledge /> */}
            {/* <MarginPledgeNew /> */}
            <MarginPledgeHOUpdated />
        </Suspense>
    )
}