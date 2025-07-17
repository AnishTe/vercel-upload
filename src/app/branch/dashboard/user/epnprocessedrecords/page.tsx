export const metadata = {
    title: "EPN Process Records",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
// import MarginPledge from '@/components/Dashboard/pledge/branch/margin-pledge/page'
import { Suspense } from 'react'
import EPNProcessRecords from './epnprocessedrecords'


export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <EPNProcessRecords />
        </Suspense>
    )
}