"use client";

import { useEffect, useState } from "react";
import { getLedger } from "@/lib/auth";
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import LedgerDataDisplay from "./LedgerDataDisplay";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { sum } from "lodash";

export function Ledger() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
    const [data, setData] = useState<any[] | null>(null);
    const [groupedData, setGroupedData] = useState<Record<string, string[]> | null>(null);
    const [ledgerMrgCollAmount, setLedgerMrgCollAmount] = useState(0);

    useEffect(() => {
        const fetchLimitData = async () => {
            setLoading(true);
            try {
                const response = await getLedger();
                const tokenIsValid = validateToken(response);
                if (!tokenIsValid) {
                    setShowSessionExpiredModal(true);
                    return;
                }

                const parsedData = typeof response.data.data === "string"
                    ? JSON.parse(response.data.data)
                    : response.data.data;

                if (parsedData.Success === "True" && parsedData["Success Description"]) {
                    const description = parsedData["Success Description"];
                    setData(description);
                    setGroupedData(parsedData.groupedData || []);
                } else {
                    throw new Error(parsedData["Error Description"] || "Failed to fetch ledger data.");
                }
            } catch (error: any) {
                setError(error.message || "An unknown error occurred while fetching data.");
            } finally {
                setLoading(false);
            }
        };

        fetchLimitData();
    }, []);

    const calculateGroupedTotals = () => {
        if (!groupedData || !data) return [];

        return Object.entries(groupedData).map(([groupKey, cocdArray]) => {
            const total = cocdArray.reduce((sum, cocd) => {
                const matchingRows = data.filter((row) => row.TITAL === cocd);
                const groupSum = matchingRows?.reduce(
                    (subtotal, row) => subtotal + parseFloat(row.AMOUNT || '0'),
                    0
                );
                return sum + groupSum;
            }, 0);
            return { cocd: groupKey, total };
        });
    };
    const groupedTotals = calculateGroupedTotals();

    useEffect(() => {
        if (data) {
            const filteredRows = data.filter((row) => {
                const shouldInclude =
                    row.TITAL === "Ledger+Mrg+Coll" ||
                    row.COCD === "Ledger+Mrg+Coll"

                return shouldInclude;
            });

            const totalAmount = filteredRows.reduce(
                (sum, row) => sum + (parseFloat(row.AMOUNT) || 0),
                0
            );

            setLedgerMrgCollAmount(totalAmount);
        }
    }, [data]);

    const excludedValues = [
        "Associate Ledger",
        "FD",
        "Beneficiary",
        "UnConcile Credit",
        "Pending Receipt",
    ];

    const filteredData = Array.isArray(data)
        ? data?.filter((row) => row.TITAL !== "Ledger+Mrg+Coll" && row.TITAL !== "Net" && !excludedValues.includes(row.TITAL))
        : [];

    const filteredDataWithLedgerMrgColl = [
        ...filteredData,
        ...(Array.isArray(data)
            ? data?.filter(
                (row) =>
                    (row.TITAL === "Ledger+Mrg+Coll" || row.TITAL === "Net") &&
                    !excludedValues.includes(row.TITAL)
            )
            : []),
    ];

    return (
        <>

            <Card >
                <CardHeader >
                    <CardTitle className="font-semibold">Funds</CardTitle>
                </CardHeader>
                <CardContent className="px-2 py-2">
                    <LedgerDataDisplay
                        error={error}
                        loading={loading}
                        ledgerMrgCollAmount={ledgerMrgCollAmount}
                        filteredDataWithLedgerMrgColl={filteredDataWithLedgerMrgColl}
                        groupedTotals={groupedTotals}
                        data={data ?? []}
                    />
                </CardContent>
            </Card>

            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    );
};

