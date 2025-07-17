"use client"

import { FileText } from "lucide-react"
import { marginUtilizationAlertForSpecificScripts, runClientMarginUtilizationAlert, runClientMarginUtilizationAlertTest } from "@/lib/auth"
import OperationDashboard from "@/components/operation-dashboard"

export default function WhatsappAlertClientMargin() {
    const tabContent = {
        runClientMarginUtilizationAlert: {
            title: "Client Margin Utilization Alert",
            description: "Send WhatsApp alerts for client margin utilization",
            icon: FileText,
            action: async () => runClientMarginUtilizationAlert(),
        },
        runClientMarginUtilizationAlertTest: {
            title: "Client Margin Utilization Alert Test",
            description: "Test WhatsApp alerts for client margin utilization",
            icon: FileText,
            action: async () => runClientMarginUtilizationAlertTest(),
        },
        marginUtilizationAlertForSpecificScripts: {
            title: "Client Margin Utilization Alert For Specific Scripts",
            description: "WhatsApp alerts for client margin utilization for specific scripts",
            icon: FileText,
            action: async () => marginUtilizationAlertForSpecificScripts(),
        },
    }

    return (
        <OperationDashboard
            title="WhatsApp Alert Client Margin"
            tabContent={tabContent}
            defaultTab="runClientMarginUtilizationAlert"
        />
    )
}
