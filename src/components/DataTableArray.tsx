/* eslint-disable react-hooks/exhaustive-deps */
"use client"

declare global {
    interface Window {
        jQuery: any;
        $: any;
    }
}

import React, { useEffect, useRef, useMemo, useState, useImperativeHandle } from "react"
import $ from "jquery"
import 'mark.js/dist/jquery.mark.js'; // This attaches mark.js to jQuery

window.$ = window.jQuery = $;
import "datatables.net";
import "datatables.net-dt"
import "datatables.net-responsive-dt"
import "datatables.net-select-dt"
import "datatables.net-fixedheader"
// import "datatables.net-buttons-dt"
// import "datatables.net-buttons/js/buttons.html5"
// import "datatables.net-buttons/js/buttons.print"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "./ui/input";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Download, Eye, Filter, Search, X } from "lucide-react"
import ReactDOMServer from "react-dom/server"
import { useUser } from "@/contexts/UserContext"
import { useSearchParams } from "next/navigation"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import Image from "next/image";
import { useSidebar } from "./ui/sidebar";

interface DatatableArrayProps {
    columns: any
    data: any[]
    showAllRows?: boolean
    filterColumn?: string
    filterPlaceholder?: string
    includeFileData?: boolean
    selectableRows?: boolean
    hiddenColumns?: string[]
    viewColumns?: boolean
    selectAllCheckbox?: boolean
    columnSearch?: boolean
    showPagination?: boolean
    downloadFileName?: string
    getActionButtonDetails?: (event: any, row: any, actionType: string) => void
    onRowClick?: (row: any) => void
    onSelectionChange?: (selectedRows: any[]) => void
    columnsWithTotals?: string[]
    ref?: any
    year?: string
    fromDate?: string
    toDate?: string
    moreDetails?:
    | {
        [key: string]: {
            rowKey: string
            rowAmount: string
            rows: any[]
            total: number | null
        }
    }
    | []
    | {
        rowKey: string
        rowAmount: string
        rows: any[]
        total: number | null
    }
    onRowRender?: (row: any, rowElement: HTMLElement) => void
    downloadPDF?: boolean
    downloadExcel?: boolean
    downloadCSV?: boolean
}

