"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useIPO } from "@/contexts/IPOContext";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";

export type IPODetailsEntry = {
    client_id: string;
    clientName: string;
    pan: string;
    boidsDetails: Array<{
        boid: string;
        dpid: string;
        depository: string;
    }>;
    ipoAppliedStatus: {
        orderStatus: string | null;
        BseStatus: string | null;
    };
};

// ✅ BOID Select Component (Native HTML <select>)
const BoidSelect = ({ boids }: { boids: { boid: string }[] }) => {
    const [selectedBoid, setSelectedBoid] = useState(
        boids.length > 0 ? boids[0].boid : ""
    );

    return (
        <select
            name="boid" // Added name attribute
            aria-label="Select BOID" // Added accessible name
            className="w-[180px] p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={selectedBoid}
            onChange={(e) => setSelectedBoid(e.target.value)}
        >
            {boids.length > 0 ? (
                boids.map((boidDetail) => (
                    <option key={boidDetail.boid} value={boidDetail.boid}>
                        {boidDetail.boid}
                    </option>
                ))
            ) : (
                <option value="" disabled>
                    No BOIDs available
                </option>
            )}
        </select>
    );
};

// ✅ Simple UPI Input (Native <input>)
const isValidUPI = (upi: string): boolean => {
    if (!upi || upi.trim() === "") return false

    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi)
}

const UPIInput = ({ row }) => {
    const [upiId, setUpiId] = useState("")
    const [isValid, setIsValid] = useState(true)
    const [showValidation, setShowValidation] = useState(false)

    // This function will be called on every keystroke
    const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        e.preventDefault()
        const value = e.target.value
        setUpiId(value)

        // Always validate on change, but only show validation if there's input
        const valid = value.trim() === "" || isValidUPI(value)
        setIsValid(valid)

        // Show validation feedback if there's any input
        setShowValidation(value.trim() !== "")
    }

    return (
        <div>
            <Input
                name="upiId"
                id={`upiId_${row.original.client_id}`}
                aria-label="Enter UPI ID"
                type="text"
                autoComplete="off"
                className={`w-[200px] p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                          ${isValid ? "border-gray-300" : "border-red-500"}`}
                value={upiId}
                onChange={handleUpiChange}
                onBlur={() => setShowValidation(upiId.trim() !== "")}
                placeholder="username@bank"
            />
            {showValidation && !isValid && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid UPI ID (username@bank)</p>
            )}
            {showValidation && isValid && upiId.trim() !== "" && <p className="text-green-500 text-xs mt-1">Valid UPI ID</p>}
        </div>
    )
}

// ✅ Updated Columns Definition (Simple & Optimized)
export const columns: ColumnDef<IPODetailsEntry>[] = [
    {
        id: "client_id",
        accessorKey: "client_id",
        header: "Client ID",
        cell: ({ row }) => {
            const value = row.original.client_id ?? "-";
            return <span>{value}</span>;
        }
    },

    {
        id: "clientName",
        accessorKey: "clientName",
        header: "Client Name",
        cell: ({ row }) => {
            const name = row.original.clientName as string;
            const initials = name
                ? name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "";

            // Define color sets for background and text
            const bgColors = [
                "bg-red-500",
                "bg-blue-500",
                "bg-green-500",
                "bg-yellow-500",
                "bg-purple-500",
                "bg-pink-500",
                "bg-indigo-500",
                "bg-teal-500",
            ];
            const textColors = [
                "text-red-700",
                "text-blue-700",
                "text-green-700",
                "text-yellow-700",
                "text-purple-700",
                "text-pink-700",
                "text-indigo-700",
                "text-teal-700",
            ];

            // Pick a random color index
            const randomIndex = Math.floor(Math.random() * bgColors.length);
            const bgColor = bgColors[randomIndex];
            const textColor = textColors[randomIndex];

            return (
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback
                            className={cn(
                                "w-full h-full flex items-center justify-center font-bold",
                                bgColor,
                                // textColor
                            )}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[150px] font-medium" title={name}>
                        {name}
                    </span>
                </div>
            );
        },
    },
    {
        id: "pan",
        accessorKey: "pan",
        header: "PAN",
    },
    {
        id: "boid",
        header: "BOID",
        cell: ({ row }) => {
            const boids = row?.original?.boidsDetails || [];
            return <BoidSelect boids={boids} />;
        },
    },
    {
        id: "upiId",
        header: "UPI ID",
        cell: ({ row }) => {
            return <UPIInput row={row} />
        },
    },
    {
        id: "lot",
        header: "Lot",

    },
    {
        id: "amount",
        header: "Amount",
    },
    {
        id: "orderStatus",
        accessorKey: "orderStatus",
        header: "Order Status",
        cell: ({ row }) => {
            const orderStatus = row.original.ipoAppliedStatus.orderStatus;
            return <span>{orderStatus || ""}</span>;
        },
    },
    {
        id: "bseStatus",
        accessorKey: "BseStatus",
        header: "Status",
        cell: ({ row }) => {
            const BseStatus = row.original.ipoAppliedStatus.BseStatus;
            return <span>{BseStatus || ""}</span>;
        },
    },
];
