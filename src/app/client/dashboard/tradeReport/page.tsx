
import TradeReport from '@/components/Dashboard/tradeReport/tradeReport'
import DataTableSkeleton from '@/components/DataTable-Skeleton'
import { Suspense } from 'react'

export const metadata = {
    title: "Trade Report",
}

export default async function Page() {
    return (
        <Suspense fallback={<DataTableSkeleton rows={10} columns={4} />}>
            <TradeReport />
        </Suspense>
    )
}