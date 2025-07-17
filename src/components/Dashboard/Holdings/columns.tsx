"use client"

import { ColumnDef } from "@tanstack/react-table"
type ConditionalColumn = [string, { value: string }[]][]

export type CustomColumnDef<T> = ColumnDef<T> & {
  conditionalColumn?: ConditionalColumn
  hidden?: boolean
  deselected?: boolean
  disabled?: boolean
  hiddenColumns?: string[] // Add this new property
  dtRender?: any
}

export type Holding = {
  DP_ID: string
  BO_ID: string
  SCRIP_NAME: string
  ISIN: string
  SCRIP_SYMBOL: string
  SCRIP_VALUE: number
  PRICEDATE: string
  NET: number
  FreeQTY: number
  BRBENQTY: number
  COLQTY: number
  SOHQTY: number
  PLedgeQTY: number
  LockinQty: number
  PLEDGE_QTY: number
  INSHORT: number
  OUTSHORT: number
  AMOUNT: number
  PERCENT_HOLD: number
}

export const selectedColumn: ColumnDef<Holding>[] = [
  {
    id: "scripName", // Unique key for column data access
    accessorKey: "scripName", // Unique key for column data access
    header: "Scrip Name", // Column header name
    cell: ({ row }) => row.original.SCRIP_NAME, // Cell renderer (if needed)
  },
  {
    id: "percentageOfHold",
    accessorKey: "percentageOfHold",
    header: "Percentage of Hold",
    cell: ({ row }) => row.original.PERCENT_HOLD,
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => row.original.NET,
  },
  {
    id: "price",
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => row.original.SCRIP_VALUE,
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => row.original.AMOUNT,
  },
]

