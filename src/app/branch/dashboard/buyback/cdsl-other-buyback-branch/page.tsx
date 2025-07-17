export const metadata = {
    title: "External DP / NSDL Buyback",
  }
  import { CDSLOtherBuybackSkeleton } from '@/components/Dashboard/buyback/branch/cdsl-other-buyback/CDSLOtherBuybackSkeleton'
  import CDSLOtherBuyback from '@/components/Dashboard/buyback/branch/cdsl-other-buyback/page'
  import { Suspense } from 'react'
  
  export default function Page() {
    return (
        <Suspense fallback={<CDSLOtherBuybackSkeleton />}>
            <CDSLOtherBuyback />
        </Suspense>
    )
  }