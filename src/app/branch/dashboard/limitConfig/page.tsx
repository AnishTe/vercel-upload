export const metadata = {
    title: "Limit Config",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
import { Suspense } from 'react'
import LimitConfig from './limitConfig'

export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <LimitConfig />
        </Suspense>
    )
}