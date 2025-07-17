export const metadata = {
    title: "Mail Bounce Import File",
}
import ImportFile from '@/components/Dashboard/importFile/importFile'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ImportFile />
        </Suspense>
    )
}