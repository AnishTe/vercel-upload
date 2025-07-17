export const metadata = {
    title: "Annual P&L",
}
import GlobalReport from '@/components/Dashboard/GlobalReport/global-report'
import { GlobalReportSkeleton } from '@/components/Dashboard/GlobalReport/GlobalReportSkeleton'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<GlobalReportSkeleton />}>
            <GlobalReport />
        </Suspense>
    )
}