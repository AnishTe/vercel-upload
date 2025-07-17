export const metadata = {
    title: "Client Profile",
}

import { MarginPledgeSkeleton } from '@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton'
// import MarginPledge from '@/components/Dashboard/pledge/branch/margin-pledge/page'
import { Suspense } from 'react'
import ClientProfile from './clientProfile'


export default function Page() {
    return (
        <Suspense fallback={<MarginPledgeSkeleton />}>
            <ClientProfile />
        </Suspense>
    )
}