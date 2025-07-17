"use client"

import { useState, useEffect } from "react"
import { ChevronsUpDown, LogOut, Sun, Moon, Monitor, SquareArrowOutUpRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

import { useTheme } from "next-themes"
import SignOutModal from "../SignOutModal"
import BranchSignOutModal from "../BranchSignOutModal"
import { useUser } from "@/contexts/UserContext"
import { Button } from "../ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { CustomModal } from "./user-details-dialog"

export function NavUser() {
  const searchParams = useSearchParams()
  const { currentUser, loginType, accountType, userAccess, userDetails } = useUser()
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [paramsData, setParamsData] = useState<any>(userDetails || {})
  const [isLogout, setLogout] = useState(true)
  const [isSignOutModalOpen, setSignOutModalOpen] = useState(false)
  const [isUserDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const clientId = searchParams.get("clientId")
    const isBranchCheck = searchParams.get("branchClientCheck") === "true"
    const isfamilyClientCheck = searchParams.get("familyClientCheck") === "true"
    const rawData = searchParams.get("data")

    const decodedData = rawData ? JSON.parse(decodeURIComponent(rawData)) : {}

    if (clientId && (isBranchCheck || isfamilyClientCheck)) {
      const key = isBranchCheck ? `branchClientCheck_${clientId}` : `familyClientCheck_${clientId}`

      const storedValue = sessionStorage.getItem(key)
      const parsedValue = storedValue ? JSON.parse(storedValue) : null

      setLogout(false)
      setParamsData(parsedValue)
    } else {
      setParamsData(userDetails)
    }
  }, [searchParams, userDetails])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        <span className="w-20 h-4 bg-gray-300 rounded"></span>
      </div>
    )
  }

  if (!currentUser && !sessionStorage.getItem("branchClientCheck") && !sessionStorage.getItem("familyClientCheck")) {
    return (
      <Button
        className="cursor-pointer"
        onClick={() =>
          pathname.startsWith("/client")
            ? router.push("/")
            : router.push(getCompatibleUrl("/authentication/branch/login"))
        }
      >
        <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
        Back to Login
      </Button>
    )
  }

  function getInitials(name: string | undefined | null): string {
    if (!name) {
      const possibleNames = [
        paramsData?.branchName,
        paramsData?.clientName,
        paramsData?.name,
        paramsData?.userName,
        paramsData?.fullName,
        paramsData?.displayName,
      ].filter(Boolean)

      if (possibleNames.length > 0) {
        name = possibleNames[0]
      } else {
        return "NA"
      }
    }

    const words = name?.split(" ").filter((word) => word.length > 0)
    if (words?.length === 0) return "NA"

    const initials = words
      ?.map((word) => word[0]?.toUpperCase())
      .filter(Boolean)
      .join("")

    return initials || "NA"
  }

  const handleUserDetailsClick = () => {
    console.log("Opening user details dialog")
    setUserDetailsDialogOpen(true)
    // Close the dropdown when modal opens
    setIsDropdownOpen(false)
  }

  const handleUserDetailsClose = () => {
    console.log("Closing user details dialog")
    setUserDetailsDialogOpen(false)
    // Dropdown should remain in its current state
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-2"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={paramsData?.avatar || "/placeholder.svg"}
                    alt={loginType === "branch" ? paramsData?.branchName : paramsData?.clientName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {(() => {
                      const nameToUse =
                        loginType?.toLowerCase() === "branch" ? paramsData?.branchName : paramsData?.clientName
                      return getInitials(nameToUse)
                    })()}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {loginType === "branch" ? paramsData?.branchName : paramsData?.clientName}
                  </span>
                  <span className="truncate text-xs">{paramsData?.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg cursor-pointer"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal" onClick={handleUserDetailsClick}>
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={paramsData?.avatar || "/placeholder.svg"}
                      alt={loginType === "branch" ? paramsData?.branchName : paramsData?.clientName}
                    />
                    <AvatarFallback className="rounded-lg">
                      {(() => {
                        const nameToUse =
                          loginType?.toLowerCase() === "branch" ? paramsData?.branchName : paramsData?.clientName
                        return getInitials(nameToUse)
                      })()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {loginType === "branch" ? paramsData?.branchName : paramsData?.clientName}
                    </span>
                    <span className="truncate text-xs">{paramsData?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer" asChild>
                  <DropdownMenuItem>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    Toggle Theme
                  </DropdownMenuItem>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Light
                    {theme === "light" && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-[1.2rem] w-[1.2rem] mr-2" />
                    Dark
                    {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="h-[1.2rem] w-[1.2rem] mr-2" />
                    System
                    {theme === "system" && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuSeparator />

              {isLogout &&
                !searchParams.get("clientId") &&
                !sessionStorage.getItem(`branchClientCheck_${paramsData?.clientId}`) &&
                !sessionStorage.getItem(`familyClientCheck_${paramsData?.clientId}`) && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setSignOutModalOpen(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Custom User Details Modal */}
      <CustomModal isOpen={isUserDetailsDialogOpen} onClose={handleUserDetailsClose} title="User Details">
        <div className="flex flex-col gap-2">
          {paramsData &&
            Object.entries(paramsData)
              .filter(([key]) => key !== "access")
              .map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1">
                  <span className="font-semibold capitalize text-sm sm:text-base">{key}:</span>
                  <span className="text-sm sm:text-base break-all">{String(value)}</span>
                </div>
              ))}
        </div>
      </CustomModal>

      {/* SignOut Modal */}
      {loginType === "Branch" ? (
        <BranchSignOutModal open={isSignOutModalOpen} onClose={() => setSignOutModalOpen(false)} />
      ) : (
        <SignOutModal open={isSignOutModalOpen} onClose={() => setSignOutModalOpen(false)} />
      )}
    </>
  )
}
