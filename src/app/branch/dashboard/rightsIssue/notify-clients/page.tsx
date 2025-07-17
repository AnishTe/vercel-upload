export const metadata = {
  title: "Notify Clients",
}
import { NotifyClientsSkeleton } from '@/components/Dashboard/rightsIssue/notify-clients/NotifyClientsSkeleton'
import NotifyClients from '@/components/Dashboard/rightsIssue/notify-clients/page'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<NotifyClientsSkeleton />}>
      <NotifyClients />
    </Suspense>
  )
}