export const metadata = {
    title: "Mail Bounce Count",
}
import { Suspense } from 'react'
import MailBounceCount from '@/components/Dashboard/mailBounceCount/mailBounceCount'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MailBounceCount />
        </Suspense>
    )
}