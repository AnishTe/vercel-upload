"use client"

import * as React from "react"
import { CandlestickChart, ExternalLink, FileLineChartIcon as FileChartLine, FolderTree, HomeIcon as House, Landmark, LayoutDashboard, Percent, PieChart, RefreshCw, Shield, Users } from "lucide-react"

import { NavMain } from "@/components/Sidebar/nav-main"
import { NavUser } from "@/components/Sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { useUser } from "@/contexts/UserContext"
import Cookies from "js-cookie"; // Client-side cookie handling
import { useSearchParams } from "next/navigation"
import { getLocalStorage } from "@/utils/localStorage"


// const usefulReportLink =
//   userId && userToken
//     ? `https://backoffice.pesb.co.in:444/WebClient/index.cfm?Link=1&reqtype=mf&Target_App=CLIENTSUMMARY&Product=MUTUALFUNDS&UserId=${encodeURIComponent(
//       userId
//     )}&SessionId=${encodeURIComponent(userToken)}`
//     : null;

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/client/dashboard",
      icon: House,
    },
    {
      title: "MTF Dashboard",
      url: "/client/dashboard/mtf-dashboard",
      icon: House,
    },
    {
      title: "Open Position",
      url: "/client/dashboard/position",
      icon: FileChartLine,
    },
    {
      title: "Ledger Book",
      url: "/client/dashboard/ledger-book",
      icon: FileChartLine,
    },
    {
      title: "Holdings",
      url: "/client/dashboard/holdings",
      icon: PieChart,
    },
    // {
    //   title: "Holding Mismatch",
    //   url: "/client/dashboard/holdingMismatch",
    //   icon: FileChartLine,
    // },
    {
      title: "Manage Funds",
      url: "/client/dashboard/limit-transfer",
      icon: FileChartLine,
    },
    {
      title: "Annual P&L",
      url: "/client/dashboard/annual_pl",
      icon: FileChartLine,
    },
    {
      title: "Trade Report",
      url: "/client/dashboard/tradeReport",
      icon: FileChartLine,
    },

    {
      title: "IT Reports",
      url: "#",
      icon: FolderTree,
      items: [
        {
          title: "IT Report Equity",
          url: "/client/dashboard/it_report_equity",
          icon: FileChartLine,
        },
        {
          title: "IT Report FNO",
          url: "/client/dashboard/it_report_fno",
          icon: FileChartLine,
        },
        {
          title: "IT Report MCX",
          url: "/client/dashboard/it_report_mcx",
          icon: FileChartLine,
        },
        {
          title: "Summarized PL Equity",
          url: "/client/dashboard/summarized_pl",
          icon: FileChartLine,
        },
        {
          title: "STT Statement",
          url: "/client/dashboard/downloadStatement",
          icon: FileChartLine,
        },
      ],
    },
    {
      title: "IPO",
      url: "/client/dashboard/ipo",
      icon: PieChart,
    },
    {
      title: "Pledge",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "Margin Pledge",
          url: "/client/dashboard/pledge/margin-pledge",
        },
        {
          title: "MTF Pledge",
          url: "/client/dashboard/pledge/mtf-pledge",
        },
      ],
    },
    {
      title: "Buyback",
      url: "/client/dashboard/buyback",
      read: true,
      write: true,
      icon: CandlestickChart,
    },
  ],

  branchNav: [
    { "title": "Client Profile", "url": "/branch/dashboard/viewClientDetails", "read": true, "write": true },
    {
      "title": "Pledge",
      "url": "#",
      "items": [
        {
          "title": "Margin Pledge",
          "url": "/branch/dashboard/pledge/margin-pledge"
        },
        {
          "title": "MTF Pledge",
          "url": "/branch/dashboard/pledge/mtf-pledge"
        }
      ]
    },
    {
      "title": "Buyback",
      "url": "#",
      "items": [
        {
          "title": "CDSL Buyback",
          "url": "/branch/dashboard/buyback"
        },
        {
          "title": "Manage Orders",
          "url": "/branch/dashboard/buyback/manage-order-branch"
        },
        {
          "title": "External DP / NSDL Buyback",
          "url": "/branch/dashboard/buyback/cdsl-other-buyback-branch"
        },
        {
          "title": "OrderBook",
          "url": "/branch/dashboard/buyback/buyback-orderbook-branch"
        }
      ]
    },
    {
      title: "IPO",
      url: "/branch/dashboard/ipo",
      // icon: PieChart,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, state, setOpen } = useSidebar()
  const { currentUser, loginType, accountType, userAccess } = useUser()
  const [isLoading, setIsLoading] = React.useState(true)
  const userId = getLocalStorage("currentClientId")
  const userToken = getLocalStorage(`userToken_${userId}`)

  const searchParams = useSearchParams();
  const searchParamsClientId = searchParams.get('clientId');
  const searchParamsBranchClientCheck = searchParams.get('branchClientCheck');
  const searchParamsFamilyClientCheck = searchParams.get('familyClientCheck');

  const usefulReportLink = React.useMemo(() => {
    if (userId && userToken) {
      return `https://backoffice.pesb.co.in:444/WebClient/index.cfm?Link=1&reqtype=mf&Target_App=CLIENTSUMMARY&Product=MUTUALFUNDS&UserId=${encodeURIComponent(
        userId,
      )}&SessionId=${encodeURIComponent(userToken)}`
    }
    return null
  }, [userId, userToken])

  React.useEffect(() => {
    // Simulate a short delay to ensure user context is fully loaded
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const renderSidebarContent = () => {
    if (isLoading) {
      return (
        <SidebarGroup>
          <SidebarMenu>
            {Array.from({ length: 15 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )
    }

    if (accountType === "employee" && loginType === "Branch" && userAccess) {
      return <NavMain items={userAccess} setOpen={setOpen} branchIcon={LayoutDashboard} />
    }

    if (accountType === "branch" && (loginType === "Branch" || "branch")) {
      // setTimeout(() => {
      //   localStorage.setItem(`userDetails_${userId}`, JSON.stringify(data.branchNav))
      return <NavMain items={data.branchNav} setOpen={setOpen} />
      // }, 0)
    }

    // if (loginType === "Client") {
    //   return <NavMain items={data.navMain} setOpen={setOpen} />
    // }

    if (loginType === "Client") {
      const shouldAddExtraItems =
        (!searchParamsClientId || !searchParamsBranchClientCheck) &&
        searchParamsFamilyClientCheck !== "true";

      const updatedNavMain = shouldAddExtraItems
        ? [
          ...data.navMain,
          {
            title: "Family Details",
            url: "/client/dashboard/viewFamilyDetails",
            read: true,
            write: true,
            icon: Users,
          },
          {
            title: "Other Useful Reports",
            url: usefulReportLink || "",
            icon: ExternalLink,
            external: true,
          },
        ]
        : [...data.navMain];

      return <NavMain items={updatedNavMain} setOpen={setOpen} />;
    }



    return null // Or a default view for unauthorized users
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-center w-full">
              {/* Sidebar Menu Button */}
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {state === "collapsed" ? (
                  <Image src="/favicon.png" alt="PESB Logo" width={30} height={30} />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src="/faviconFull.jpg"
                      alt="PESB Logo"
                      // loading="lazy"
                      // width={30}
                      // height={30}
                      priority
                      fill
                      style={{ objectFit: "contain" }}
                      className="max-w-[200px]"
                    />
                  </div>
                )}
              </SidebarMenuButton>

              {!isMobile && state !== "collapsed" && <SidebarTrigger className="truncate ml-1" />}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>{renderSidebarContent()}</SidebarContent>

      <SidebarFooter>
        {/* <React.Suspense fallback={<div>Loading...</div>}> */}
        <NavUser />
        {/* </React.Suspense> */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

