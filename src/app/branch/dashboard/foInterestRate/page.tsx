export const metadata = {
    title: "FO Interest Rate",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
// import MarginPledge from '@/components/Dashboard/pledge/branch/margin-pledge/page'
import { Suspense } from 'react'
import FoInterestRate from './foInterestRate'


export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <FoInterestRate />
        </Suspense>
    )
}