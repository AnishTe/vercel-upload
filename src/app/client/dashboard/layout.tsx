import { UserProvider } from "@/contexts/UserContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="w-full">
      <UserProvider>
        {children}
      </UserProvider>
    </main>
  )
}

