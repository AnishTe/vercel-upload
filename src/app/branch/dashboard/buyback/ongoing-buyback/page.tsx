export const metadata = {
  title: "Ongoing Buyback",
}
import { OngoingBuybackSkeleton } from '@/components/Dashboard/buyback/HO/ongoing-buyback/OngoingBuybackSkeleton'
import OngoingBuyback from '@/components/Dashboard/buyback/HO/ongoing-buyback/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<OngoingBuybackSkeleton />}>
          <OngoingBuyback />
      </Suspense>
  )
}