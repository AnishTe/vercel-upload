export const metadata = {
    title: "IT Report MCX",
}
import ITReportMCXPage from '@/components/Dashboard/it_report_mcx/it_report_mcx'
import DataTableSkeleton from '@/components/DataTable-Skeleton'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<DataTableSkeleton rows={7} columns={4} />}>
            <ITReportMCXPage />
        </Suspense>
    )
}