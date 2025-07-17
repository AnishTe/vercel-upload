import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export type RightsIssueLogs = {
  msgStatus: any
  clientId: string
  mobileNo: string
  ownMsgStatus: string
  whMsgStatus: string
  message: string
  createdTime: string
  updatedTime: string
  reason: string

}

export const columns: ColumnDef<RightsIssueLogs>[] = [
  {
    id: "clientId",
    accessorKey: "clientId",
    header: "Client ID",
    cell: ({ row }) => {
      const value = row.original.clientId ?? "-";
      return <div className="font-medium">{value}</div>;
    }
  },
  {
    id: "mobileNo",
    accessorKey: "mobileNo",
    header: "Mobile",
  },
  {
    id: "ownMsgStatus",
    accessorKey: "ownMsgStatus",
    header: "Own Status",
    cell: ({ row }) => {
      const status = row.original.ownMsgStatus?.toUpperCase() || ""

      // Define badge variants based on status
      let variant: "default" | "secondary" | "destructive" = "default"
      if (status === "SUCCESS") variant = "secondary"
      else if (status === "FAILED") variant = "destructive"

      return (
        <Badge
          variant={variant}
          className={`
          ${status === "SUCCESS" ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-80" : ""}
          ${status === "FAILED" ? "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800" : ""}
          ${status === "DEFAULT" ? "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800" : ""}
        `}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "whMsgStatus",
    accessorKey: "whMsgStatus",
    header: "Whatsapp Status",
    cell: ({ row }) => {
      const status = row.original.whMsgStatus?.toUpperCase() || ""

      // Define badge variants based on status
      let variant: "default" | "secondary" | "destructive" = "default"
      if (status === "SUCCESS") variant = "secondary"
      else if (status === "FAILED") variant = "destructive"

      return (
        <Badge
          variant={variant}
          className={`
          ${status === "SUCCESS" ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-80" : ""}
          ${status === "FAILED" ? "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800" : ""}
          ${status === "DEFAULT" ? "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800" : ""}
        `}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "reason",
    accessorKey: "reason",
    header: "Reason",
  },
  {
    id: "message",
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => {
      const message = row.original.message || ""
      const status = row.original.msgStatus?.toUpperCase() || ""

      // Determine icon based on status
      let Icon = Info
      let iconColor = "text-blue-500"

      if (status === "SUCCESS") {
        Icon = CheckCircle
        iconColor = "text-green-500"
      } else if (status === "FAILED") {
        Icon = AlertCircle
        iconColor = "text-red-500"
      }

      return (
        <div className="flex items-start gap-2 max-w-[300px]">
          <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
          <span className="text-left break-words">{message}</span>
        </div>
      )
    },
  },
  {
    id: "createdTime",
    accessorKey: "createdTime",
    header: "Created Date",
    cell: ({ row }) => {
      const value = row.original.createdTime
      return value
        ? new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        : "-"
    },
  },
  {
    id: "updatedTime",
    accessorKey: "updatedTime",
    header: "Last Updated Date",
    cell: ({ row }) => {
      const value = row.original.updatedTime
      return value
        ? new Date(value).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        : "-"
    },
  },
]

