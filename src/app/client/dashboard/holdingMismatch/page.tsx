import HoldingMismatch from '@/components/Dashboard/HoldingMismatch/HoldingMismatch'
import { HoldingMismatchSkeleton } from '@/components/Dashboard/HoldingMismatch/HoldingMismatchSkeleton'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<HoldingMismatchSkeleton />}>
            <HoldingMismatch />
        </Suspense>
    )
}