export const metadata = {
  title: "Buyback OrderBook",
}
import { BuybackSkeleton } from '@/components/Dashboard/buyback/HO/buyback-orderbook/BuybackSkeleton'
import Buyback from '@/components/Dashboard/buyback/HO/buyback-orderbook/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<BuybackSkeleton />}>
          <Buyback />
      </Suspense>
  )
}