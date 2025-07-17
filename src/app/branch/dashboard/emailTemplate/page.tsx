export const metadata = {
    title: "Email Template",
}
import { Suspense } from 'react'
import EmailTemplate from './emailTemplate'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmailTemplate />
        </Suspense>
    )
}