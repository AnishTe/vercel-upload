export const metadata = {
    title: "Client Margin",
}
import WhatsappAlertClientMargin from '@/components/Dashboard/whatsapp/clientMargin'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WhatsappAlertClientMargin />
        </Suspense>
    )
}