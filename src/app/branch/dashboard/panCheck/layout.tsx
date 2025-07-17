
export const metadata = {
    title: "PAN Check",
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

