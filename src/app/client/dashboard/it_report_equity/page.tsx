export const metadata = {
    title: "IT Report Equity",
}
import ITReportEquity from '@/components/Dashboard/it_report_equity/it_report_equity'
import DataTableSkeleton from '@/components/DataTable-Skeleton'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<DataTableSkeleton rows={7} columns={4} />}>
            <ITReportEquity />
        </Suspense>
    )
}