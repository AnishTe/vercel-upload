export const metadata = {
    title: "MTF Pledge",
}
import { MTFPledgeSkeleton } from '@/components/Dashboard/pledge/client/mtf-pledge/MTFPledgeSkeleton'
import MTFPledge from '@/components/Dashboard/pledge/client/mtf-pledge/page'
import { Suspense } from 'react'


export default function Page() {
    return (
        <Suspense fallback={<MTFPledgeSkeleton />}>
            <MTFPledge />
        </Suspense>
    )
}