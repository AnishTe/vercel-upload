export const metadata = {
  title: "Ongoing Rights Issue",
}
import RightsIssue from '@/components/Dashboard/rightsIssue/ongoing-rightsissue/page'
import { RightsIssueSkeleton } from '@/components/Dashboard/rightsIssue/ongoing-rightsissue/RightsIssueSkeleton'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<RightsIssueSkeleton />}>
      <RightsIssue />
    </Suspense>
  )
}