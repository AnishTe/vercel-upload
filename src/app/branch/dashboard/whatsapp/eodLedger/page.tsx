export const metadata = {
    title: "EOD Ledger",
}

import WhatsappAlertEodLedger from '@/components/Dashboard/whatsapp/eodLedger'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WhatsappAlertEodLedger />
        </Suspense>
    )
}