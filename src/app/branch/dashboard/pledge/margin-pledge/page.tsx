// export const metadata = {
//     title: "Margin Pledge",
// }
"use client"
import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
import dynamic from "next/dynamic";

const MarginPledge = dynamic(() => import('@/components/Dashboard/pledge/branch/margin-pledge/page'), {
    ssr: false, // Prevents server-side rendering issues
});
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <MarginPledge />
        </Suspense>
    )
}