import Position from '@/components/Dashboard/Position/position'
import { PositionSkeleton } from '@/components/Dashboard/Position/PositionSkeleton'
import { Suspense } from 'react'

export const metadata = {
    title: "Position",
}

export default async function Page() {
    return (
        <Suspense fallback={<PositionSkeleton />}>
            <Position />
        </Suspense>
    )
}