export const metadata = {
  title: "Holdings",
}
import HoldingsPage from '@/components/Dashboard/Holdings/holdings'
import DataTableSkeleton from '@/components/DataTable-Skeleton'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<DataTableSkeleton rows={7} columns={4} />}>
      <HoldingsPage />
    </Suspense>
  )
}