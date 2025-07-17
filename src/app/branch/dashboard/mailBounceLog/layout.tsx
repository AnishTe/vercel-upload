
export const metadata = {
    title: "Mail Bounce Log",
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="w-full">
            {children}
        </main>
    )
}

