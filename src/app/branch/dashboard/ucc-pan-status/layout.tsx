
export const metadata = {
    title: "UCC PAN Status",
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

