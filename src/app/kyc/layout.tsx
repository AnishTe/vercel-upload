import type React from "react"
import { KYCProvider } from "@/contexts/kyc-context"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";

import type { Metadata } from 'next'
import { KYCLoadingOverlay } from "@/components/KYC/kyc-loading-overlay";
import { FloatingErrorPanel } from "@/components/KYC/FloatingErrorPanel";
import { KYCErrorProvider } from "@/contexts/KYCErrorContext";

export const metadata: Metadata = {
  title: 'KYC Verification',
  description: 'PESB - Capital',
  generator: 'https://capital.pesb.co.in:5500/',
  // manifest: '/manifest.json',
}

export default function KYCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white relative">
      <KYCErrorProvider>

        {/* Floating Error Panel */}
        <FloatingErrorPanel />

        <div className="container mx-auto py-10 px-4 max-w-7xl relative z-10">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              KYC Verification
            </h1>
            <p className="text-center text-gray-600 max-w-md">
              Complete your verification in a few simple steps to start trading
            </p>
          </div>

          {/* Main Form + Overlay */}
          <KYCProvider>
            {children}
            <KYCLoadingOverlay />
          </KYCProvider>

          <Toaster position="top-right" />
        </div>

      </KYCErrorProvider>
    </div>
  );
}

