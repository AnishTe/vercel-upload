import { UserProvider } from "@/contexts/UserContext"
import { IPOProvider } from "@/contexts/IPOContext"
import { Metadata } from "next"

// export const metadata: Metadata = {
//   manifest: '/manifest.json',
// }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="w-full">
      <UserProvider>
        {/* <IPOProvider> */}
        {children}
        {/* </IPOProvider> */}
      </UserProvider>
    </main>
  )
}

