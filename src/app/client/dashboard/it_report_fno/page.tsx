export const metadata = {
    title: "IT Report FNO",
}
import EquityReportFNOPage from '@/components/Dashboard/it_report_fno/it_report_fno'
import DataTableSkeleton from '@/components/DataTable-Skeleton'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<DataTableSkeleton rows={7} columns={4} />}>
            <EquityReportFNOPage />
        </Suspense>
    )
}