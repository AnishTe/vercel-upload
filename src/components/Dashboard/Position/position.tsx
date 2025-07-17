"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { columns } from "./columns"
import { position } from "@/api/auth"
import { withTokenValidation, validateTokenEnhanced, type ValidationResult } from "@/utils/withTokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import dynamic from "next/dynamic"
import { FileX } from "lucide-react"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
    ssr: false,
    loading: () => <DataTableSkeleton columns={4} rows={10} />,
})

// Define the props including the validationResult from the HOC
interface PositionProps {
    validationResult: ValidationResult
    setValidationResult: (result: ValidationResult) => void
}

// Component with token validation logic
function Position({ validationResult, setValidationResult }: PositionProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                const response = await position()

                // Use the validation function and update the HOC's state
                const result = validateTokenEnhanced(response)
                setValidationResult(result)

                // Only process data if validation passed
                if (result.isValid) {
                    const parsedData =
                        typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

                    if (parsedData.Success === "True" && parsedData["Success Description"]) {
                        const description = parsedData["Success Description"]
                        setData(description)
                    } else {
                        throw new Error(parsedData["Error Description"] || "Failed to fetch Holdings data.")
                    }
                }
            } catch (error: any) {
                setError(error.message || "An error occurred while fetching data.")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [setValidationResult])

    // If validation failed, return null as the HOC will handle rendering the appropriate UI
    if (!validationResult.isValid) {
        return null
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Open Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <DataTableSkeleton columns={4} rows={10} />
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                <div className="rounded-full bg-muted p-3 mb-4">
                                    <FileX className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No Data found</h3>
                                <p className="text-muted-foreground mb-4 max-w-md">There are no Position records available.</p>
                            </div>
                        ) : (
                            <DataTableArray
                                columns={columns}
                                includeFileData={true}
                                data={data}
                                filterColumn="NARRATION"
                                filterPlaceholder="Filter Narration..."
                                showAllRows={true}
                                showPagination={false}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

// Wrap the component with the HOC
export default withTokenValidation(Position)

