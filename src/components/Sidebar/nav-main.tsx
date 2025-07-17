"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { useUser } from "@/contexts/UserContext"
import { getLocalStorage } from "@/utils/localStorage"
import React from "react"

type AccessItem = {
  title: string
  url: string
  read?: boolean
  external?: boolean
  write?: boolean
  icon?: LucideIcon
  items?: AccessItem[]
}

export function NavMain({
  items,
  setOpen,
  branchIcon,
}: {
  items: AccessItem[]
  setOpen: (open: boolean) => void
  branchIcon?: LucideIcon
}) {
  const { isMobile, state } = useSidebar()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { loginType } = useUser()

  const isActive = (url: string) => {
    const compatibleUrl = getCompatibleUrl(url, true) // Remove query params
    const currentPath =
      process.env.NODE_ENV === "production" ? (pathname.endsWith(".html") ? pathname : `${pathname}.html`) : pathname

    return currentPath === compatibleUrl
  }

  // Check if the item or any of its descendants at any level is active
  const hasActiveDescendant = (item: AccessItem): boolean => {
    // Check if the current item is active
    if (isActive(item.url)) {
      return true
    }

    // Check if any direct child is active
    if (item.items) {
      return item.items.some((subItem) => hasActiveDescendant(subItem))
    }

    return false
  }

  // Render a nested menu item with potential sub-items
  const renderNestedMenuItem = (item: AccessItem, level = 0) => {
    const isItemActive = isActive(item.url)
    const hasActiveChild = item.items && item.items.some((subItem) => hasActiveDescendant(subItem))

    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={hasActiveChild} // Keep parent open if any descendant is active
        className="group/collapsible"
      >
        <SidebarMenuItem>
          {item.items ? (
            <>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => {
                    if (state === "collapsed") {
                      setOpen(true)
                    }
                  }}
                // isActive={isItemActive || hasActiveChild}
                >
                  {loginType === "Branch" && branchIcon
                    ? React.createElement(branchIcon)
                    : item.icon
                      ? React.createElement(item.icon)
                      : null}
                  <span title={item.title}>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => {
                    // If this sub-item has its own items, render it as a nested menu item
                    if (subItem.items && subItem.items.length > 0) {
                      return renderNestedMenuItem(subItem, level + 1)
                    }

                    // Otherwise, render it as a simple sub-item
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          onClick={() => {
                            if (state === "collapsed") {
                              setOpen(true)
                            }
                          }}
                          isActive={isActive(subItem.url)}
                        >
                          <a href={getCompatibleUrl(subItem.url)} title={subItem.title}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </>
          ) : (
            <SidebarMenuButton
              tooltip={item.title}
              onClick={() => {
                if (state === "collapsed") {
                  setOpen(true)
                }
              }}
              asChild
              isActive={isItemActive}
            >
              {item.external ? (
                <a
                  title={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              ) : (
                <a title={item.title} href={getCompatibleUrl(item.url)} className="flex items-center w-full gap-2">
                  {loginType === "Branch" && branchIcon
                    ? React.createElement(branchIcon)
                    : item.icon
                      ? React.createElement(item.icon)
                      : null}
                  <span>{item.title}</span>
                </a>
              )}
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  const renderItems = (items: AccessItem[] | string | undefined | null) => {
    // Ensure items is always an array
    const ensureArray = (data: AccessItem[] | string | undefined | null): AccessItem[] => {
      if (!data) {
        console.error("renderItems received null or undefined.")
        return []
      }

      // If it's already an array, return it as-is
      if (Array.isArray(data)) {
        return data
      }

      // If it's a string, try parsing it
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            return parsed
          } else {
            console.error("Parsed items is not an array:", parsed)
            return []
          }
        } catch (error) {
          console.error("Failed to parse items string:", error)
          return []
        }
      }

      // If it's neither an array nor a string, return an empty array
      console.error("renderItems received an invalid type:", typeof data)
      return []
    }

    const normalizedItems = ensureArray(items) // Normalize items to an array

    // Now safely map over the normalized array and use the recursive rendering function
    return normalizedItems.map((item) => renderNestedMenuItem(item))
  }

  return (
    <SidebarGroup>
      {/* {!isMobile && state !== "collapsed" && (
        <span className="text-md m-2 mt-0 font-semibold text-left">
          {loginType} ID:{" "}
          {searchParams.get("clientId") && searchParams.get("branchClientCheck") === "true"
            ? searchParams.get("clientId")
            : getLocalStorage(`current${loginType}Id`)}
        </span>
      )} */}

      {!isMobile && state !== "collapsed" && (
        <span className="text-md m-2 mt-0 font-semibold text-left">
          {loginType} ID:{" "}
          {(() => {
            const clientId = searchParams.get("clientId");
            const isBranchCheck = searchParams.get("branchClientCheck") === "true";
            const isfamilyClientCheck = searchParams.get("familyClientCheck") === "true";

            if (clientId && (isBranchCheck || isfamilyClientCheck)) {
              return clientId;
            }

            return getLocalStorage(`current${loginType}Id`);
          })()}
        </span>
      )}


      <SidebarMenu>{renderItems(items)}</SidebarMenu>
    </SidebarGroup>
  )
}
