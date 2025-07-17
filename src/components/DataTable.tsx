/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import * as React from "react"
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { debounce } from "lodash"
import type { ColumnDef } from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { useUser } from "@/contexts/UserContext"
import Image from "next/image"

type ConditionalColumn = [string, { value: string }[]][]

// Extend the ColumnDef type with our custom properties
type CustomColumnDef<T> = ColumnDef<T> & {
  conditionalColumn?: ConditionalColumn
  hidden?: any
  hiddenColumns?: string[] // Add this new property
  accessorFn?: (row: T) => unknown
}

interface DataTableProps<TData, TValue> {
  columns: any
  data: TData[]
  showAllRows?: boolean
  filterColumn?: string
  filterPlaceholder?: string
  selectableRows?: boolean
  onSelectedRowsChange?: (selectedRows: TData[]) => void
  hiddenColumns?: string[]
  downloadFileName?: string
  expenseDataDetails?: {
    rowKey: string
    rowAmount: string
    rows: any[]
    total: number
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  showAllRows = false,
  filterColumn,
  filterPlaceholder = "Filter...",
  selectableRows = false,
  onSelectedRowsChange,
  hiddenColumns = [],
  downloadFileName = "data",
  expenseDataDetails,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [tableHeight, setTableHeight] = React.useState(typeof window !== "undefined" ? window.innerHeight - 15 * 16 : 0)
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const [tableData, setTableData] = React.useState(data)
  const { userDetails, currentUser } = useUser()
  const prevRowSelection = React.useRef(rowSelection)

  const debouncedOnSelectedRowsChange = React.useMemo(
    () =>
      debounce((selectedRows: TData[]) => {
        if (onSelectedRowsChange) onSelectedRowsChange(selectedRows)
      }, 200),
    [onSelectedRowsChange],
  )

  const downloadButtons = (
    <div className="flex items-center space-x-2 m-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Image
              src="/images/SVG/csv.svg"
              alt="Excel icon"
              width={22}
              height={22}
              priority
              onClick={() => downloadCSV()}
              className="cursor-pointer m-2"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Download CSV</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Image
              src="/images/SVG/excel.svg"
              alt="Excel icon"
              width={30}
              height={30}
              priority
              onClick={() => downloadExcel()}
              className="cursor-pointer m-2"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Download Excel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  React.useEffect(() => {
    const handleResize = () => {
      setTableHeight(window.innerHeight - 15 * 16)
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-"
    }
    if (typeof value === "number") {
      return value
    }
    if (typeof value === "string" && !isNaN(value as any)) {
      if (value.startsWith("0") || value.length > value.replace(/^0+/, "").length) {
        return value
      }
      return Number.parseFloat(value)
    }
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/)) {
      return value.split(" ")[0]
    }
    return value
  }

  const enhancedColumns = React.useMemo(() => {
    return columns
      .filter((column: { conditionalColumn: any; hidden: any; deselected: any }) => {
        if (column.conditionalColumn) {
          for (const [key, conditions] of column.conditionalColumn) {
            const shouldExclude = data.some((row) =>
              conditions.some((condition: { value: any }) => row[key] === condition.value),
            )
            if (shouldExclude) {
              return false
            }
          }
        }
        return !column.hidden
      })
      .map((column: CustomColumnDef<TData>) => ({
        ...column,
        cell: ({ row, ...props }) => {
          const value = row.getValue(column.id)
          const formattedValue = formatValue(value)
          return renderExpandableCell(row, column, props, formattedValue)
        },
      }))
  }, [columns, data]) // Removed formatValue from dependencies

  // Create the table instance
  const table = useReactTable({
    data: tableData,
    columns: selectableRows
      ? [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
        },
        ...enhancedColumns,
      ]
      : enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any, additionalField?: string) => {
        setTableData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              const fieldToUpdate = additionalField || columnId
              return {
                ...row,
                [fieldToUpdate]: value,
              }
            }
            return row
          }),
        )
      },
    },
    enableRowSelection: true,
  })

  // Use a ref to store the latest tableData
  const tableDataRef = React.useRef(tableData)
  React.useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])

  // Debounced function to handle row selection changes
  const handleRowSelectionChange = React.useCallback(
    debounce((newRowSelection: Record<string, boolean>) => {
      if (onSelectedRowsChange) {
        const selectedRowIds = Object.keys(newRowSelection).filter((id) => newRowSelection[id])
        const selectedRows = selectedRowIds.map((rowId) => {
          const rowIndex = Number.parseInt(rowId, 10)
          return tableDataRef.current[rowIndex]
        })
        onSelectedRowsChange(selectedRows)
      }
    }, 200),
    [], // Removed onSelectedRowsChange from dependencies
  )

  // Effect to handle row selection changes
  React.useEffect(() => {
    const isSelectionChanged = JSON.stringify(prevRowSelection.current) !== JSON.stringify(rowSelection)
    if (isSelectionChanged) {
      prevRowSelection.current = rowSelection
      handleRowSelectionChange(rowSelection)
    }
  }, [rowSelection, handleRowSelectionChange])

  React.useEffect(() => {
    if (showAllRows) {
      table.setPageSize(data.length)
    } else {
      table.setPageSize(10)
    }
  }, [showAllRows, data?.length, table])

  React.useEffect(() => {
    const initialVisibility: VisibilityState = {}
    columns.forEach((column: any) => {
      // Default visibility is false for deselected columns
      initialVisibility[column.id] = !column.deselected
    })
    setColumnVisibility(initialVisibility)
  }, [columns])

  const renderExpandableCell = (row: any, column: CustomColumnDef<TData>, props: any, formattedValue: any) => {
    const cellContent = typeof column.cell === "function" ? column.cell({ row, ...props }) : formattedValue

    const columnHiddenColumns = column.hiddenColumns || []

    const hiddenColumnsData = columnHiddenColumns
      .map((columnId) => {
        const matchingColumn = columns.find((col: { id: string }) => col.id === columnId)
        const header = matchingColumn?.header || columnId
        const value = row.original[columnId]

        return matchingColumn && value !== undefined ? { header, value } : null
      })
      .filter((item) => item !== null)

    return (
      <div className="flex items-center">
        {cellContent}
        {hiddenColumnsData.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Table>
                <TableBody>
                  {hiddenColumnsData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item?.header}</TableCell>
                      <TableCell>{item?.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PopoverContent>
          </Popover>
        )}
      </div>
    )
  }

  const getCellValue = (row: any, column: any) => {
    const cellContent = column.columnDef.cell ? column.columnDef.cell({ row }) : row.getValue(column.id)

    if (React.isValidElement(cellContent)) {
      // Handle JSX elements and attempt to extract all child text
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === "string" || typeof node === "number") {
          return String(node)
        }
        if (React.isValidElement(node)) {
          const children = (node.props as { children?: React.ReactNode }).children
          return React.Children.map(children, extractText)?.join("") || ""
        }
        return ""
      }
      return extractText(cellContent)
    }

    if (typeof cellContent === "object" && cellContent !== null) {
      return JSON.stringify(cellContent)
    }

    return cellContent || ""
  }

  const downloadCSV = () => {
    const columns = table.getVisibleFlatColumns().map((column) => column.columnDef.header)

    const formatCurrency = (value: number) => {
      const formattedValue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(value)

      // Wrap in double quotes to prevent splitting on commas
      return `"${formattedValue}"`
    }

    const headerData = [
      ["Pune e Stock Broking Limited"],
      [""],
      [`Name: ${userDetails.clientName}          Client ID: ${currentUser}`],
      [""],
      ...(expenseDataDetails
        ? [
          ["Expenses"],
          ...(expenseDataDetails?.rows?.map((row) => [
            row[expenseDataDetails.rowKey],
            formatCurrency(row[expenseDataDetails.rowAmount]),
          ]) ?? []),
          ["Total Expenses", formatCurrency(expenseDataDetails?.total ?? 0)],
          [""],
        ]
        : []),
      [columns], // Add table headers after expenses (if present)
    ]

    const rows = table.getRowModel().rows.map((row) =>
      table.getVisibleFlatColumns().map((col) => {
        const value = formatValue(getCellValue(row, col))
        return /[,₹]/.test(value) ? `"${value}"` : value
      }),
    )

    // Ensure CSV is saved with UTF-8 BOM to properly display ₹ symbol
    const csvContent =
      "\uFEFF" +
      headerData
        .concat(rows)
        .map((row) => row.join(","))
        .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, `${downloadFileName}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.csv`)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const columns: any[] = table.getVisibleFlatColumns().map((column) => column.columnDef.header)

    const headerData = [
      ["Pune e Stock Broking Limited"],
      [""],
      [`Name: ${userDetails.clientName}          Client ID: ${currentUser}`],
      [""],
    ]

    const rows = table
      .getRowModel()
      .rows.map((row) => table.getVisibleFlatColumns().map((col) => formatValue(getCellValue(row, col))))

    // Title and metadata
    doc.text("Pune e Stock Broking Limited", 14, 10)
    doc.text(`Name: ${userDetails.clientName}          Client ID: ${currentUser}`, 14, 20)

    // Table content
    autoTable(doc, {
      startY: 30,
      head: [columns],
      body: rows,
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    doc.save(`data_${timestamp}.pdf`)
  }

  const downloadExcel = () => {
    const columns = table.getVisibleFlatColumns().map((column) => column.columnDef.header)
    const rows = table.getRowModel().rows.map((row) =>
      table.getVisibleFlatColumns().map((col) => {
        const value = getCellValue(row, col)
        return formatValue(value)
      }),
    )

    const jsonData = rows.map((row) => {
      const obj: any = {}
      columns.forEach((col, index) => {
        obj[String(col)] = row[index]
      })
      return obj
    })

    const createCenteredRow = (content: string, isMerged = true) => {
      const row = Array(columns.length).fill("")
      row[0] = content
      return { data: row, isMerged }
    }

    const createSpecialRow = (content: string) => {
      return { data: [content], isSpecial: true }
    }

    const formatCurrencyWithColor = (value: number) => {
      const formattedValue = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)
      return {
        v: formattedValue,
        s: {
          font: { color: { rgb: value >= 0 ? "008000" : "FF0000" } },
        },
      }
    }

    const headerData = [
      createCenteredRow("Pune e Stock Broking Limited"),
      createCenteredRow(""),
      createCenteredRow(`Name: ${userDetails.clientName}          Client ID: ${currentUser}`),
      createCenteredRow(""),
      ...(expenseDataDetails
        ? [
          createSpecialRow("Expenses"),
          ...(expenseDataDetails?.rows?.map((row) => [
            row[expenseDataDetails.rowKey],
            formatCurrencyWithColor(row[expenseDataDetails.rowAmount]),
          ]) ?? []),
          ["Total Expenses", formatCurrencyWithColor(expenseDataDetails?.total ?? 0)],
          createCenteredRow(""),
        ]
        : []),
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(headerData.map((row) => (Array.isArray(row) ? row : row.data || [])))

    // Apply header styles for bold, bigger font, and centered alignment
    const headerRowsToStyle = [0, 2] // Rows to apply header formatting
    headerRowsToStyle.forEach((rowIdx) => {
      const cellRef = `A${rowIdx + 1}`
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, sz: rowIdx === 0 ? 16 : 14 },
          alignment: { horizontal: "center", vertical: "center" },
        }
      }
    })

    // Apply merges for centered rows
    const merges: XLSX.Range[] = headerData
      .map((row, rowIndex) =>
        "isMerged" in row && row.isMerged
          ? { s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: columns.length - 1 } }
          : null,
      )
      .filter(Boolean) as XLSX.Range[]

    worksheet["!merges"] = merges

    // Freeze headers
    worksheet["!freeze"] = { xSplit: 0, ySplit: headerData.length }

    // Add data to the sheet
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: -1 })
    XLSX.utils.sheet_add_aoa(
      worksheet,
      jsonData.map((row) => Object.values(row)),
      { origin: -1 },
    )

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const filename = `${downloadFileName}_${timestamp}.xlsx`

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        {filterColumn && (
          <Input
            placeholder={filterPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(filterColumn)?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              View Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column: any) => {
                const isDisabled = column?.columnDef.disabled
                const deselected = column?.columnDef.deselected
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className={`capitalize ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    checked={columnVisibility[column.id]}
                    disabled={isDisabled} // Disable the option if `column.disabled` is true
                    onCheckedChange={(value) => {
                      if (!isDisabled) {
                        column.toggleVisibility(!!value)
                      }
                    }}
                  >
                    {column.columnDef.header}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {downloadButtons}
      </div>

      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-y-auto"
        style={{
          height: `${Math.min(tableHeight, table?.getRowModel().rows?.length * 40 + 50)}px`,
        }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="p-2 text-foreground sticky top-0 bg-background z-10">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => header.column.toggleSorting()}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <ArrowUpDown className="h-1 w-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={`row_${row.id}`} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={`cell_${row.id}_${cell.column.id}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!showAllRows && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

