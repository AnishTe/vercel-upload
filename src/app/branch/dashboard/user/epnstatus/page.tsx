export const metadata = {
    title: "EPN Status",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
// import MarginPledge from '@/components/Dashboard/pledge/branch/margin-pledge/page'
import { Suspense } from 'react'
import EPNStatus from './epnstatus'


export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <EPNStatus />
        </Suspense>
    )
}