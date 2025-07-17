export const metadata = {
  title: "Manage Buyback Orders",
}
import { BuybackSkeleton } from '@/components/Dashboard/buyback/HO/manage-order/BuybackSkeleton'
import Buyback from '@/components/Dashboard/buyback/HO/manage-order/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<BuybackSkeleton />}>
          <Buyback />
      </Suspense>
  )
}