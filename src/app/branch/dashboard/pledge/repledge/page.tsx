export const metadata = {
  title: "RePledge",
}
import { RePledgeSkeleton } from '@/components/Dashboard/pledge/HO/repledge/RePledgeSkeleton'
import RePledge from '@/components/Dashboard/pledge/HO/repledge/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<RePledgeSkeleton />}>
          <RePledge />
      </Suspense>
  )
}