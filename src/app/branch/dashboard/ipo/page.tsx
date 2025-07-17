export const metadata = {
    title: "IPO",
}
import { Suspense } from 'react'
import IPO from './ipo'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <IPO />
        </Suspense>
    )
}