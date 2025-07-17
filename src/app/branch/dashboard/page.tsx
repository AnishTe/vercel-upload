"use client"

import DashboardLayout from "@/components/Dashboard/dashboard-layout"

export default function Page() {

  return (


    // <motion.div
    //   initial={{ opacity: 0 }}
    //   animate={{ opacity: 1 }}
    //   transition={{ duration: 0.5 }}
    // >
    <DashboardLayout>
      <div className="space-y-4">

        <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
          {/* Card 1 */}
          {/* <Ledger /> */}
          WELCOME TO THE BRANCH DASHBOARD
          {/* Card 2 */}
          {/* <div className="bg-white p-6 shadow-md border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold">Card 2</h2>
            <p className="text-gray-600">Content for the second card goes here.</p>
          </div> */}
        </div>
      </div>
    </DashboardLayout>
    // </motion.div>
  )
}
