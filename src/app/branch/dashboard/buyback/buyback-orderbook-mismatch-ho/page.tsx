export const metadata = {
  title: "Buyback OrderBook Mismatch",
}
import { BuybackSkeleton } from '@/components/Dashboard/buyback/HO/buyback-orderbook-mismatch/BuybackSkeleton'
import Buyback from '@/components/Dashboard/buyback/HO/buyback-orderbook-mismatch/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<BuybackSkeleton />}>
          <Buyback />
      </Suspense>
  )
}