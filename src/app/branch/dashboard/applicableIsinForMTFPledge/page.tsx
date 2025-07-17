export const metadata = {
  title: "Applicable ISIN For MTF Pledge",
}

import { MarginPledgeSkeleton } from "@/components/Dashboard/pledge/branch/margin-pledge/MarginPledgeSkeleton"
import { Suspense } from "react"
import ApplicableIsinMTFPledge from "./applIsinMTFPledge"

export default function Page() {
  return (
    <Suspense fallback={<MarginPledgeSkeleton />}>
      <ApplicableIsinMTFPledge />
    </Suspense>
  )
}
