export const metadata = {
    title: "Holding",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
// import MarginPledge from '@/components/Dashboard/pledge/branch/margin-pledge/page'
import { Suspense } from 'react'
import BranchHolding from './branchHolding'


export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <BranchHolding />
        </Suspense>
    )
}