"use client"
import IPOLayout from "@/components/Dashboard/ipo/IPOLayout";
import { useUser } from "@/contexts/UserContext";
import { getCompatibleUrl } from "@/utils/url-helpers";

export default function IPO() {
    const { accountType, loginType } = useUser()

    if (accountType === "employee" && loginType === "Branch") {
        return (
            <IPOLayout applyIPO={true} openIPORoute={"/branch/dashboard/ipo/applyClientIPOHO"} openViewHistoryRoute={"/branch/dashboard/ipo/view-ordersHO"} />
        )
    }

    return (
        <IPOLayout applyIPO={true} openIPORoute={"/branch/dashboard/ipo/applyClientIPO"} openViewHistoryRoute={"/branch/dashboard/ipo/view-ordersBranch"} />
    )
}