import { UserProvider } from "@/contexts/UserContext"
import { IPOProvider } from "@/contexts/IPOContext"

export default function IPOLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="w-full">
            <IPOProvider>
                {children}
            </IPOProvider>
        </main>
    )
}

