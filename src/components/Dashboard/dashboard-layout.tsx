"use client"

import React, { Suspense } from 'react'
import {

  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/Sidebar/app-sidebar"
import { useIsMobile } from '@/hooks/use-mobile'
import SessionStorageHandler from '@/components/SessionStorageHandler'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full">

        <Suspense fallback={<div>Loading sidebar...</div>}>
          <AppSidebar />
        </Suspense>

        <div className="flex-1 overflow-auto ">
          <SidebarInset className="flex flex-col h-full">
            {isMobile &&
              <header className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-8">
                <div className="flex items-center justify-between w-full px-0">
                  <SidebarTrigger className="ml-1" />
                </div>
              </header>
            }

            <main className="flex-1 overflow-auto p-1">
              <SessionStorageHandler />
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}