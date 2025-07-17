export const metadata = {
  title: "NSDL Buyback",
}
import { NSDLBuybackSkeleton } from '@/components/Dashboard/buyback/HO/nsdl-buyback/NSDLBuybackSkeleton'
import NSDLBuyback from '@/components/Dashboard/buyback/HO/nsdl-buyback/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<NSDLBuybackSkeleton />}>
          <NSDLBuyback />
      </Suspense>
  )
}