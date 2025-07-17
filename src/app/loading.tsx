"use client"; // Ensure client-side execution

import { useLoading } from "@/contexts/LoadingContext";
import { TrendingUp } from "lucide-react";

export default function Loading() {
    const { loading } = useLoading();

    if (!loading) return null; // Hide loader when not loading

    return (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                {/* Simple stock chart line spinner */}
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 flex items-center justify-center animate-spin">
                        <TrendingUp className="h-8 w-8 text-primary" />
                    </div>

                    {/* Stock up/down indicators */}
                    <div className="absolute top-0 right-0">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="absolute bottom-0 left-0">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    </div>
                </div>

                <span className="text-sm font-medium text-muted-foreground">Loading</span>
            </div>
        </div>
    );
}
