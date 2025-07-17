"use client"
import { Suspense } from "react"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import PledgeContent from "@/components/Dashboard/pledge/pledge-content"

export default function Pledge() {
    return (
        <DashboardLayout>
            <div className="space-y-4">
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center">Pledge Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<DataTableSkeleton columns={4} rows={10} />}>
                            <PledgeContent />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