export const columns: CustomColumnDef<Holding>[] = [
  // {
  //   id: "BOID",
  //   accessorFn: row => `${row.DP_ID}${row.BO_ID}`,
  //   header: "BOID",
  // },
  {
    id: "BO_ID",
    accessorKey: "BO_ID",
    header: "BOID",
    cell: ({ row }) => {
      const dpId = row.original["DP_ID"]
      const boId = row.original["BO_ID"]
      return <div className="flex items-center">
        <span>{dpId}</span>
        <span>{boId}</span>
      </div>
    }
  },
  {
    id: "SCRIP_NAME",
    accessorKey: "SCRIP_NAME",
    header: "Scrip Name",
    hiddenColumns: ["SCRIP_SYMBOL", "ISIN"],
    cell: ({ row }) => {
      const scripName: any = row["SCRIP_NAME"] || "";
      const [firstPart, secondPart] = scripName?.split("#");
      return (
        <div >
          <div>{firstPart}</div>
          <div className="text-sm text-gray-500">{secondPart}</div>
        </div>
      );
    },
  },
  {
    id: "COLQTY",
    accessorKey: "COLQTY",
    header: "TMCM Pledge",
  },
  {
    id: "BRBENQTY",
    accessorKey: "BRBENQTY",
    header: "Other Pledge",
  },
  {
    id: "NET",
    accessorKey: "NET",
    header: "Net Quantity",
  },

  {
    id: "SCRIP_VALUE",
    accessorKey: "SCRIP_VALUE",
    header: "Closing Price",
    // cell: ({ row }) => {
    //   const amount = parseFloat(row["SCRIP_VALUE"])
    //   const formatted = new Intl.NumberFormat("en-IN", {
    //     style: "currency",
    //     currency: "INR"
    //   }).format(amount)
    //   return formatted
    // },

    dtRender: function (data, type, row) {
      const rawValue = parseFloat(data) // Make sure this is the numeric value
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(rawValue)

      if (type === 'display') {
        return `<span data-sort="${rawValue}">${formatted}</span>`
      }

      return rawValue
    }
  },

  {
    id: "AMOUNT",
    accessorKey: "AMOUNT",
    header: "Amount",

    dtRender: function (data, type, row) {
      const rawValue = parseFloat(data) // Make sure this is the numeric value
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(rawValue)

      if (type === 'display') {
        return `<span data-sort="${rawValue}">${formatted}</span>`
      }

      return rawValue
    }


    // cell: ({ row }) => {
    //   const amount = parseFloat(row["AMOUNT"])
    //   const formatted = new Intl.NumberFormat("en-IN", {
    //     style: "currency",
    //     currency: "INR"
    //   }).format(amount)
    //   return formatted
    // },
  },
  {
    id: "PERCENT_HOLD",
    accessorKey: "PERCENT_HOLD",
    header: "Percent of Hold",
    cell: ({ row }) => {
      const value = row.original?.PERCENT_HOLD;
      let percent: number = 0;

      if (typeof value === 'string') {
        percent = parseFloat(value);
      } else if (typeof value === 'number') {
        percent = value;
      }
      return isNaN(percent) ? "-" : `${percent.toFixed(2)}%`;
    },
  },

  {
    id: "ISIN",
    accessorKey: "ISIN",
    header: "ISIN",
    deselected: true
  },
  {
    id: "SCRIP_SYMBOL",
    accessorKey: "SCRIP_SYMBOL",
    header: "Scrip Symbol",
    deselected: true
  },

]
// export const columns: CustomColumnDef<Holding>[] = [
//   // {
//   //   id: "BOID",
//   //   accessorFn: row => `${row.DP_ID}${row.BO_ID}`,
//   //   header: "BOID",
//   // },
//   {
//     id: "BOID",
//     accessorKey: "BOID",
//     header: "BOID",
//     cell: ({ row }) => {
//       console.log(row)
//       console.log(row["DP_ID"])
//       console.log(row["BO_ID"])
//       return <div className="flex items-center gap-2">
//         <span>{row["DP_ID"]}</span>
//         <span>{row["BO_ID"]}</span>
//       </div>
//     }
//   },
//   {
//     id: "SCRIP_NAME",
//     accessorKey: "SCRIP_NAME",
//     header: "Scrip Name",
//     hiddenColumns: ["SCRIP_SYMBOL", "ISIN"],
//     cell: ({ row }) => {
//       const scripName: any = row.getValue("SCRIP_NAME") || "";
//       const [firstPart, secondPart] = scripName?.split("#");
//       return (
//         <div>
//           <div>{firstPart}</div>
//           <div className="text-sm text-gray-500">{secondPart}</div>
//         </div>
//       );
//     },
//   },
//   {
//     id: "COLQTY",
//     accessorKey: "COLQTY",
//     header: "TMCM Pledge",
//   },
//   {
//     id: "BRBENQTY",
//     accessorKey: "BRBENQTY",
//     header: "Other Pledge",
//   },
//   {
//     id: "NET",
//     accessorKey: "NET",
//     header: "Net Quantity",
//   },

//   {
//     id: "SCRIP_VALUE",
//     accessorKey: "SCRIP_VALUE",
//     header: "Closing Price",
//     cell: ({ row }) => {
//       const amount = parseFloat(row.getValue("SCRIP_VALUE"))
//       const formatted = new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR"
//       }).format(amount)
//       return formatted
//     },
//   },

//   {
//     id: "AMOUNT",
//     accessorKey: "AMOUNT",
//     header: "Amount",
//     cell: ({ row }) => {
//       const amount = parseFloat(row.getValue("AMOUNT"))
//       const formatted = new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR"
//       }).format(amount)
//       return formatted
//     },
//   },
//   {
//     id: "PERCENT_HOLD",
//     accessorKey: "PERCENT_HOLD",
//     header: "Percent of Hold",
//     cell: ({ row }) => {
//       const value: number | string | null | undefined = row.getValue("PERCENT_HOLD");
//       const percent = value === null || value === undefined ? 0 : parseFloat(value as string);
//       return `${percent.toFixed(2)}%`;
//     },
//   },

//   {
//     id: "ISIN",
//     accessorKey: "ISIN",
//     header: "ISIN",
//     hidden: true
//   },
//   {
//     id: "SCRIP_SYMBOL",
//     accessorKey: "SCRIP_SYMBOL",
//     header: "Scrip Symbol",
//     hidden: true
//   },

// ]