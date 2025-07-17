"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useKYCError } from "@/contexts/KYCErrorContext";
import { AlertTriangle, ArrowBigRightDash, ShieldAlert } from "lucide-react"; // optional icon
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export const FloatingErrorPanel = () => {
    const { errors, scrollToField } = useKYCError();

    const isVisible = Array.isArray(errors) && errors.length > 0;
    if (!isVisible) return null;

    return (
        <>
            {/* ✅ Full Floating Panel for Desktop */}
            <div className="hidden sm:block">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="fixed top-28 left-4 w-72 max-w-[90vw] bg-white border border-red-200 text-red-700 rounded-xl p-4 shadow-xl z-50 max-h-[400px] overflow-y-auto backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                            <strong className="text-sm font-semibold">Please fix the following errors:</strong>
                        </div>

                        <ul className="space-y-2 text-sm pl-3">
                            {errors.map((e) => {
                                const parts = e.path.split(".");
                                const indexMatch = parts.find((p) => /^\d+$/.test(p));
                                const index = indexMatch ? parseInt(indexMatch, 10) + 1 : null;

                                const isNominee = e.path.startsWith("nominees");
                                const isPOA = e.path.startsWith("poas");
                                const isSecondHolder = e.path.startsWith("holders.secondHolder");
                                const isThirdHolder = e.path.startsWith("holders.thirdHolder");

                                const label = isNominee && index
                                    ? `Nominee ${index}:`
                                    : isPOA && index
                                        ? `POA :`
                                        : isSecondHolder
                                            ? "Second Holder:"
                                            : isThirdHolder
                                                ? "Third Holder:"
                                                : "";

                                return (
                                    <li key={e.path}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => scrollToField(e.path)}
                                                        className="flex items-start gap-2 w-full text-left group"
                                                    >
                                                        <ArrowBigRightDash className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />

                                                        <div className="flex flex-col max-w-[13rem] truncate">
                                                            <span className="font-medium leading-tight truncate">{label}</span>
                                                            <span className="text-sm underline group-hover:text-red-500 leading-tight truncate">
                                                                {e.message}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </TooltipTrigger>

                                                <TooltipContent className="max-w-xs break-words text-sm">
                                                    <span className="font-medium">{label}</span> {e.message}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ✅ Inline Alert for Mobile */}
            <div className="block sm:hidden mx-4 mt-4 bg-yellow-50 text-yellow-800 border border-yellow-300 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                    <span>
                        Your form has validation errors. Please scroll through and correct the highlighted fields before proceeding.
                    </span>
                </div>
            </div>
        </>
    );
};

