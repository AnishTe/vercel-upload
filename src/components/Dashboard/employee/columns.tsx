import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Employee = {
  original: Employee
  id: number
  branchCode: string
  branchName: string
  branchHead: string // Change from number to string to match the form
  branchUserId: string
  accountType: string
  emailId: string
  telNo: string
  activeStatus: string
  address: string
  state: string
  city: string
  zipCode: string
  accountLocked: string
  mainSub: string
  mainBranchCode: string
  password: string
}

export type CustomColumnDef<T> = ColumnDef<T> & {
  deselected?: boolean
  hidden?: boolean
}

export const columns: CustomColumnDef<Employee>[] = [
  {
    id: "branchCode",
    accessorKey: "branchCode",
    header: "Branch Code",
  },
  {
    id: "branchUserId",
    accessorKey: "branchUserId",
    header: "Branch User ID",
  },
  {
    id: "branchName",
    accessorKey: "branchName",
    header: "Branch Name",
  },
  {
    id: "emailId",
    accessorKey: "emailId",
    header: "Email Id",
  },
  {
    id: "telNo",
    accessorKey: "telNo",
    header: "Mobile No",
  },

  {
    id: "branchHead",
    accessorKey: "branchHead",
    header: "Branch Head",
    hidden: true
  },

  {
    id: "accountType",
    accessorKey: "accountType",
    header: "Account Type",
  },
  {
    id: "accountLocked",
    accessorKey: "accountLocked",
    header: "Account Locked",
    hidden: true
  },
  {
    id: "activeStatus",
    accessorKey: "activeStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.activeStatus
      return (
        <Badge
          variant={status === "A" ? "default" : "secondary"}
          className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${status === "A"
              ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
              : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
            }
          `}
        >
          {status === "A" ? "ACTIVE" : "INACTIVE"}
        </Badge>
      )
    },
  },
]

