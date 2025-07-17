"use client"

import { FileText } from "lucide-react"
import { cuspaLedgerMessage, sendeodLedgerMessages } from "@/lib/auth"
import OperationDashboard from "@/components/operation-dashboard"

export default function WhatsappAlertEodLedger() {
    const tabContent = {
        sendeodLedgerMessages: {
            title: "EOD Ledger",
            description: "Send WhatsApp alerts for EOD ledger information",
            icon: FileText,
            action: async () => sendeodLedgerMessages(),
        },
        cuspaLedgerMessage: {
            title: "CUSPA Ledger",
            description: "Send WhatsApp alerts for CUSPA ledger information",
            icon: FileText,
            action: async () => cuspaLedgerMessage(),
        },
    }

    return (
        <OperationDashboard title="WhatsApp Alert EOD Ledger" tabContent={tabContent} defaultTab="sendeodLedgerMessages" />
    )
}
