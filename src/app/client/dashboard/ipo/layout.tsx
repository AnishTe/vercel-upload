import { IPOProvider } from "@/contexts/IPOContext"

export default function IPOLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <IPOProvider>{children}</IPOProvider>
}

