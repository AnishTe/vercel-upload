
export const metadata = {
    title: "Family Profile",
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

