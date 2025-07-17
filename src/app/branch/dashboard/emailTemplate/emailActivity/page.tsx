export const metadata = {
    title: "Email Activity",
}
import { Suspense } from 'react'
import EmailActivity from './emailActivity'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmailActivity />
        </Suspense>
    )
}