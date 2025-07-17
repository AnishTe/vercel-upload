"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import IPOList from "./IPOList"
import { useRouter } from "next/navigation"

export default function IPOLayout() {
    const [activeTab, setActiveTab] = useState("open")
    const router = useRouter()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>IPO</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className={"grid w-full grid-cols-3"}>
                            <TabsTrigger value="open">Open IPOs</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming IPOs</TabsTrigger>
                            <TabsTrigger value="closed">Closed IPOs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="open">
                            <IPOList ipolisttype="ongoing" noDataMessage="No IPOs are currently open." />
                        </TabsContent>
                        <TabsContent value="upcoming">
                            <IPOList ipolisttype="upcoming" noDataMessage="No upcoming IPOs." />
                        </TabsContent>
                        <TabsContent value="closed">
                            <IPOList ipolisttype="closed" noDataMessage="No closed IPOs." />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

    )
}

