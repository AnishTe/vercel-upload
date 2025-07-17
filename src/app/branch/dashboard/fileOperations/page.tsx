export const metadata = {
    title: "File Operations",
}
import { Suspense } from 'react'
import FileOperations from '@/components/Dashboard/fileOperations/fileOperations'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FileOperations />
        </Suspense>
    )
}