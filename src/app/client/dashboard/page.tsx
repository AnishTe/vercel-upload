export const metadata = {
  title: "Portfolio & Ledger",
}

import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { GlobalPortFolio } from "@/components/Dashboard/getGlobalPortFolio/GlobalPortFolio";
import { Ledger } from "@/components/Dashboard/ledger/Ledger"

export default function Page() {

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Full width on mobile, 2/3 on desktop */}
          <div className="col-span-2">
            <GlobalPortFolio />
          </div>
          {/* Smaller width for Ledger */}
          <div className="col-span-1">
            <Ledger />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