const DataTableArray: React.FC<DatatableArrayProps> = ({
    columns,
    data,
    selectAllCheckbox = true,
    showPagination = true,
    downloadFileName,
    onRowClick,
    getActionButtonDetails,
    selectableRows,
    onSelectionChange,
    columnsWithTotals,
    moreDetails,
    viewColumns = true,
    columnSearch = false,
    includeFileData = false,
    ref,
    year,
    fromDate,
    toDate,
    onRowRender,
    downloadPDF = true,
    downloadExcel = true,
    downloadCSV = true
}) => {
    // Generate a unique ID for this table instance
    const tableId = useRef(`datatable-${Math.random().toString(36).substring(2, 11)}`).current

    const tableRef = useRef<any>(ref)
    useImperativeHandle(ref, () => tableRef.current)
    const dtRef = useRef<any>(null)
    const lastSelectedRowsRef = useRef<any[]>([])
    const isInitializedRef = useRef(false)

    const [globalSearchValue, setGlobalSearchValue] = useState("")
    // const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({})
    const [details, setDetails] = useState<{ userDetails: any; currentUser: any }>({ userDetails: null, currentUser: null });
    const [open, setOpen] = useState(false);

    const { userDetails, currentUser } = useUser();
    const searchParams = useSearchParams();
    const { state } = useSidebar(); // Sidebar state

    useEffect(() => {
        if (!dtRef.current) return
        const dt = $(dtRef?.current).DataTable();

        if (typeof window !== "undefined" && dtRef.current) {
            // **Ensure proper column width adjustment**
            setTimeout(() => {
                if (dtRef.current.columns?.adjust) {
                    dtRef.current.columns.adjust(); // Adjust widths properly
                }
                dt.responsive.recalc(); // Ensure responsive recalculations
                dt.draw(false); // Redraw the table
            }, 200); // Timeout to ensure DOM updates

            // **Force width recalculation for columns**
            setTimeout(() => {
                dt.columns().every(function () {
                    const columnHeader = $(this.header());

                    // Set a min and max width for proper distribution
                    columnHeader.css({
                        "min-width": "100px", // Prevents too small columns
                        "max-width": "300px", // Prevents too wide columns
                        "width": "auto", // Auto-distribute width
                    });
                });
                dtRef.current.columns.adjust().responsive.recalc().draw(false);
            }, 300);
        }
    }, [state]);

    useEffect(() => {
        const clientId = searchParams.get('clientId');
        const isBranchCheck = searchParams.get('branchClientCheck');
        const isfamilyClientCheck = searchParams.get('familyClientCheck');

        setDetails(prevDetails => {
            const newDetails = { userDetails, currentUser };

            if (clientId) {
                let sessionKey = '';
                if (isBranchCheck) {
                    sessionKey = `branchClientCheck_${clientId}`;
                } else if (isfamilyClientCheck) {
                    sessionKey = `familyClientCheck_${clientId}`;
                }

                if (sessionKey) {
                    const dtls = sessionStorage.getItem(sessionKey);
                    const parsedDtls = dtls ? JSON.parse(dtls) : null;

                    if (prevDetails.userDetails !== parsedDtls || prevDetails.currentUser !== clientId) {
                        return { userDetails: parsedDtls, currentUser: clientId };
                    }
                    return prevDetails;
                }
            }

            if (
                prevDetails.userDetails !== userDetails ||
                prevDetails.currentUser !== currentUser
            ) {
                return { userDetails, currentUser };
            }

            return prevDetails;
        });
    }, [searchParams, userDetails, currentUser]);


    useEffect(() => {
        const tableApi = dtRef.current;
        if (!tableApi) return;

        const highlightSearch = () => {
            const body = $(tableApi.table().body());

            try {
                body.unmark({
                    done: () => {
                        if (globalSearchValue) {
                            body.mark(globalSearchValue);
                        }
                    },
                });
            } catch (err) {
                console.error("Mark.js highlight error:", err);
            }
        };

        // Initial and future draws
        tableApi.on('draw.dt', highlightSearch);

        // Cleanup on unmount
        return () => {
            tableApi.off('draw.dt', highlightSearch);
        };
    }, [globalSearchValue]);

    const memoizedData = useMemo(() => data, [data])
    const memoizedColumns = useMemo(() => columns, [columns])

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

    const enhancedColumns = useMemo(() => {
        let filteredColumns = memoizedColumns?.filter((column) => {
            if (column.conditionalColumn) {
                for (const [key, conditions] of Object.entries(column.conditionalColumn) as [string, any[]][]) {
                    if (memoizedData?.some((row) => conditions.some((condition: any) => row[key] === condition.value))) {
                        return false
                    }
                }
            }
            return !column.hidden
        })

        if (selectableRows) {
            filteredColumns = [
                {
                    id: "select_all_checkbox",
                    data: null,
                    title: `${selectAllCheckbox ? '<input type="checkbox" id="selectAllCheckbox" title="Select All" />' : ""}`,
                    className: "select-checkbox",
                    orderable: false,
                    searchable: false,
                    defaultContent: "",
                    cell: ({ data, type, row }) => {
                        return (
                            <input
                                type="checkbox"
                                className="rowCheckbox"
                                data-id={row.original?.client_id || row.client_id}
                                name="Select Row"
                                title="Select Row"
                                defaultChecked={false}
                            />
                        )
                    },
                },
                ...filteredColumns, // Keep existing memoizedColumns
            ]
        }

        return filteredColumns
    }, [memoizedColumns, memoizedData, selectableRows])

    useEffect(() => {
        $(tableRef.current).on("click", ".expandable-button", function (e) {
            e.stopPropagation()
            const button = $(this)
            const hiddenData = JSON.parse(button.attr("data-hidden-data") || "[]")

            // Remove any existing popovers
            $(".expandable-popover").remove()

            // Create popover content with close button and responsive design
            const popoverContent = `
                <div class="expandable-popover bg-background border rounded-lg shadow-lg" 
                    style="min-width: 250px; max-width: 90vw; position: absolute; z-index: 1000;">
                    <div class="flex items-center justify-between border-b p-2">
                        <span class="font-medium">Details</span>
                        <button name="expand" class="close-popover p-1 hover:bg-background-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="p-4">
                        <table class="w-full">
                            <tbody>
                                ${hiddenData
                    .map(
                        (item) => `
                                                                <tr class="border-b last:border-0">
                                                                    <td class="py-2 pr-4 font-medium text-sm">${item.header}</td>
                                                                    <td class="py-2 text-sm break-words">${item.value}</td>
                                                                </tr>
                                                                `,
                    )
                    .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `

            // Position and show popover
            const $popover = $(popoverContent)
            $("body").append($popover)

            const buttonPos = button.offset()
            const buttonWidth = button.outerWidth()
            const buttonHeight = button.outerHeight()
            const windowWidth = $(window).width()
            const popoverWidth = $popover.outerWidth()

            // Calculate position ensuring popover stays within viewport
            let leftPosition = (buttonPos?.left ?? 0) + (buttonWidth ?? 0) / 2
            if (leftPosition + (popoverWidth ?? 0) > (windowWidth ?? 0)) {
                leftPosition = (windowWidth ?? 0) - (popoverWidth ?? 0) - 20 // 20px padding from right edge
            }
            if (leftPosition < 0) leftPosition = 20 // 20px padding from left edge

            $popover.css({
                top: (buttonPos?.top ?? 0) + (buttonHeight ?? 0) + 5,
                left: leftPosition,
            })

            // Add click handler for close button
            $popover.find(".close-popover").on("click", () => {
                $popover.remove()
            })

            // Close popover when clicking outside
            $(document).on("click", function closePopover(e) {
                if (!$(e.target).closest(".expandable-popover, .expandable-button").length) {
                    $popover.remove()
                    $(document).off("click", closePopover)
                }
            })
        })
    }, [])

    useEffect(() => {
        if (!tableRef.current || isInitializedRef.current) return

        if (tableRef.current && $.fn.DataTable()) {
            // Set a unique ID on the table element
            $(tableRef.current).attr("id", tableId)

            const dt = $(tableRef.current)?.DataTable({
                data: memoizedData?.map((row) => {
                    const formattedRow: any = {}
                    enhancedColumns.forEach((col) => {
                        formattedRow[col.accessorKey] = formatValue(row[col.accessorKey])
                    })
                    return { ...formattedRow, original: row }
                }),
                columns: [
                    {
                        data: "",
                        defaultContent: "",
                        className: "dtr-control dtr-hidden", // ✅ Ensuring it remains hidden for responsive behavior
                        orderable: false,
                        visible: true, // ✅ Ensuring it's always included
                        // render: (data, type, row) =>
                        //     ReactDOMServer.renderToString(<ChevronRight className="h-3 w-3 transition-transform" />),
                    },
                    ...enhancedColumns.map((col) => ({
                        data: col.accessorKey || col.data,
                        title: col.title || col.header,
                        // footer: col.title || col.header,
                        visible: col.deselected ? false : col.visible !== false,
                        orderable: col.orderable !== false,
                        className: col.className || "",
                        defaultContent: col.defaultContent || "",
                        width: col.width || "auto",
                        render: (data, type, row, meta) => {
                            // ✅ If dtRender is provided, use it and skip the rest
                            if (typeof col.dtRender === "function") {
                                return col.dtRender(data, type, row, meta);
                            }

                            const formattedValue = formatValue(data)

                            // Check if the column has hidden columns (i.e., expandable)
                            if (col.hiddenColumns && col.hiddenColumns.length > 0) {
                                const hiddenColumnsData = col.hiddenColumns
                                    .map((columnId) => {
                                        const matchingColumn = columns.find((col) => col.id === columnId)
                                        const header = matchingColumn?.header || columnId
                                        const value = row.original[columnId]

                                        return matchingColumn && value !== undefined ? { header, value } : null
                                    })
                                    .filter((item) => item !== null)

                                // ✅ If there are hidden columns, render expandable icon
                                if (hiddenColumnsData.length > 0) {
                                    let cellContent = formattedValue // Default to normal formatted value

                                    // ✅ Use `cell` function if available
                                    if (col.cell && typeof col.cell === "function") {
                                        const cellResult = col.cell({ row })

                                        // ✅ Convert React element to HTML string if it's a valid React node
                                        cellContent = React.isValidElement(cellResult)
                                            ? ReactDOMServer.renderToString(cellResult)
                                            : cellResult
                                    }

                                    return `
                                        <div class="flex items-center">
                                            ${cellContent}
                                            <button class="expandable-button ml-2 h-3 w-3 p-0" 
                                                    data-hidden-data='${JSON.stringify(hiddenColumnsData)}'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                            </button>
                                        </div>
                                    `
                                }
                            }

                            // ✅ If no hidden columns, use cell function if available
                            if (col.cell && typeof col.cell === "function") {
                                const cellResult = col.cell({ row })

                                if (React.isValidElement(cellResult)) {
                                    const container = document.createElement("div")
                                    container.innerHTML = ReactDOMServer.renderToString(cellResult)

                                    setTimeout(() => {
                                        const button = container.querySelector("button")
                                        if (button) {
                                            button.addEventListener("click", (e) => {
                                                e.stopPropagation()
                                                getActionButtonDetails?.(e, row.original, "someAction") // Call your action handler
                                            })
                                        }
                                    }, 0)

                                    return container.innerHTML // Return the stringified HTML
                                }

                                return cellResult
                            }

                            // ✅ Default return value
                            return formattedValue
                        },
                    })),
                ],
                responsive: {
                    details: {
                        type: "column",
                        target: 0, // Change target to 1 (second column) since first column is checkbox
                        renderer: (api, rowIdx, columns) => {
                            const responsiveColumns = Array.isArray(columns)
                                ? columns.filter((col) => col.hidden && col.columnIndex !== 0) // Exclude the checkbox column
                                : []

                            if (responsiveColumns.length === 0) return false

                            const wrapper = document.createElement("ul")
                            wrapper.className = "dtr-details"
                            wrapper.addEventListener("click", (e) => {
                                const target = e.target;

                                // Don't stop propagation if the click is on an interactive element
                                if (
                                    (target as Element).closest("button")
                                ) {
                                    return; // Let it bubble
                                }

                                e.stopPropagation(); // Only stop it if it's outside clickable controls
                            });


                            // Add a header with expand icon hint
                            const headerItem = document.createElement("li")
                            headerItem.className = "dtr-details-header"
                            headerItem.innerHTML =
                                '<div class="expand-hint"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg> <span>Expanded Details</span></div>'
                            wrapper.appendChild(headerItem)

                            responsiveColumns.forEach((col) => {
                                const listItem = document.createElement("li")
                                listItem.className = "dt-head-custom dt-body-custom"

                                const titleSpan = document.createElement("span")
                                titleSpan.className = "dtr-title"
                                titleSpan.textContent = col.title + ":"

                                const dataSpan = document.createElement("span")
                                dataSpan.className = "dtr-data"
                                dataSpan.innerHTML = col.data

                                listItem.appendChild(titleSpan)
                                listItem.appendChild(dataSpan)
                                wrapper.appendChild(listItem)
                            })

                            return wrapper
                        },
                    },
                    breakpoints: [
                        { name: "desktop", width: Number.POSITIVE_INFINITY },
                        { name: "tablet", width: 1024 },
                        { name: "mobile", width: 640 },
                    ],
                },
                columnDefs: [
                    { targets: "_all", width: "auto" },
                    {
                        targets: 0, // ✅ First column (selection column)
                        orderable: false,
                        searchable: false,
                        className: "dtr-control ", // ✅ DataTables assigns this for selection
                        visible: false, // ✅ Hide from the main table
                        responsivePriority: -1, // ✅ Ensure it's removed from responsive mode
                    },
                    {
                        targets: 0, // First column (checkbox)
                        className: "select-checkbox",
                        orderable: false,
                        checkboxes: {
                            selectRow: true, // Enable row selection using checkboxes
                        },
                    },
                    {
                        className: "dtr-control",
                        orderable: false,
                        targets: 0,
                    },
                    {
                        targets: "_all",
                        className: "dt-head-custom dt-body-custom",
                        orderable: true,
                    },
                    ...enhancedColumns.map((col, index) => ({
                        targets: index + 1,
                        orderable: col.sortable !== false,
                    })),
                    {
                        responsivePriority: 1, // Highest priority (never hide)
                        targets: [0, 1], // First column and second column (if selectableRows is true)
                    },
                    {
                        responsivePriority: 2, // High priority
                        targets: enhancedColumns
                            .map((col, idx) => idx + 1)
                            .filter((idx) => {
                                const col = enhancedColumns[idx - 1]
                                return col && (col.accessorKey === "id" || col.accessorKey === "name" || col.accessorKey === "date")
                            }),
                    },
                    {
                        responsivePriority: 10000, // Low priority (hide first)
                        targets: enhancedColumns
                            .map((col, idx) => idx + 1)
                            .filter((idx) => {
                                const col = enhancedColumns[idx - 1]
                                return col && (col.accessorKey === "description" || col.accessorKey === "details" || col.accessorKey === "actions")
                            }),
                    },
                ],
                dom: '<"datatable-container"t><"datatable-footer"<"datatable-info"i><"datatable-pagination"p>>',
                // dom: '<"datatable-header"<"datatable-header-left"><"datatable-header-right"<"datatable-actions"B>>><"datatable-container"t><"datatable-footer"<"datatable-info"i><"datatable-pagination"p>>',
                buttons: [
                    {
                        extend: "pdfHtml5",
                        text: "Export PDF",
                        title: "DataTable Export",
                        orientation: "landscape", // Can be 'portrait' or 'landscape'
                        pageSize: "A4", // Page size options: A3, A4, A5, legal, letter
                        exportOptions: {
                            columns: ":visible", // Export only visible columns
                        },
                    },
                ],
                select: selectableRows
                    ? {
                        style: "multi",
                        selector: "td:first-child",
                    }
                    : false,
                deferRender: true,
                destroy: true,
                scrollX: true,
                autoWidth: false,
                order: [],
                scrollY: showPagination ? "600px" : "400px",
                scrollCollapse: true,
                pageLength: showPagination ? 10 : 10,
                ordering: true,
                paging: showPagination,
                info: showPagination,
                // lengthChange: showPagination,
                stripeClasses: [], // Remove striping classes
                // stateSave: true,
                stateDuration: -1,
                retrieve: true,
                search: false,
                lengthChange: false, // Hide "Show entries"
                searching: true, // Remove global search
                // fixedHeader: {
                //     header: true,
                //     headerOffset: 0,
                // },
                language: {
                    search: "",
                    searchPlaceholder: "Search all columns...",
                    lengthMenu: "Show _MENU_ entries",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Prev",
                    },
                },

                rowCallback: (row, data, index) => {
                    $(row).css({
                        "line-height": "1.2",
                        "font-size": "0.75rem",
                    })
                },

                footerCallback: function (row, data, start, end, display) {
                    const api = (this as any).api()
                    api.columns.adjust() // ⚠️ DO NOT CALL `.draw()`

                    columnsWithTotals?.forEach((colId) => {
                        const dtColumnIndex = api
                            .columns()
                            .indexes()
                            .toArray()
                            .find((index) => {
                                return api.column(index).dataSrc() === colId
                            })

                        if (dtColumnIndex === undefined) {
                            return
                        }

                        const footerCell = api.column(dtColumnIndex).footer()
                        if (!footerCell) {
                            return
                        }

                        const total = api
                            .column(dtColumnIndex, { search: "applied" })
                            .data()
                            .reduce((a, b) => Number.parseFloat(a) + Number.parseFloat(b), 0)

                        const formattedTotal = new Intl.NumberFormat("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(total)

                        // ✅ Set color based on value
                        const color = total >= 0 ? "green" : "red"
                        footerCell.innerHTML = `<span style="color: ${color}; font-weight: bold;">${formattedTotal}</span>`
                    })
                },

                initComplete: function () {
                    const api = (this as any).api()

                    if (columnSearch) {
                        // Add search inputs to each column header
                        api.columns().every((index) => {
                            // Skip first column (expansion control) and select checkbox column
                            if (index === 0 || (selectableRows && index === 1)) return

                            const column = api.column(index)
                            const title = $(column.header()).text().trim()

                            // Create wrapper div for the search input
                            const wrapper = $('<div class="column-search-wrapper"></div>')

                            // Create input element for column search
                            const input = $(`<input name="column-search-${title}" type="text" class="column-search" placeholder="Search ${title}" />`)

                            // Add accessibility attributes
                            input.attr("aria-label", `Search ${title}`)
                            input.attr("role", "searchbox")

                            // Add input to column header
                            $(wrapper).append(input)
                            $(column.header()).append(wrapper)

                            // Add input event handler with debounce
                            let debounceTimer: NodeJS.Timeout
                            $(input).on("keyup change", function (e) {
                                e.stopPropagation()
                                clearTimeout(debounceTimer)
                                const value = $(this).val() as string

                                debounceTimer = setTimeout(() => {
                                    if (column.search() !== value) {
                                        column.search(value).draw()
                                    }
                                }, 300)
                            })

                            input.on("click", (e) => {
                                e.stopPropagation()
                            })
                        })
                    }

                    $(".dataTables_filter").hide() // Hide the default search box

                    // Customize pagination
                    const paginationContainer = $(".datatable-pagination")
                    api.on("draw", () => {
                        const info = api.page.info()

                        // Calculate page numbers to show (show 5 pages max with current page in the middle when possible)
                        const totalPages = info.pages
                        const currentPage = info.page
                        let startPage = Math.max(0, currentPage - 2)
                        const endPage = Math.min(totalPages - 1, startPage + 4)

                        // Adjust if we're near the end
                        if (endPage - startPage < 4 && startPage > 0) {
                            startPage = Math.max(0, endPage - 4)
                        }

                        // Generate page buttons
                        let pageButtons = ""
                        for (let i = startPage; i <= endPage; i++) {
                            pageButtons += `
                                <button class="pagination-button page-number ${i === currentPage ? "active" : ""}" 
                                        data-page="${i}">
                                ${i + 1}
                                </button>
                            `
                        }

                        const paginationHtml = `
                            <div class="custom-pagination">
                                <button class="pagination-button first-page ${info.page === 0 ? "disabled" : ""}" 
                                        ${info.page === 0 ? "disabled" : ""}>
                                <span>«</span>
                                </button>
                                <button class="pagination-button previous-page ${info.page === 0 ? "disabled" : ""}"
                                        ${info.page === 0 ? "disabled" : ""}>
                                <span>‹</span>
                                </button>
                                
                                <div class="pagination-numbers">
                                ${pageButtons}
                                </div>
                                
                                <button class="pagination-button next-page ${info.page === info.pages - 1 ? "disabled" : ""}"
                                        ${info.page === info.pages - 1 ? "disabled" : ""}>
                                <span>›</span>
                                </button>
                                <button class="pagination-button last-page ${info.page === info.pages - 1 ? "disabled" : ""}"
                                        ${info.page === info.pages - 1 ? "disabled" : ""}>
                                <span>»</span>
                                </button>
                            </div>
                            `

                        if (info.pages > 1) {
                            paginationContainer.html(paginationHtml).show();
                        } else {
                            paginationContainer.hide();
                        }


                        // Add event listeners to pagination buttons
                        paginationContainer.find(".first-page").on("click", function () {
                            if (!$(this).hasClass("disabled")) {
                                api.page("first").draw("page")
                            }
                        })

                        paginationContainer.find(".previous-page").on("click", function () {
                            if (!$(this).hasClass("disabled")) {
                                api.page("previous").draw("page")
                            }
                        })

                        paginationContainer.find(".next-page").on("click", function () {
                            if (!$(this).hasClass("disabled")) {
                                api.page("next").draw("page")
                            }
                        })

                        paginationContainer.find(".last-page").on("click", function () {
                            if (!$(this).hasClass("disabled")) {
                                api.page("last").draw("page")
                            }
                        })

                        // Add event listeners for page number buttons
                        paginationContainer.find(".page-number").on("click", function () {
                            const pageNum = Number.parseInt($(this).data("page"))
                            api.page(pageNum).draw("page")
                        })
                    })

                    // Customize length menu
                    const lengthContainer = $(".datatable-length")
                    const lengthOptions = [10, 25, 50, 100]
                    const lengthSelect = $('<select name="entries" class="custom-length-select"></select>')

                    lengthOptions.forEach((option) => {
                        lengthSelect.append(`<option value="${option}" ${api.page.len() === option ? "selected" : ""}>
                            ${option} entries
                        </option>`)
                    })

                    lengthContainer.html('<div class="custom-length-container"><span>Show</span></div>')
                    lengthContainer.find(".custom-length-container").append(lengthSelect)
                    lengthContainer.find(".custom-length-container").append("<span>entries</span>")

                    lengthSelect.on("change", function () {
                        const val = $(this).val() as number
                        api.page.len(val).draw()
                    })

                    // Customize info display
                    // const infoContainer = $(`.datatable-info-${tableId}`)

                    // const updateInfoBar = () => {
                    //     // Clear the container first to prevent duplicates
                    //     infoContainer.empty()

                    //     const info = api.page.info()
                    //     const selectedCount = api.rows({ selected: true }).count()

                    //     const infoHtml = `
                    //       <div class="custom-info">
                    //         <span>Showing ${info.start + 1} to ${info.end} of ${info.recordsDisplay} entries</span>
                    //         ${info.recordsDisplay !== info.recordsTotal
                    //             ? `<span class="filtered-info">(filtered from ${info.recordsTotal} total entries)</span>`
                    //             : ""
                    //         }
                    //         ${selectedCount > 0 ? `<span class="selected-info">(${selectedCount} selected)</span>` : ""}
                    //       </div>
                    //     `

                    //     infoContainer.html(infoHtml)
                    // }

                    // // Initial update
                    // updateInfoBar()

                    // // Register event handlers for this specific table
                    // api.on("draw", updateInfoBar)
                    // api.on("select", updateInfoBar)
                    // api.on("deselect", updateInfoBar)
                    // api.on("page", updateInfoBar)
                    // api.draw()

                    const infoContainer = $(".datatable-info")
                    const updateInfoBar = () => {
                        const info = api.page.info();
                        const selectedCount = api.rows({ selected: true }).count();

                        const infoHtml = `
                                              <div class="custom-info">
                                                <span>Showing ${info.start + 1} to ${info.end} of ${info.recordsDisplay} entries</span>
                                                ${info.recordsDisplay !== info.recordsTotal
                                ? `<span class="filtered-info">(filtered from ${info.recordsTotal} total entries)</span>`
                                : ""
                            }
                                                ${selectedCount > 0
                                ? `<span class="selected-info">(${selectedCount} selected)</span>`
                                : ""
                            }
                                              </div>
                                            `;

                        infoContainer.html(infoHtml);
                    };

                    // Run on every draw
                    api.on("draw", updateInfoBar);

                    // 🔥 Also run on row selection/deselection
                    api.on("select", updateInfoBar);
                    api.on("deselect", updateInfoBar);
                    api.draw()

                    // Clear any existing icons in dtr-control cells to avoid duplication
                    $(tableRef.current).find("td.dtr-control").empty()

                    // Initialize the control cells with the right icon
                    $(tableRef.current)
                        .find("td.dtr-control")


                    // Handle the responsive display event to ensure icon state is correct
                    api.on("responsive-display", (e, datatable, row, showHide) => {
                        const $cell = $(row.node()).find("td.dtr-control")

                        // First, clear any existing content to avoid duplication
                        $cell.empty()

                        if (showHide) {
                            // Row was expanded
                            $cell.addClass("expanded")
                            // $cell.html(
                            //     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>',
                            // )
                            $(row.node()).addClass("expanded-row")
                        } else {
                            // Row was collapsed
                            $cell.removeClass("expanded")
                            // $cell.html(
                            //     '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>',
                            // )
                            $(row.node()).removeClass("expanded-row")
                        }
                    })

                    // Add a pulsing effect to the expand icon for first-time users
                    setTimeout(() => {
                        $(".dtr-control").addClass("pulse-hint")
                        setTimeout(() => {
                            $(".dtr-control").removeClass("pulse-hint")
                        }, 5000)
                    }, 1000)
                },

                createdRow: (row, data, dataIndex) => {
                    // Call the onRowRender prop if it exists
                    if (onRowRender) {
                        onRowRender(data, row)
                    }

                    // Add data attributes to the row for easy access
                    $(row).attr("data-row-data", JSON.stringify(data))
                },
            })

            dtRef.current = dt

            if (selectableRows) {
                // Prevent row selection when clicking outside the checkbox
                $(tableRef.current).on("click", "tbody tr", (e) => {
                    if (!$(e.target).is(".rowCheckbox") && !$(e.target).closest(".rowCheckbox").length) {
                        e.stopPropagation() // Prevents row selection
                    }
                })

                dt.on("select.dt deselect.dt", () => {
                    const allRows = dt.rows().nodes() // Get all row nodes
                    const selectedRows = dt.rows({ selected: true }).nodes() // Get selected row nodes
                    const selectedData = dt
                        .rows({ selected: true })
                        .data()
                        .toArray()
                        .map((row, index) => {
                            const rowNode = selectedRows[index] // Get actual row DOM node

                            // Extract inputs inside the row
                            const inputs = $(rowNode).find("input:not(.rowCheckbox), select, textarea")
                            const formData = {}

                            inputs?.each(function () {
                                const fieldName = $(this).attr("id") || $(this).attr("name") || $(this).attr("data-id") // Get input name or data-id
                                if (fieldName) {
                                    formData[fieldName] = $(this).val() // Get input value
                                }
                            })

                            return {
                                ...row,
                                inputs: formData, // Attach input values to the row data
                            }
                        })

                    if (onSelectionChange) {
                        // Prevent unnecessary re-renders by comparing previous selection
                        if (JSON.stringify(selectedData) !== JSON.stringify(lastSelectedRowsRef.current)) {
                            lastSelectedRowsRef.current = selectedData
                            onSelectionChange?.(selectedData) // Pass only clean data
                        }
                    }

                    // First, uncheck all checkboxes (handles deselection)
                    Array.from(allRows).forEach((row) => {
                        $(row).find(".rowCheckbox").prop("checked", false)
                    })

                    // Then, check checkboxes for selected rows only
                    Array.from(selectedRows).forEach((row) => {
                        $(row).find(".rowCheckbox").prop("checked", true)
                    })
                })

                $(tableRef.current).on("click", "td.select-checkbox", function (e) {
                    e.stopPropagation()
                    const row = dt.row($(this).closest("tr"))
                    if (row.select) {
                        if ($(row.node()).hasClass("selected")) {
                            row.deselect()
                        } else {
                            row.select()
                        }
                    }
                })

                dt.on("select.dt deselect.dt", () => {
                    const allRows = dt.rows().nodes() // Get all row nodes
                    const selectedRows = dt.rows({ selected: true }).nodes() // Get selected row nodes

                    $(allRows).find(".rowCheckbox").prop("checked", false)
                    $(selectedRows).find(".rowCheckbox").prop("checked", true)

                    $("#selectAllCheckbox").prop("checked", selectedRows.length === allRows.length)
                })

                $(document).on("click", "thead th #selectAllCheckbox", function (e) {
                    e.stopPropagation()
                    const isChecked = $(this).prop("checked")

                    if (isChecked) {
                        dt.rows().select() // Try to select all

                        // Let page logic handle deselects, then sync checkboxes in the global handler
                        setTimeout(() => {
                            const allRows = dt.rows().nodes()
                            const selectedRows = dt.rows({ selected: true }).nodes()

                            // Only check selectAll if all visible rows are selected
                            const allSelected = selectedRows.length === allRows.length
                            $("#selectAllCheckbox").prop("checked", allSelected)
                        }, 0) // Allow async deselect to finish
                    } else {
                        dt.rows().deselect()

                        // No need for timeout since we're forcing full deselect
                        $("#selectAllCheckbox").prop("checked", false)
                    }
                })

                dt.on("draw.dt", function () {
                    const selectedRows = dt.rows({ selected: true }).nodes()
                    $(selectedRows).find(".rowCheckbox").prop("checked", true)
                });

                // $(document).on("click", "thead th #selectAllCheckbox", function (e) {
                //     e.stopPropagation();
                //     const isChecked = $(this).prop("checked");

                //     if (isChecked) {
                //         dt.rows({ search: "applied" }).select(); // Select all rows across pages
                //         $(dt.rows({ search: "applied" }).nodes()).find(".rowCheckbox").prop("checked", true);
                //     } else {
                //         dt.rows().deselect(); // Deselect all rows across pages
                //         $(dt.rows().nodes()).find(".rowCheckbox").prop("checked", false);
                //     }
                // });
            }

            const initialVisibility: { [key: string]: boolean } = {}
            enhancedColumns.forEach((col) => {
                initialVisibility[col.accessorKey as string] = !col.hidden && !col.deselected
            })
            setColumnVisibility(initialVisibility)

            // Add event listener for column visibility changes
            dt.on("column-visibility.dt", (e, settings, column, state) => {
                const columnId = dt.column(column).dataSrc() as string
                setColumnVisibility((prev) => ({ ...prev, [columnId]: state }))
            })

            if (onRowClick) {
                $(tableRef.current).on("click", "tbody tr", function (e) {
                    if (!$(e.target).closest("button").length) {
                        const rowData = dt.row(this).data()
                        if (rowData) {
                            onRowClick(rowData)
                        }
                    }
                })
            }

            if (getActionButtonDetails) {
                $(tableRef.current).on("click", ".action-btn", function (e) {
                    e.stopPropagation();

                    const rowNode = $(this).closest("tr");
                    const rowData = dt.row(rowNode).data(); // Get row data
                    const actionType = $(this).data("action"); // Identify which button was clicked

                    // Fetch all input values in the row
                    const inputs = rowNode.find("input, select, textarea");
                    const formData: Record<string, any> = {};

                    inputs.each(function () {
                        const fieldName = $(this).attr("name") || $(this).attr("data-id");
                        if (fieldName) {
                            formData[fieldName] = $(this).val();
                        }
                    });

                    if (rowData && actionType) {
                        getActionButtonDetails(e, { ...rowData, inputs: formData }, actionType);
                    }
                });
            }

            $("<style>")
                .prop("type", "text/css")
                .html(`
              ${!showPagination
                        ? `
                    .dataTables_info, .dataTables_paginate, .dataTables_length {
                        display: none !important;
                    }
                `
                        : ""
                    }

                    td:has(input[name="upiId"]) {
    position: relative;
}

            `)
                .appendTo("head")

            const handleResponsiveDisplay = (e, datatable, row, showHide) => {
                const $row = $(row.node());
                const $control = $row.find(".dtr-control");

                if (showHide) {
                    $control.addClass("expanded");
                } else {
                    $control.removeClass("expanded");
                }
            };

            $(tableRef.current).on("responsive-display", handleResponsiveDisplay);

            isInitializedRef.current = true
            return () => {
                if (!dtRef.current || !tableRef.current) return // ✅ Prevent errors

                try {
                    // Clear search inputs
                    dtRef.current.columns().search("").draw()

                    // Remove event listeners
                    $(tableRef.current).find("input.column-search").off("keyup change click")
                    $(tableRef.current).off("click", ".action-btn")
                    $(tableRef.current).off("draw.dt")
                    $(tableRef.current).off("responsive-display")
                    $(tableRef.current).off("column-visibility.dt")
                    $(document).off("click", "thead th #selectAllCheckbox")

                    // ✅ Destroy only if DataTable exists
                    if ($.fn.DataTable.isDataTable(tableRef.current)) {
                        dtRef.current.destroy()
                        isInitializedRef.current = false
                    }
                } catch (error) {
                    console.error("Error while destroying DataTable:", error)
                }
            }

        }
    },
        [enhancedColumns, memoizedData, showPagination, columns, includeFileData, details, moreDetails, downloadFileName]
    )

    // Add a click event handler for buttons in the table to ensure search state is preserved
    $(tableRef.current).on("click", "button", (e) => {
        e.stopPropagation()
        // Prevent the search input from being cleared when buttons are clicke
        e.preventDefault()
    })

    const toggleColumnVisibility = (columnId: string) => {
        const dt = $(tableRef.current).DataTable();
        const columnIndex = dt
            .columns()
            .indexes()
            .toArray()
            .find((index) => dt.column(index).dataSrc() === columnId);

        if (columnIndex !== undefined) {
            const column = dt.column(columnIndex);
            const newVisibility = !column.visible();
            column.visible(newVisibility);

            setColumnVisibility((prev) => ({ ...prev, [columnId]: newVisibility }));

            // Update selected columns list
            // setSelectedColumns((prev) =>
            //     newVisibility ? [...prev, columnId] : prev.filter((id) => id !== columnId)
            // );

            // Ensure at least one column remains visible
            if (Object.values(columnVisibility).filter(Boolean).length === 1 && !newVisibility) {
                alert("At least one column should be visible!");
                column.visible(true);
                setColumnVisibility((prev) => ({ ...prev, [columnId]: true }));
                // setSelectedColumns((prev) => [...prev, columnId]);
            }

            // Adjust table after column visibility change
            setTimeout(() => {
                dt.columns.adjust().responsive.recalc().draw(false);
            }, 200);
        }
    };

    const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>(() => {
        const initialVisibility: { [key: string]: boolean } = {};
        enhancedColumns.forEach((col) => {
            initialVisibility[col.accessorKey] = !col.deselected;
        });
        return initialVisibility;
    });

    const formatCurrency = (value: number) => {
        const formattedValue = new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(value))

        return `₹ ${formattedValue}${value < 0 ? " CR" : ""}`
    }

    const clearAllFilters = () => {
        if (dtRef.current) {
            // Clear all column search filters in DataTables
            dtRef.current.columns().search("").draw();

            // **Find and clear all column search input fields inside headers**
            $(tableRef.current)
                .find(".column-search")
                .each(function () {
                    (this as HTMLInputElement).value = ""; // Clear input field value
                    this.setAttribute("value", ""); // Reset stored attribute value
                    $(this).trigger("input"); // Force UI update
                    $(this).trigger("change"); // Ensure event listener detects it
                    $(this).trigger("keyup"); // Refresh UI
                });

            // **Clear global search input**
            $(".custom-search-input").each(function () {
                (this as HTMLInputElement).value = "";
                this.setAttribute("value", "");
                $(this).trigger("input").trigger("change").trigger("keyup");
            });

            setGlobalSearchValue(""); // Reset React state for global search

            // **Reset all column filters in DataTables**
            // dtRef.current.columns().every((column: any) => {
            //     column?.search("").draw();
            // });

            dtRef.current.columns().every(function (this: any) {
                (this as any).search("").draw();
            });


            // **Force DataTables to re-draw to apply UI changes**
            dtRef.current.draw();

            // **Manually reset input values in the DOM (Edge Case Fix)**
            setTimeout(() => {
                document.querySelectorAll(".column-search").forEach((input) => {
                    (input as HTMLInputElement).value = "";
                });
            }, 50); // Small delay to ensure DataTables redraw completes
        }
    };

    const getVisibleColumns = () => {
        return enhancedColumns.filter((col) => columnVisibility[col.accessorKey]);
    };

    const downloadCSVFunc = () => {
        const dt = $(tableRef.current).DataTable();

        // Get visible columns
        const visibleColumns = dt
            .columns()
            .indexes()
            .toArray()
            .map((index) => dt.column(index).visible());

        const columnsData = columns.filter((_, index) => visibleColumns[index + 1]); // +1 because first column is control column

        // Get current sorted/filtered data from DataTable
        const currentData = dt.rows().data().toArray();

        const createCenteredRow = (content) => {
            const row = Array(columnsData.length).fill("");
            row[0] = content;
            return row;
        };

        // Helper function for formatting values properly
        const getFormattedCellValue = (col, row) => {
            let value = "";

            if (col.cell && typeof col.cell === "function") {
                const cellResult = col.cell({ row });

                // Handle React Elements
                if (React.isValidElement(cellResult)) {
                    const htmlString = ReactDOMServer.renderToString(cellResult);
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = htmlString;
                    value = tempDiv.textContent || tempDiv.innerText || "";
                }
                // Handle HTML Strings (strip tags)
                else if (typeof cellResult === "string" && cellResult.includes("<")) {
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = cellResult;
                    value = tempDiv.textContent || tempDiv.innerText || "";
                }
                // Handle Normal Values
                else {
                    value = cellResult ?? "";
                }
            } else {
                value = row[col.accessorKey] ?? "";
            }

            // Trim and format numbers/currency properly
            value = String(value).trim();

            if (!isNaN(Number(value)) && value !== "") {
                return Number(value);
            }

            if (typeof value === "string" && value.includes("₹")) {
                value = value.replace(/[^0-9.-]/g, "");
                return value !== "" && !isNaN(Number(value)) ? Number(value) : value;
            }

            value = value.replace(/"/g, '""');

            if (value.includes(",") || value.includes("\n") || value.includes('"')) {
                return `"${value}"`;
            }

            return value;
        };

        // Helper function for formatting currency
        const formatCurrencyForExcel = (value) => {
            return `"${formatCurrency(value).replace(/,/g, "\u00A0")}"`;
        };

        // Header Data (Main Company Title)
        let headerData = [createCenteredRow("Pune e Stock Broking Limited")];

        // ✅ Include additional details only if includeFileData is true
        if (includeFileData) {
            headerData.push(createCenteredRow(""));

            // Add user details
            headerData.push([
                `Name: ${details.userDetails?.clientName}                    Client ID: ${details.currentUser}`,
            ]);

            headerData.push([""]);

            // ✅ Dynamically Process `moreDetails` for CSV
            if (typeof moreDetails === "object") {
                Object.entries(moreDetails).forEach(([key, value]) => {
                    if (typeof value === "object" && "rows" in value) {
                        // ✅ Add Section Title (like "Expenses")
                        headerData.push([key]);

                        // ✅ Process Table Rows
                        const tableRows = value.rows.map((row) => [
                            row[value.rowKey],
                            formatCurrencyForExcel(row[value.rowAmount]),
                        ]);

                        // ✅ Add Total Row with "Profit" or "Loss"
                        if (value.total !== null) {
                            const totalValue = formatCurrencyForExcel(value.total);
                            const profitLossText = value.total >= 0 ? "Profit" : "Loss"; // Determine Profit/Loss

                            tableRows.push([`${key} Total (${profitLossText})`, totalValue]);
                        }

                        // ✅ Append to CSV Data
                        headerData = [...headerData, ...tableRows, []]; // Add spacing
                    } else {
                        // ✅ Add Key-Value Pairs (like Opening Balance)
                        const formattedValue = formatCurrencyForExcel(value);
                        headerData.push([`${key}:`, formattedValue]);
                    }
                });
            }

            headerData.push([""]);
        }
        // Add Report Title
        headerData.push(createCenteredRow("Detailed Report"));

        headerData.push([""])


        // Convert header data to CSV rows
        // Convert headerData rows to comment lines
        const headerDataAsComments = headerData
            .flatMap(row => {
                const line = row.join(",").trim();
                return line !== "" ? [`# ${line}`] : [""];
            })
            .filter(Boolean);

        // Add clear section delimiter before table data
        headerDataAsComments.push("# --- START OF DATA ---");

        // Column headers
        const columnHeaders = columnsData.map(col => `"${col.header}"`).join(",");

        // Data rows
        const dataRows = currentData.map((row) =>
            columnsData.map((col) => getFormattedCellValue(col, row) ?? "").join(",")
        );

        // Combine all parts
        const csvRows = [
            ...headerDataAsComments,
            "",
        ];


        // Add column headers
        csvRows.push(columnsData.map((col) => col.header).join(","));

        // Add table data
        currentData.forEach((row) => {
            csvRows.push(columnsData.map((col) => getFormattedCellValue(col, row) ?? "").join(","));
        });

        // Create CSV File
        const csvContent = csvRows.join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const finalFileName = downloadFileName?.trim() ? downloadFileName : document.title;
        link.setAttribute("download", `${finalFileName}_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadExcelFunc = async () => {
        const dt = $(tableRef.current).DataTable();
        const allColumns = dt.columns().indexes().toArray();
        // const columnsData = columns
        //     .filter((col, index) => allColumns.indexOf(index) !== -1)
        //     .filter(col => col.id !== "actions");

        const columnsData = getVisibleColumns()

        console.log(columnsData);
        const totalColumns = columnsData.length
        const finalFileName = downloadFileName?.trim() ? downloadFileName : document.title

        const categoryRowMapping: Record<string, string> = {} // Stores category -> row reference
        const sectionStartRows: Record<string, number> = {} // Stores section start row numbers for navigation

        const convertToNumberIfValid = (value: any, amountToBe: boolean = false): number | string => {
            if (value === null || value === undefined || value === "" || value === "N/A")
                return 0;

            if (typeof value === "string") {
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                    return value; // already in DD/MM/YYYY
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    const [year, month, day] = value.split("-");
                    return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
                }
            }

            if (typeof value === "string") {
                if (/[a-zA-Z]/.test(value)) return value.trim();

                const cleanedValue = value.replace(/[^0-9.-]/g, "").trim();
                const numericValue = Number.parseFloat(cleanedValue);

                if (isNaN(numericValue)) return "0";

                return Number(numericValue.toFixed(2)); // returns float with 2 decimal places
            }

            if (typeof value === "number") {
                return Number(value.toFixed(2));
            }

            return 0;
        };

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet("Report", {
            pageSetup: {
                paperSize: 9, // A4
                orientation: "portrait",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: {
                    left: 0.7,
                    right: 0.7,
                    top: 0.75,
                    bottom: 0.75,
                    header: 0.3,
                    footer: 0.3,
                },
            },
        })

        // Add header and footer
        worksheet.headerFooter.oddFooter = "&L&F&C&P of &N&R&D &T"

        const mergeAndCenter = (rowIndex: number, style?: "title" | "subtitle" | "section") => {
            worksheet.mergeCells(rowIndex, 1, rowIndex, totalColumns)
            const row = worksheet.getRow(rowIndex)
            row.alignment = { horizontal: "center", vertical: "middle" }

            if (style === "title") {
                row.font = { bold: true, size: 16, color: { argb: "000000" } }
                row.height = 24
            } else if (style === "subtitle") {
                row.font = { bold: true, size: 12, color: { argb: "000000" } }
                row.height = 20
            } else if (style === "section") {
                row.font = { bold: true, size: 14, color: { argb: "000000" } }
                row.height = 22
                row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } }
            } else {
                row.font = { bold: true, size: 12 }
            }
        }

        // --- Header Section with improved styling ---
        const companyName = "Pune e Stock Broking Limited"
        // Company name with logo-like styling
        const titleRow = worksheet.addRow([companyName])
        mergeAndCenter(1, "title")
        titleRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } } // Blue background
            cell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } } // White text
        })

        worksheet.addRow([]) // Empty row

        if (includeFileData) {
            const reportTitle = `FINANCIAL YEAR REPORT OF ${finalFileName.replace(/_/g, " ")} ${year ? `: ${year}` : ""}`
            const dateRange = `Date Range: ${fromDate} to ${toDate}`
            const clientInfo = `Name: ${details.userDetails?.clientName}   |   Client ID: ${details.currentUser}   |   PAN: ${details.userDetails?.pan}   |   Mobile: ${details.userDetails?.mobile}`


            // Report title
            worksheet.addRow([reportTitle])
            mergeAndCenter(3, "subtitle")

            if (fromDate && toDate) {
                // Date range
                worksheet.addRow([dateRange])
            }
            mergeAndCenter(4)

            // Client info
            worksheet.addRow([clientInfo])
            mergeAndCenter(5)

            worksheet.addRow([]) // Empty row

            // --- Table of Contents ---
            const tocStartRow = worksheet.rowCount + 1
            const tocRow = worksheet.addRow(["Table of Contents"])
            mergeAndCenter(tocStartRow, "section")

            // Add TOC entries based on what data is available
            const tocEntries: string[] = []
            tocEntries.push("1. Summary")

            if (typeof moreDetails === "object") {
                let sectionIndex = 1
                Object.keys(moreDetails).forEach((key, index) => {
                    tocEntries.push(`   1.${sectionIndex}. ${key}`)
                    sectionIndex++
                })
            }

            tocEntries.push("2. Detailed Report")

            // Add TOC entries to worksheet
            tocEntries.forEach(entry => {
                worksheet.addRow([entry])
            })

            worksheet.addRow([]) // Empty row

            // --- Summary Section Header ---
            const summaryStartRow = worksheet.rowCount + 1
            const summaryRow = worksheet.addRow(["1. Summary"])
            mergeAndCenter(summaryStartRow, "section")
            sectionStartRows["Summary"] = summaryStartRow

            // Make TOC entries clickable
            worksheet.getCell(`A${tocStartRow + 1}`).value = {
                text: "1. Summary",
                hyperlink: `#'${worksheet.name}'!A${summaryStartRow}`,
            }
            worksheet.getCell(`A${tocStartRow + 1}`).font = { color: { argb: "0563C1" }, underline: true }

            worksheet.addRow([]) // Empty row

            // Create a styled header for the summary table
            const HeaderRow = worksheet.addRow(["Category", "Amount"])
            HeaderRow.eachCell((cell) => {
                cell.font = { bold: true, size: 11 }
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } }
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }
            })

            // Process moreDetails data with better formatting
            if (typeof moreDetails === "object") {
                let sectionIndex = 1

                Object.entries(moreDetails).forEach(([key, value], index) => {
                    worksheet.addRow([]) // Empty row

                    // Add section header
                    const sectionRow = worksheet.addRow([`1.${sectionIndex}. ${key}`])
                    sectionRow.font = { bold: true, size: 12 }
                    sectionStartRows[key] = worksheet.rowCount

                    // Make TOC entry clickable
                    const tocEntryIndex = tocStartRow + 1 + sectionIndex
                    worksheet.getCell(`A${tocEntryIndex}`).value = {
                        text: `   1.${sectionIndex}. ${key}`,
                        hyperlink: `#'${worksheet.name}'!A${sectionStartRows[key]}`,
                    }
                    worksheet.getCell(`A${tocEntryIndex}`).font = { color: { argb: "0563C1" }, underline: true }

                    // Handle objects with "rows" (like Expenses)
                    if (typeof value === "object" && "rows" in value) {
                        value.rows?.forEach((row) => {
                            const rowIndex = worksheet.rowCount + 1

                            const rawAmount = convertToNumberIfValid(row[value.rowAmount]);
                            const amountValue = rawAmount;
                            const dataRow = worksheet.addRow([
                                row[value.rowKey],
                                rawAmount
                            ])

                            // Apply cell styling
                            dataRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" },
                                }
                            })

                            // Format number cell
                            if (typeof dataRow.getCell(2).value === "number") {
                                dataRow.getCell(2).numFmt = "#,##0.00;[Red]-#,##0.00"

                                if (typeof amountValue === "number" && amountValue < 0 && key.toLowerCase() !== "expenses") {
                                    dataRow.getCell(2).font = { color: { argb: "FF0000" } }
                                }
                            }
                        })

                        if (value.total !== null) {
                            const rawtotal = convertToNumberIfValid(value.total);
                            const totalValue = key.toLowerCase() === "expenses" ? Math.abs(rawtotal as number) : rawtotal;

                            const profitLossText = Number(totalValue) >= 0 ? "Profit" : "Loss"

                            const totalRow = worksheet.addRow([
                                `${key} Total ${key.toLowerCase() !== "expenses" ? `(${profitLossText})` : ""}`,
                                totalValue
                            ])

                            totalRow.font = { bold: true }
                            totalRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: "double" },
                                    left: { style: "thin" },
                                    bottom: { style: "double" },
                                    right: { style: "thin" },
                                }
                                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } }
                            })

                            // Format number cell
                            worksheet.getCell(`B${worksheet.rowCount}`).numFmt = "#,##0.00;[Red]-#,##0.00"

                            if (Number(totalValue) < 0 && key.toLowerCase() !== "expenses") {
                                worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
                            }
                        }
                    }

                    // Handle arrays (like summaries)
                    else if (Array.isArray(value)) {
                        value.forEach((item) => {
                            const rowIndex = worksheet.rowCount + 1
                            const dataRow = worksheet.addRow([
                                item.code,
                                convertToNumberIfValid(item.sum)
                            ])

                            // Apply cell styling
                            dataRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" },
                                }
                            })

                            // Format number cell
                            if (typeof dataRow.getCell(2).value === "number") {
                                dataRow.getCell(2).numFmt = "#,##0.00;[Red]-#,##0.00"
                                const cellValue = dataRow.getCell(2).value;
                                if (typeof cellValue === "number" && cellValue < 0) {
                                    dataRow.getCell(2).font = { color: { argb: "FF0000" } }
                                }
                            }

                            // Store category row index for hyperlinking
                            const categoryRef = `Category_${item.code.replace(/\s+/g, "_")}`
                            categoryRowMapping[item.code] = categoryRef
                            worksheet.getCell(`A${rowIndex}`).name = categoryRef
                        })

                        // Calculate total for array items
                        const arrayTotal = value.reduce((sum, item) => {
                            const itemValue = convertToNumberIfValid(item.sum)
                            return sum + (typeof itemValue === "number" ? itemValue : 0)
                        }, 0)

                        const profitLossText = arrayTotal >= 0 ? "Profit" : "Loss"
                        const totalRow = worksheet.addRow([
                            `${key} Total (${profitLossText})`,
                            arrayTotal
                        ])

                        totalRow.font = { bold: true }
                        totalRow.eachCell((cell) => {
                            cell.border = {
                                top: { style: "double" },
                                left: { style: "thin" },
                                bottom: { style: "double" },
                                right: { style: "thin" },
                            }
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } }
                        })

                        // Format number cell
                        worksheet.getCell(`B${worksheet.rowCount}`).numFmt = "#,##0.00;[Red]-#,##0.00"
                        if (arrayTotal < 0) {
                            worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
                        }
                    }
                    // Handle other values (like plain numbers or strings)
                    else {
                        const rowIndex = worksheet.rowCount + 1
                        const dataRow = worksheet.addRow([key, convertToNumberIfValid(value)])

                        // Apply cell styling
                        dataRow.eachCell((cell) => {
                            cell.border = {
                                top: { style: "thin" },
                                left: { style: "thin" },
                                bottom: { style: "thin" },
                                right: { style: "thin" },
                            }
                        })

                        // Format number cell
                        if (typeof dataRow.getCell(2).value === "number") {
                            dataRow.getCell(2).numFmt = "#,##0.00;[Red]-#,##0.00"
                            const cellValue = dataRow.getCell(2).value;
                            if (cellValue !== null && cellValue !== undefined && typeof cellValue === "number" && cellValue < 0) {
                                dataRow.getCell(2).font = { color: { argb: "FF0000" } }
                            }
                        }
                    }

                    sectionIndex++
                })
            }

            worksheet.addRow([])
            worksheet.addRow([]) // Empty row

            // --- Detailed Report Section ---
            const detailedReportRow = worksheet.rowCount + 1
            worksheet.addRow(["2. Detailed Report"])
            mergeAndCenter(detailedReportRow, "section")
            sectionStartRows["DetailedReport"] = detailedReportRow

            // Make TOC entry clickable
            const detailedReportTocIndex = tocEntries.findIndex(entry => entry === "2. Detailed Report") + 1
            worksheet.getCell(`A${tocStartRow + detailedReportTocIndex}`).value = {
                text: "2. Detailed Report",
                hyperlink: `#'${worksheet.name}'!A${detailedReportRow}`,
            }
            worksheet.getCell(`A${tocStartRow + detailedReportTocIndex}`).font = { color: { argb: "0563C1" }, underline: true }

            worksheet.addRow([]) // Empty row
        }

        // Function to extract and format cell values
        const getFormattedCellValue = (col: any, row: any, rowElement: any) => {
            if (col.cell && typeof col.cell === "function") {
                const cellResult = col.cell({ row })
                const formatAmountNumber =
                    col.amountToBe ??
                    (typeof col.header === "string" && col.header.toLowerCase().includes("amount"));

                if (React.isValidElement(cellResult)) {
                    const tempDiv = document.createElement("div")
                    tempDiv.innerHTML = ReactDOMServer.renderToString(cellResult)
                    return convertToNumberIfValid(tempDiv.textContent?.trim() || tempDiv.innerText?.trim() || "", formatAmountNumber)
                }

                if (typeof cellResult === "string" && cellResult.includes("<")) {
                    const tempDiv = document.createElement("div")
                    tempDiv.innerHTML = cellResult
                    return convertToNumberIfValid(tempDiv.textContent?.trim() || tempDiv.innerText?.trim() || "", formatAmountNumber)
                }

                return convertToNumberIfValid(cellResult, formatAmountNumber)
            }

            return convertToNumberIfValid(row[col.accessorKey], col.amountToBe)
        }

        // Add column headers with styling
        const headerRow = worksheet.addRow(columnsData.map((col) => col.header))
        headerRow.font = { bold: true, size: 11 }
        headerRow.alignment = { horizontal: "center", vertical: "middle" }
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } }
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            }
        })

        // Add data rows with alternating colors and borders
        const currentData = dt.rows().data().toArray()
        const rowElements = dt.rows().nodes().toArray()

        // Calculate column totals for columns in columnsWithTotals
        const columnTotals: Record<string, number> = {}

        // Initialize totals for all columns that should have totals
        columnsWithTotals?.forEach((colKey) => {
            columnTotals[colKey] = 0
        })

        currentData.forEach((row, index) => {
            const rowData = columnsData.map((col, colIndex) => {
                const rowElement = rowElements[index]
                const value = getFormattedCellValue(col, row, rowElement)

                // Add to column totals if this column should have a total
                if (columnsWithTotals?.includes(col.accessorKey) && typeof value === "number") {
                    columnTotals[col.accessorKey] = (columnTotals[col.accessorKey] || 0) + value
                }

                return value
            })

            const dataRow = worksheet.addRow(rowData)

            // Apply alternating row colors
            if (index % 2 === 1) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9F9F9" } }
                })
            }

            // Apply borders to all cells
            dataRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }

                // Format number cells
                // if (typeof cell.value === "number") {
                //     cell.numFmt = "#,##0.00;[Red]-#,##0.00"
                //     if (cell.value < 0) {
                //         cell.font = { color: { argb: "FF0000" } }
                //     }
                // }
            })
        })

        // Create section total row with totals for specified columns
        if (columnsWithTotals?.length) {
            const totalRowValues = columnsData.map((col, colIndex) => {
                if (colIndex === 0) return "Total"

                // If this is a column that should have a total
                if (columnsWithTotals?.includes(col.accessorKey)) {
                    return columnTotals[col.accessorKey] || 0
                }

                return ""
            })

            const sectionTotalRow = worksheet.addRow(totalRowValues)
            sectionTotalRow.font = { bold: true }
            sectionTotalRow.eachCell((cell, colIndex) => {
                cell.border = {
                    top: { style: "double" },
                    left: { style: "thin" },
                    bottom: { style: "double" },
                    right: { style: "thin" },
                }
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } }

                // Format number cells
                if (typeof cell.value === "number") {
                    cell.numFmt = "#,##0.00;[Red]-#,##0.00"
                    if (cell.value < 0) {
                        cell.font = { bold: true, color: { argb: "FF0000" } }
                    }
                }
            })
        }

        // Auto-size columns for better readability
        worksheet.columns.forEach((col) => {
            let maxLength = 0
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const cellLength = cell.value ? cell.value.toString().length : 0
                if (cellLength > maxLength) {
                    maxLength = cellLength
                }
            })
            col.width = Math.min(maxLength + 4, 30) // Add padding but cap at 30
        })

        // Add a back-to-top link at the end
        worksheet.addRow([]) // Empty row
        // const backToTopRow = worksheet.addRow(["Back to Table of Contents"])
        // backToTopRow.getCell(1).value = {
        //     text: "Back to Table of Contents",
        //     hyperlink: `#'${worksheet.name}'!A${tocStartRow}`,
        // }
        // backToTopRow.getCell(1).font = { color: { argb: "0563C1" }, underline: true }

        // Generate and save the Excel file
        const buffer = await workbook.xlsx.writeBuffer()
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        const filename = `${finalFileName}_${timestamp}.xlsx`
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename)
    }

    const downloadPDFFunc = () => {
        const dt = $(tableRef.current).DataTable();
        const allColumns = dt.columns().indexes().toArray();
        // const columnsData = columns.filter((_, index) => allColumns[index + 1]).filter(col => col.id !== "actions");
        const columnsData = getVisibleColumns()
        const totalColumns = columnsData.length

        const currentData = dt.rows().data().toArray()

        const getFormattedCellValue = (col, row) => {
            let value = ""

            if (col.cell && typeof col.cell === "function") {
                const cellResult = col.cell({ row })

                if (React.isValidElement(cellResult)) {
                    const tempDiv = document.createElement("div")
                    tempDiv.innerHTML = ReactDOMServer.renderToString(cellResult)
                    value = tempDiv.textContent || tempDiv.innerText || ""
                } else if (typeof cellResult === "string" && cellResult.includes("<")) {
                    const tempDiv = document.createElement("div")
                    tempDiv.innerHTML = cellResult
                    value = tempDiv.textContent || tempDiv.innerText || ""
                } else {
                    value = cellResult ?? ""
                }
            } else {
                value = row[col.accessorKey] ?? ""
            }

            value = String(value).trim()

            if (value.length === 1) return value

            const looksLikeCurrency = (val) =>
                typeof val === "string" &&
                val.match(/₹|\$|,/) &&
                !val.match(/[a-zA-Z]/) &&
                val.trim().length < 16

            if (looksLikeCurrency(value)) {
                value = value.replace(/[^0-9.-]/g, "")
            }

            const isNumericValue = (val) =>
                typeof val === "string" &&
                !isNaN(Number(val)) &&
                !/[a-zA-Z]/.test(val) &&
                /^-?\d+(\.\d+)?$/.test(val.trim()) &&
                val.trim().length < 16

            if (isNumericValue(value)) {
                return Number(value).toFixed(2)
            }

            return value
        }


        // const convertToNumber = (value) => {
        //     if (value === null || value === undefined || value === "") return "-";
        //     if (typeof value === "string" && value.length === 1) return value; // Return single char as-is

        //     if (typeof value === "number") {
        //         return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        //     }


        //     if (typeof value === "string") {
        //         if (typeof value === "string") {
        //             if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        //                 return value; // already in DD/MM/YYYY
        //             } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        //                 const [year, month, day] = value.split("-");
        //                 return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
        //             }
        //         }
        //         if (/[a-zA-Z]/.test(value)) return value; // Alphanumeric content, leave as-is

        //         const cleanedValue = value.replace(/[^0-9.-]/g, "").trim();
        //         const numericValue = Number.parseFloat(cleanedValue);

        //         return isNaN(numericValue)
        //             ? value
        //             : numericValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        //     }


        //     return value;
        // };

        const convertToNumber = (value: any, amountToBe: boolean = false): number | string => {
            if (value === null || value === undefined || value === "" || value === "N/A")
                return 0;

            if (typeof value === "string") {
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                    return value; // already in DD/MM/YYYY
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    const [year, month, day] = value.split("-");
                    return `${day}/${month}/${year}`; // convert to DD/MM/YYYY
                }
            }

            if (typeof value === "string") {
                if (/[a-zA-Z]/.test(value)) return value.trim();

                const cleanedValue = value.replace(/[^0-9.-]/g, "").trim();
                const numericValue = Number.parseFloat(cleanedValue);

                if (isNaN(numericValue)) return "0";

                return Number(numericValue.toFixed(2)); // returns float with 2 decimal places
            }

            if (typeof value === "number") {
                return Number(value.toFixed(2));
            }

            return 0;
        };

        // Create PDF with minimal margins
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        })

        const finalFileName = downloadFileName?.trim() ? downloadFileName : document.title

        // Define consistent margins and dimensions
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const margin = 5 // 5mm margin on all sides
        const contentWidth = pageWidth - margin * 2
        let currentY = margin + 10 // Start position from top

        if (includeFileData) {// Set document properties
            doc.setProperties({
                title: `Report - ${details.userDetails?.clientName || "-"}`,
                subject: `Client Report: ${details.currentUser || "-"}`,
                author: "Pune e Stock Broking Limited",
                creator: "Pune e Stock Broking Limited",
            })

            // Company Header with gradient-like appearance
            doc.setFillColor(20, 60, 120)
            doc.rect(margin, currentY - 5, contentWidth, 22, "F")
            doc.setFillColor(40, 80, 140)
            doc.rect(margin, currentY - 5, contentWidth, 2, "F")
            doc.setFillColor(10, 40, 100)
            doc.rect(margin, currentY + 5, contentWidth, 2, "F")

            doc.setFont("helvetica", "bold")
            doc.setFontSize(14) // Slightly smaller for better fit
            doc.setTextColor(255, 255, 255)
            doc.text("Pune e Stock Broking Limited", pageWidth / 2, currentY + 2, { align: "center" })
            currentY += 4

            // Add address and contact details
            doc.setFont("helvetica", "normal")
            doc.setFontSize(7.5)
            doc.setTextColor(255, 255, 255)
            doc.text(
                "1198 Shukrawar Peth, Subhash Nagar Lane No.3 Pune, Maharashtra, India, Tel No. 020-41000600 / 020-24496162 Fax No. 020-24498100",
                pageWidth / 2,
                currentY + 2,
                { align: "center", maxWidth: contentWidth }
            )
            currentY += 3

            doc.text(
                "SEBI Registration No: NSE-EQ: INB231289233, NSE-F&O: INF231289233, NSE-CDS: INF231289233, BSE-EQ: INB011289239, MCX-SX: INZ000027030",
                pageWidth / 2,
                currentY + 2,
                { align: "center", maxWidth: contentWidth }
            )
            currentY += 3

            doc.text(
                "BSE-EQ: INB0, BSE-F&O: INF, MCX-SX: INE",
                pageWidth / 2,
                currentY + 2,
                { align: "center", maxWidth: contentWidth }
            )
            currentY += 12 // Slightly increased spacing before the report title

            // Report Title with subtle background
            doc.setFillColor(240, 245, 250)
            doc.rect(margin, currentY - 2, contentWidth, 10, "F")
            doc.setTextColor(20, 60, 120)
            doc.setFontSize(11)
            doc.text(`FINANCIAL YEAR REPORT - ${finalFileName.replace(/_/g, " ")}`, pageWidth / 2, currentY + 2, {
                align: "center",
            })
            currentY += 10 // Reduced spacing

            // Display Financial Year and Date Range below the title
            if (year) {
                doc.setFontSize(9)
                doc.setTextColor(50, 50, 80)
                doc.setFont("helvetica", "bold")
                doc.text("Financial Year:", margin + 5, currentY)
                doc.setFont("helvetica", "normal")
                doc.text(year || "-", margin + 35, currentY)
            }

            if (fromDate && toDate) {
                doc.setFont("helvetica", "bold")
                doc.text("Date Range:", pageWidth - 80, currentY)
                doc.setFont("helvetica", "normal")
                doc.text(`${fromDate || "-"} to ${toDate || "-"}`, pageWidth - margin - 5, currentY, { align: "right" })
                currentY += 8
            } else {
                currentY += 8
            }

            // Client Information Box
            doc.setFillColor(248, 248, 248)
            doc.rect(margin, currentY - 2, contentWidth, 28, "F") // Adjusted height

            // Top border
            doc.setDrawColor(100, 100, 120)
            doc.setLineWidth(0.3)
            doc.rect(margin, currentY - 2, contentWidth, 28, "S")

            // Add section title with background
            doc.setFillColor(230, 230, 235)
            doc.rect(margin + 1, currentY - 1, contentWidth - 2, 6, "F")

            doc.setFontSize(9)
            doc.setTextColor(50, 50, 80)
            doc.setFont("helvetica", "bold")
            doc.text("CLIENT INFORMATION", pageWidth / 2, currentY + 3, { align: "center" })
            currentY += 10

            // Add client info with proper alignment
            const leftLabelX = margin + 5
            const leftValueX = margin + 35
            const rightLabelX = pageWidth / 2 + 5
            const rightValueX = pageWidth - margin - 5

            doc.setFontSize(8) // Smaller font for better fit
            doc.setTextColor(50, 50, 50)

            // Row 1 - Client Name & PAN
            doc.setFont("helvetica", "bold")
            doc.text("Client Name:", leftLabelX, currentY)
            doc.setFont("helvetica", "normal")
            doc.text(details.userDetails?.clientName || "-", leftValueX, currentY)

            doc.setFont("helvetica", "bold")
            doc.text("PAN:", rightLabelX, currentY)
            doc.setFont("helvetica", "normal")
            doc.text(details.userDetails?.pan || "-", rightValueX, currentY, { align: "right" })
            currentY += 6 // Reduced spacing

            // Row 2 - Client ID & Mobile
            doc.setFont("helvetica", "bold")
            doc.text("Client ID:", leftLabelX, currentY)
            doc.setFont("helvetica", "normal")
            doc.text(details.currentUser || "-", leftValueX, currentY)

            doc.setFont("helvetica", "bold")
            doc.text("Mobile:", rightLabelX, currentY)
            doc.setFont("helvetica", "normal")
            doc.text(details.userDetails?.mobile || "-", rightValueX, currentY, { align: "right" })
            currentY += 6 // Reduced spacing

            // Row 3 - Email (If Available)
            if (details.userDetails?.email) {
                doc.setFont("helvetica", "bold")
                doc.text("Email:", leftLabelX, currentY)
                doc.setFont("helvetica", "normal")
                doc.text(details.userDetails.email || "-", leftValueX, currentY)
            }
            currentY += 12 // Spacing before next section

            // Process moreDetails if available
            if (typeof moreDetails === "object") {
                // Section header
                doc.setFillColor(245, 222, 179) // Warm Sand (Soft Golden)
                doc.rect(margin, currentY - 5, contentWidth, 8, "F")

                doc.setFontSize(10)
                doc.setFont("helvetica", "bold")
                doc.setTextColor(80, 40, 20) // Deep Brown for contrast
                doc.text("FINANCIAL SUMMARY", pageWidth / 2, currentY, { align: "center" })
                currentY += 10

                Object.entries(moreDetails).forEach(([key, value]) => {
                    const isExpenses = key.toLowerCase() === "expenses";

                    if (typeof value === "object" && "rows" in value) {
                        // Section header with styling
                        const isPositive = (value.total || 0) >= 0

                        doc.setFillColor(isPositive ? 220 : 240, isPositive ? 240 : 230, 220)
                        doc.rect(margin, currentY - 5, contentWidth, 8, "F")
                        doc.setDrawColor(180, 180, 190)
                        doc.setLineWidth(0.2)
                        doc.rect(margin, currentY - 5, contentWidth, 8, "S")

                        doc.setFontSize(9)
                        doc.setFont("helvetica", "bold")
                        doc.setTextColor(50, 50, 80)
                        doc.text(key.toUpperCase(), margin + 5, currentY + 1)
                        currentY += 4

                        const tableRows = value.rows.map((row) => [row[value.rowKey], convertToNumber(row[value.rowAmount])])

                        // Add Total Row with "Profit" or "Loss"
                        if (value.total !== null) {
                            const totalValue = convertToNumber(value.total);
                            const profitLossText = value.total >= 0 ? "Profit" : "Loss";

                            tableRows.push([`${key} Total ${isExpenses ? "" : `(${profitLossText})`}`, totalValue]);
                        }


                        // Generate Table with consistent margins
                        autoTable(doc, {
                            startY: currentY,
                            body: tableRows,
                            styles: {
                                fontSize: 7,
                                cellPadding: 2,
                                lineWidth: 0.1,
                            },
                            theme: "grid",
                            margin: { left: margin, right: margin }, // Consistent margins
                            columnStyles: {
                                0: { cellWidth: contentWidth * 0.7, fontStyle: "normal" },
                                1: { cellWidth: contentWidth * 0.3, halign: "right" },
                            },
                            didParseCell: (data) => {
                                // Format the total row
                                if (data.row.index === tableRows.length - 1) {
                                    data.cell.styles.fontStyle = "bold"
                                    data.cell.styles.fillColor = [isPositive ? 220 : 240, isPositive ? 240 : 230, 220]
                                    data.cell.styles.textColor = [50, 50, 80]
                                }

                                // Format amount cells
                                if (data.column.index === 1) {
                                    data.cell.styles.halign = "right"
                                }
                            },
                        })

                        currentY = (doc as any).lastAutoTable.finalY + 8 // Reduced spacing
                    } else {
                        const formatValue = convertToNumber(value)
                        // Key-Value Pairs (like Opening Balance)
                        doc.setFontSize(8)
                        doc.setFont("helvetica", "bold")
                        doc.text(`${key}:`, margin + 5, currentY + 2)
                        doc.setFont("helvetica", "normal")
                        doc.text(`${isExpenses ? Math.abs(Number(formatValue)) : String(formatValue)}`, margin + 30, currentY + 2)
                        currentY += 6 // Reduced spacing
                    }
                })
            }
            doc.addPage()
        }

        // --- START NEW PAGE FOR DETAILED REPORT ---
        currentY = margin + 10 // Start position from top with margin

        // Detailed Report Header
        doc.setFillColor(245, 222, 179) // Warm Sand (Soft Golden)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(80, 40, 20) // Deep Brown for contrast
        doc.text("DETAILED REPORT", pageWidth / 2, currentY, { align: "center" })
        currentY += 10

        const headers = [columnsData.map((col) => col.header)]

        const tableRows = currentData.map((row) => columnsData.map((col) => convertToNumber(getFormattedCellValue(col, row))))

        const footerRow = Array(totalColumns).fill("") // Create an empty row for totals

        columnsWithTotals?.forEach((colId) => {
            const dtColumnIndex = dt
                .columns()
                .indexes()
                .toArray()
                .find((index) => dt.column(index).dataSrc() === colId)

            if (dtColumnIndex === undefined) return

            const total = dt
                .column(dtColumnIndex, { search: "applied" })
                .data()
                .reduce((a, b) => Number.parseFloat(a.toString()) + Number.parseFloat(b), 0)

            const excelColumnIndex = columnsData.findIndex((col) => col.accessorKey === colId)
            if (excelColumnIndex !== -1) {
                footerRow[excelColumnIndex] = total.toFixed(2) // Store as a formatted number
            }
        })

        tableRows.push(footerRow)

        // Generate main data table with consistent margins
        autoTable(doc, {
            startY: currentY,
            head: headers,
            body: tableRows,
            styles: {
                fontSize: 6.5, // Smaller font
                cellPadding: 1.5, // Minimal padding
                overflow: "linebreak",
                lineWidth: 0.1, // Thinner lines
            },
            headStyles: {
                fillColor: [40, 80, 140],
                textColor: 255,
                fontSize: 7,
                fontStyle: "bold",
                cellPadding: 1.5, // Minimal padding
            },
            alternateRowStyles: { fillColor: [245, 245, 248] },
            margin: { left: margin, right: margin }, // Consistent margins
            didParseCell: (data) => {
                // Format numeric cells
                if (data.cell.text && typeof data.cell.text === "string") {
                    const text = data.cell.text
                    // If it looks like a number with decimal places
                    if (/^-?\d+\.\d+$/.test(text)) {
                        data.cell.styles.halign = "right"
                    }
                    // If it looks like a date
                    else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text)) {
                        data.cell.styles.halign = "center"
                    }
                }

                // Format footer row
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = "bold"
                    data.cell.styles.fillColor = [230, 230, 235]
                    data.cell.styles.textColor = [50, 50, 80]
                }
            },
            willDrawCell: (data) => {
                // Prevent text from being cut off
                if (data.cell.height < 6) {
                    data.cell.height = 6 // Minimum height
                }
            },
            // Optimize column widths based on content
            columnStyles: (() => {
                const styles = {}
                // Set specific widths for date and amount columns
                columnsData.forEach((col, index) => {
                    const header = col.header.toLowerCase()
                    if (header.includes("date")) {
                        styles[index] = { cellWidth: 18, halign: "center" }
                    } else if (
                        header.includes("amount") ||
                        header.includes("price") ||
                        header.includes("value") ||
                        header.includes("total")
                    ) {
                        styles[index] = { cellWidth: 22, halign: "right" }
                    }
                })
                return styles
            })(),
        })

        // Add footer with date and page number
        const addFooter = (doc) => {
            const pageCount = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)

                // Add subtle footer line
                doc.setDrawColor(200, 200, 200)
                doc.setLineWidth(0.1)
                doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8)

                doc.setFontSize(7)
                doc.setFont("helvetica", "normal")
                doc.setTextColor(100, 100, 100)

                // Date on left
                const today = new Date().toLocaleDateString("en-IN")
                doc.text(`Generated on: ${today}`, margin, pageHeight - 5)

                // Company name in center
                doc.setFont("helvetica", "bold")
                doc.text("Pune e Stock Broking Limited", pageWidth / 2, pageHeight - 5, { align: "center" })

                // Page number on right
                doc.setFont("helvetica", "normal")
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: "right" })
            }
        }

        // Add footer
        addFooter(doc)

        // Save PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        const filename = `${finalFileName}_${timestamp}.pdf`
        doc.save(filename)
    };

    const resizeDataTables = () => {
        setTimeout(() => {
            $(".dataTable").each(function () {
                const table = $(this).DataTable();
                if ($.fn.dataTable.isDataTable(this)) {
                    table.columns.adjust().responsive.recalc();
                    table.draw(false);
                }
            });

            $(".dataTable").css("width", "100%"); // Ensure full width
        }, 300); // Delay to avoid layout shifts
    };

    useEffect(() => {
        window.addEventListener("resize", resizeDataTables);

        return () => {
            window.removeEventListener("resize", resizeDataTables);
        };
    }, []);

    useEffect(() => {
        if (!tableRef.current) return;

        $(tableRef.current).on("responsive-display", (e, datatable, row, showHide) => {
            const $row = $(row.node());
            const $control = $row.find(".dtr-control");

            if (showHide) {
                $control.addClass("expanded"); // ✅ Add expanded class on open
            } else {
                $control.removeClass("expanded"); // ✅ Remove expanded class on close
            }
        });

        return () => {
            if (tableRef.current) {
                $(tableRef.current).off("responsive-display"); // ✅ Prevent duplicate event bindings
            }
        };
    }, []);

    useEffect(() => {
        if (dtRef.current) {
            dtRef.current.search(globalSearchValue).draw();
        }
    }, [globalSearchValue]);

    return (
        <div className="w-full mt-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg border border-border shadow-sm sm:justify-between">
                {/* Search (Left on Larger Screens) */}
                <div className="relative flex items-center w-full sm:w-auto max-w-sm ">
                    <Search className="absolute left-2 h-3 w-3 text-muted-foreground" />
                    <Input
                        id={`global-search-${Math.random().toString(36).substr(2, 9)}`}
                        type="search"
                        className="w-full pl-8 pr-10 h-9 rounded-md border bg-background text-xs focus:ring focus:ring-ring custom-search-input"
                        placeholder="Search all columns..."
                        value={globalSearchValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setGlobalSearchValue(value);
                        }}
                    />
                    {globalSearchValue && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 hover:text-foreground hover:bg-transparent"
                            onClick={() => setGlobalSearchValue("")}
                        >
                            <X className="h-1 w-1 p-0 m-0" />
                        </Button>
                    )}
                </div>

                {/* Other Controls */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-row sm:gap-4">
                    {/* Clear Filters */}
                    {columnSearch && (
                        <button
                            className="px-3 py-2 flex items-center gap-2 rounded-md border border-border bg-background text-xs font-medium hover:bg-muted"
                            onClick={clearAllFilters}
                        >
                            <Filter className="h-3 w-3" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}

                    {viewColumns &&
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 p-1 px-2">
                                    <Eye className="h-3 w-3" />
                                    <span className="hidden sm:inline text-xs">Columns</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[200px] p-0">
                                <Command>
                                    <CommandGroup key={downloadFileName}>
                                        {columns
                                            .filter((column) => column.hidden !== true)
                                            .map((column) => {
                                                const isSelected = columnVisibility[column.accessorKey] ?? false;

                                                return (
                                                    <CommandItem
                                                        key={column.accessorKey || column.id}
                                                        onSelect={() => toggleColumnVisibility(column.accessorKey)}
                                                        disabled={column.disabled}
                                                    >
                                                        <Check className={`mr-2 h-3 w-3 transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                                        {column.header}
                                                    </CommandItem>
                                                );
                                            })}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    }


                    {/* Export Options */}
                    {
                        downloadExcel && downloadCSV && downloadPDF && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-2 flex items-center gap-2 rounded-md border border-border bg-background text-xs font-medium hover:bg-muted">
                                        <Download className="h-3 w-3" />
                                        <span className="hidden sm:inline">Export</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[80px] text-xs">
                                    {downloadCSV && (
                                        <DropdownMenuCheckboxItem onClick={downloadCSVFunc} className="flex items-center gap-1 justify-around p-2">
                                            <Image src="/images/SVG/csv.svg" alt="CSV icon" width={15} height={15} priority className="cursor-pointer m-1" />
                                            CSV
                                        </DropdownMenuCheckboxItem>
                                    )}
                                    {downloadExcel && (
                                        <DropdownMenuCheckboxItem onClick={downloadExcelFunc} className="flex items-center gap-1 justify-around p-2">
                                            <Image src="/images/SVG/excel.svg" alt="Excel icon" width={20} height={20} priority className="cursor-pointer m-1" />
                                            Excel
                                        </DropdownMenuCheckboxItem>
                                    )}
                                    {downloadPDF && (
                                        <DropdownMenuCheckboxItem onClick={downloadPDFFunc} className="flex items-center gap-1 justify-around p-2">
                                            <Image src="/images/SVG/pdfSvg.svg" alt="PDF icon" width={20} height={20} priority className="cursor-pointer m-1" />
                                            PDF
                                        </DropdownMenuCheckboxItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }

                    {/* Entries Selector */}
                    {showPagination && (
                        <div className="ml-auto">
                            <span className="text-xs text-muted-foreground">Show</span>
                            <select
                                title="entries"
                                className="h-8 px-1 rounded-md border border-border bg-background text-xs mx-1"
                                onChange={(e) => {
                                    if (dtRef.current) {
                                        dtRef.current.page.len(Number.parseInt(e.target.value)).draw();
                                    }
                                }}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span className="text-xs text-muted-foreground">entries</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-md">
                <table id={tableId} ref={tableRef} className="row-border hover cell-border">
                    <thead></thead>
                    <tbody></tbody>
                    {columnsWithTotals && (
                        <tfoot>
                            <tr>
                                {/* ✅ Add a hidden first column */}
                                <th style={{ display: "none" }}></th>

                                {/* ✅ Add checkbox column if `selectableRows` is enabled */}
                                {selectableRows && <th></th>}

                                {/* ✅ Generate `<th>` for all columns */}
                                {memoizedColumns.map((column, index) => (
                                    <th key={index} data-column-id={column.accessorKey}>
                                        {columnsWithTotals.includes(column.accessorKey) ? "" : ""}
                                    </th>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}

export default DataTableArray