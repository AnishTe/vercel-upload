"use client"

import { FileText, Calendar } from "lucide-react"
import { eodAllocationFileGeneration, epiAdhockLimitFileGenereration, mergeCollateralFiles } from "@/lib/auth"
import OperationDashboard from "@/components/operation-dashboard"

export default function FileOperations() {
    const tabContent = {
        epiAdhockLimitFileGenereration: {
            title: "Odin EPI Adhock Limit File Generation",
            description: "Generate EPI adhock limit files for Odin system",
            icon: FileText,
            action: async () => epiAdhockLimitFileGenereration(),
        },
        mergeCollateral: {
            title: "Merge Collateral Files",
            description: "Combine multiple collateral files into a single file",
            icon: FileText,
            action: async () => mergeCollateralFiles(),
        },
        eodAllocation: {
            title: "EOD Allocation File Generation",
            description: "Generate end-of-day allocation files",
            icon: Calendar,
            action: async () => eodAllocationFileGeneration(),
        },
    }

    return (
        <OperationDashboard title="File Operations" tabContent={tabContent} defaultTab="epiAdhockLimitFileGenereration" />
    )
}
