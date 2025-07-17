/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import React, { useEffect, useRef, useMemo, useState, useCallback, useImperativeHandle } from "react"
import $ from "jquery"
import "datatables.net-dt"
import "datatables.net-responsive-dt"
import "datatables.net-select-dt"
import "datatables.net-buttons-dt"
import "datatables.net-buttons/js/buttons.html5"
import "datatables.net-buttons/js/buttons.print"
import 'datatables.net-scroller'
import "datatables.net-fixedheader"
import "@/components/data-table.css"
import 'mark.js/dist/jquery.mark.js'; // This attaches mark.js to jQuery

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, LineChartIcon as ChartLine, ChevronRight, Search, Filter, X, Eye, Check, Download } from 'lucide-react'
import { useUser } from "@/contexts/UserContext"
import ReactDOMServer from "react-dom/server"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

import autoTable from "jspdf-autotable"
import jsPDF from "jspdf"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useSidebar } from "./ui/sidebar"

interface DatatableNetProps<TData extends Record<string, any> = any, TValue = any> {
    columns: any
    data: TData
    showAllRows?: boolean
    filterColumn?: string
    filterPlaceholder?: string
    selectableRows?: boolean
    onSelectedRowsChange?: (selectedRows: TData[]) => void
    hiddenColumns?: string[]
    year: string
    fromDate: string
    toDate: string
    totalDataSummary: {
        unrealized: number
        realized: number
        liabilities: number
    }
    expensesData: {
        rowKey: string
        rowAmount: string
        rows: any[]
        total: number
    }
    showPagination?: boolean
    downloadFileName?: string
    onAddPortfolio?: (row: any) => void
    columnsWithTotals?: string[]
    columnSearch?: boolean
    includeFileData?: boolean
    downloadPDF?: boolean
    downloadExcel?: boolean
    downloadCSV?: boolean
    ref?: any
}

const DatatableNet: React.FC<DatatableNetProps> = ({
    columns,
    data,
    showAllRows = false,
    year,
    fromDate,
    toDate,
    selectableRows,
    totalDataSummary,
    expensesData,
    showPagination = true,
    columnSearch = false,
    ref,
    downloadFileName = "data",
    onAddPortfolio,
    columnsWithTotals,
    downloadPDF = true,
    downloadExcel = true,
    downloadCSV = true
}) => {
    const tableRef = useRef<any>(null)
    const [columnVisibility, setColumnVisibility] = React.useState<{ [key: string]: boolean }>({})
    const { userDetails, currentUser } = useUser();
    const [details, setDetails] = useState<{ userDetails: any; currentUser: any }>({ userDetails: null, currentUser: null });
    const [globalSearchValue, setGlobalSearchValue] = useState("")
    const isInitializedRef = useRef(false)
    const searchParams = useSearchParams();
    const dtRef = useRef<any>(null)
    useImperativeHandle(ref, () => dtRef.current)
    const [open, setOpen] = useState(false);
    const memoizedData = useMemo(() => data, [data])
    const memoizedColumns = useMemo(() => columns, [columns])
    const { state } = useSidebar();

    useEffect(() => {
        const clientId = searchParams.get('clientId');
        const isBranchCheck = searchParams.get('branchClientCheck');
        const isfamilyClientCheck = searchParams.get('familyClientCheck');

        setDetails(prevDetails => {
            let parsedDtls: any = null;
            let sessionKey = '';

            if (clientId) {
                if (isBranchCheck) {
                    sessionKey = `branchClientCheck_${clientId}`;
                } else if (isfamilyClientCheck) {
                    sessionKey = `familyClientCheck_${clientId}`;
                }

                if (sessionKey) {
                    const dtls = sessionStorage.getItem(sessionKey);
                    parsedDtls = dtls ? JSON.parse(dtls) : null;

                    if (
                        prevDetails.userDetails !== parsedDtls ||
                        prevDetails.currentUser !== clientId
                    ) {
                        return { userDetails: parsedDtls, currentUser: clientId };
                    }

                    return prevDetails; // ✅ Avoid re-render if no change
                }
            }

            // Fallback to userDetails from props/state
            if (
                prevDetails.userDetails !== userDetails ||
                prevDetails.currentUser !== currentUser
            ) {
                return { userDetails, currentUser };
            }

            return prevDetails; // ✅ No changes, no re-render
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

    const groupedData = useMemo(() => {
        if (!memoizedData || typeof memoizedData !== "object") return []
        return Object.entries(memoizedData).map(([key, value]) => {
            const typedValue = value as { sum: number; rows: any[] }
            return {
                category: key,
                sum: typedValue.sum,
                rows: typedValue.rows,
            }
        })
    }, [memoizedData])

    const flattenedData = useMemo(
        () => groupedData.flatMap((section) => section.rows.map((row) => ({ ...row, category: section.category }))),
        [groupedData],
    )

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
                        "max-width": "100px", // Prevents too wide columns
                        "width": "auto", // Auto-distribute width
                    });
                });
                dtRef.current.columns.adjust().responsive.recalc().draw(false);
            }, 300);
        }
    }, [state]);

    const handleResponsiveDisplay = useCallback((e, datatable, row, showHide) => {
        const $row = $(row.node());
        const $control = $row.find(".dtr-control");

        if (showHide) {
            $control.addClass("expanded");
        } else {
            $control.removeClass("expanded");
        }
    }, []);

    useEffect(() => {
        if (!tableRef.current) return;

        $(tableRef.current).on("responsive-display", handleResponsiveDisplay);

        return () => {
            if (tableRef.current) {
                $(tableRef.current).off("responsive-display", handleResponsiveDisplay);
            }
        };
    }, [handleResponsiveDisplay]);

    useEffect(() => {
        if (!tableRef.current || isInitializedRef.current) return

        if (tableRef.current && $.fn.DataTable()) {
            const dt = $(tableRef.current).DataTable({
                data: flattenedData,
                columns: [
                    {
                        data: null,
                        defaultContent: "",
                        className: "dtr-control",
                        orderable: false,
                        // render: (data, type, row) =>
                        //     ReactDOMServer.renderToString(<ChevronRight className="h-4 w-4 transition-transform" />),
                    },
                    ...columns.map((col) => ({
                        data: col.accessorKey,
                        title: col.header,
                        visible: !col.hidden && !col.deselected,
                        name: col.accessorKey,
                        orderable: col.sortable !== false,
                        width: col.width ?? undefined,
                        render: (data, type, row, meta) => {
                            // ✅ If dtRender is provided, use it and skip the rest
                            if (typeof col.dtRender === "function") {
                                return col.dtRender(data, type, row, meta);
                            }
                            if (col.cell && typeof col.cell === "function") {
                                const cellContent = col.cell({ row })
                                if (React.isValidElement(cellContent)) {
                                    return ReactDOMServer.renderToString(cellContent)
                                }
                                return cellContent
                            }
                            return data
                        },
                    })),
                ],
                responsive: {
                    details: {
                        type: "column",
                        target: selectableRows ? 1 : 0, // Change target to 1 (second column) since first column is checkbox
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
                    ...columns.map((col, index) => ({
                        targets: index + 1,
                        orderable: col.sortable !== false,
                    })),
                    {
                        responsivePriority: 1, // Highest priority (never hide)
                        targets: [0, 1], // First column and second column (if selectableRows is true)
                    },
                    {
                        responsivePriority: 2, // High priority
                        targets: columns
                            .map((col, idx) => idx + 1)
                            .filter((idx) => {
                                const col = columns[idx - 1]
                                return col && (col.accessorKey === "id" || col.accessorKey === "name" || col.accessorKey === "date")
                            }),
                    },
                    {
                        responsivePriority: 10000, // Low priority (hide first)
                        targets: columns
                            .map((col, idx) => idx + 1)
                            .filter((idx) => {
                                const col = columns[idx - 1]
                                return col && (col.accessorKey === "description" || col.accessorKey === "details")
                            }),
                    },
                ],
                dom: '<"datatable-container"t><"datatable-footer"<"datatable-info"i><"datatable-pagination"p>>',
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
                deferRender: true,
                destroy: true,
                scrollX: true,
                autoWidth: false,
                order: [],
                scrollY: showPagination ? "800px" : "500px",
                scrollCollapse: true,
                pageLength: showAllRows ? flattenedData.length : 10,
                ordering: true,
                paging: true,
                scroller: true,
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

                rowCallback: (row, data, index) => {
                    $(row).css({
                        "line-height": "1.2",
                        "font-size": "0.75rem",
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
                            const input = $('<input type="text" class="column-search" placeholder="Search ' + title + '" />')

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
                    const lengthSelect = $('<select class="custom-length-select"></select>')

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
                    const infoContainer = $(".datatable-info")
                    api.on("draw", () => {
                        const info = api.page.info()
                        const infoHtml = `
                            <div class="custom-info">
                                <span>Showing ${info.start + 1} to ${info.end} of ${info.recordsDisplay} entries</span>
                                ${info.recordsDisplay !== info.recordsTotal
                                ? `<span class="filtered-info">(filtered from ${info.recordsTotal} total entries)</span>`
                                : ""
                            }
                            </div>
                        `
                        infoContainer.html(infoHtml)
                    })
                    api.draw() // Force a redraw to apply all styles properly

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

                drawCallback: function (settings: any) {
                    const api = new $.fn.dataTable.Api(settings)
                    let lastCategory = null

                    api.rows({ page: "current" }).every(function () {
                        const data = this.data()
                        if (data.category !== lastCategory) {
                            const visibleColumns = api
                                .columns()
                                .indexes()
                                .filter((index) => api.column(index).visible())
                            const categoryRow = createCategoryRow(
                                data.category,
                                groupedData.find((g) => g.category === data.category)?.sum || 0,
                                visibleColumns.length,
                            )
                            $(this.node()).before(categoryRow)
                            lastCategory = data.category
                        }
                    })
                    $(tableRef.current).on("click", ".add-portfolio-btn", function () {
                        const rowData = JSON.parse($(this).attr("data-row") || "")
                        onAddPortfolio?.(rowData)
                    })
                },

                footerCallback: function (row, data, start, end, display) {
                    const api = (this as any).api();
                    api.columns.adjust(); // ⚠️ DO NOT CALL `.draw()`

                    columnsWithTotals?.forEach((colId) => {
                        const dtColumnIndex = api
                            .columns()
                            .indexes()
                            .toArray()
                            .find((index) => {
                                return api.column(index).dataSrc() === colId;
                            });

                        if (dtColumnIndex === undefined) {
                            return;
                        }

                        const footerCell = api.column(dtColumnIndex).footer();
                        if (!footerCell) {
                            return;
                        }

                        const total = api
                            .column(dtColumnIndex, { search: "applied" })
                            .data()
                            .reduce((a, b) => {
                                const numA = typeof a === "number" ? a : parseFloat(a) || 0;
                                const numB = typeof b === "number" ? b : parseFloat(b) || 0;
                                return numA + numB;
                            }, 0);

                        const formattedTotal = new Intl.NumberFormat("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(total);

                        // ✅ Set color based on value
                        const color = total >= 0 ? "green" : "red";
                        footerCell.innerHTML = `<span style="color: ${color}; font-weight: bold;">${formattedTotal}</span>`;
                    });
                }
            })

            dtRef.current = dt
            isInitializedRef.current = true

            // Initialize column visibility state
            const initialVisibility: { [key: string]: boolean } = {}
            columns.forEach((col) => {
                initialVisibility[col.accessorKey as string] = !col.hidden && !col.deselected
            })
            setColumnVisibility(initialVisibility)

            // Add event listeners for category info tooltips
            $(tableRef.current).on("draw.dt", () => {
                $(".category-info").each(function () {
                    const category = $(this).data("category")
                    const tooltipContent = getCategoryTooltipContent(category)
                    $(this).attr("title", tooltipContent)
                })
            })

            // Add event listener for column visibility changes
            dt.on("column-visibility.dt", (e, settings, column, state) => {
                const columnId = dt.column(column).dataSrc() as string
                setColumnVisibility((prev) => ({ ...prev, [columnId]: state }))
            })

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
              
               
            `)
                .appendTo("head")

            return () => {
                if (!dtRef.current || !tableRef.current) return // ✅ Prevent errors

                try {
                    // Clear search inputs
                    dtRef.current.columns().search("").draw()

                    // Remove event listeners
                    $(tableRef.current).find("input.column-search").off("keyup change click")
                    $(tableRef.current).off("click", ".add-portfolio-btn")
                    $(tableRef.current).off("draw.dt")
                    $(tableRef.current).off("responsive-display", handleResponsiveDisplay);
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
    }, [columns, flattenedData, showAllRows, groupedData, showPagination, handleResponsiveDisplay])

    const createCategoryRow = (category: string, sum: number, visibleColumnsCount: number) => {
        const displayCategory = category === "OP_ASSETS" ? "OPENING ASSETS" : category.toUpperCase()
        const sumDisplay = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(Math.abs(sum))
        const profitLossText = sum >= 0 ? "Profit" : "Loss"
        const colorClass = sum >= 0 ? "text-green-600" : "text-red-600"

        return `
            <tr id="${category}" class="category-row">
                <td colspan="${visibleColumnsCount}" class="text-center font-semibold py-2">
                <div class="flex items-center justify-center gap-2">
                    <div >${displayCategory}</div>  
                    <span class="cursor-pointer category-info" data-category="${category}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </span>
                    (
                    <span class="mx-1 ${colorClass}">
                    ${category === "OP_ASSETS" || category === "ASSETS"
                ? `Unrealized ${profitLossText}: `
                : category === "LIABILITIES"
                    ? `LIABILITIES: `
                    : `${profitLossText}: `
            }
                    ${sumDisplay}
                    </span>
                    )
                </div>
                </td>
            </tr>
            `
    }

    const getCategoryTooltipContent = (category: string) => {
        switch (category) {
            case "OP_ASSETS":
                return "Holdings acquired before the beginning of the current financial year. These assets have been carried forward from previous periods and are part of the portfolio's opening balance."
            case "ASSETS":
                return "Holdings purchased during the current financial year. These represent new acquisitions added to the portfolio after the start of the financial year."
            case "SHORTTERM":
                return "The profit earned from selling assets held for a period of less than 12 months, subject to applicable short-term capital gains tax."
            case "LONGTERM":
                return "The profit earned from selling assets held for a period of 12 months or more, typically eligible for preferential tax rates"
            case "LIABILITIES":
                return "Represents stocks that have been sold but lack corresponding buy trade records in the back-office system. This indicates a discrepancy requiring reconciliation to ensure accurate transaction history and financial reporting."
            case "TRADING":
                return "Represents transactions where stocks are bought and sold on the same trading day. These trades are settled without carrying positions overnight and are typically considered for intraday profit or loss calculations."
            default:
                return ""
        }
    }

    const getVisibleColumns = () => {
        return columns.filter((col) => columnVisibility[col.accessorKey]);
    };

    const downloadCSVFunc = () => {
        const dt = $(tableRef.current).DataTable();
        const visibleColumns = dt
            .columns()
            .indexes()
            .filter((index) => dt.column(index).visible());
        // const columnsData = columns.filter((_, index) => visibleColumns.indexOf(index) !== -1);
        const columnsData = getVisibleColumns()
        const totalColumns = columnsData.length;

        // ✅ Create a centered row (merged columns)
        const createCenteredRow = (content: string) => {
            const row = Array(totalColumns).fill("");
            row[0] = content;
            return row;
        };

        // ✅ Format currency without commas for CSV safety
        const formatCurrency = (value: number) =>
            new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
                .format(value)
                .replace(/,/g, "");

        // ✅ Summary section
        const summaryRows = [
            createCenteredRow("Pune e Stock Broking Limited"),
            createCenteredRow(""),
            createCenteredRow(
                `Name: ${details.userDetails?.clientName} | FINANCIAL YEAR REPORT: ${year} | Date Range: ${fromDate} to ${toDate} | Client ID: ${details.currentUser}`
            ),
            [],
            createCenteredRow("Summary"),
        ];

        // ✅ Format summary data (Unrealized, Realized, Liabilities, Expenses)
        const formattedSummary = [
            ["Unrealized", formatCurrency(totalDataSummary.unrealized)],
            ["Realized", formatCurrency(totalDataSummary.realized)],
            ["Liabilities", formatCurrency(totalDataSummary.liabilities)],
            ["Expenses", formatCurrency(expensesData.total)],
        ];

        // ✅ Expense details section
        const expensesSection = [
            [],
            createCenteredRow("Expenses"),
            ...expensesData.rows.map((row) => [
                row[expensesData.rowKey],
                formatCurrency(row[expensesData.rowAmount]),
            ]),
            ["Total Expenses", formatCurrency(expensesData.total)],
            [],
            createCenteredRow("Detailed Report"),
        ];

        // ✅ Main Data Rows (Unrealized, Realized, Liabilities)
        const formattedDataRows = groupedData.flatMap((section) => {
            const formattedSum = formatCurrency(Math.abs(section.sum));
            const categoryTitle =
                section.category === "OP_ASSETS" || section.category === "ASSETS"
                    ? `Unrealized (${section.sum >= 0 ? "Profit" : "Loss"}: ${formattedSum})`
                    : section.category === "LIABILITIES"
                        ? `Liabilities: ${formattedSum}`
                        : `Realized (${section.sum >= 0 ? "Profit" : "Loss"}: ${formattedSum})`;

            // ✅ Add a centered row for each category
            const categoryRow = createCenteredRow(`${section.category === "OP_ASSETS" ? "OPENING ASSETS" : section.category.toUpperCase()} - ${categoryTitle}`);

            // ✅ Format the data rows properly
            const dataRows = section.rows.map((row) =>
                columnsData.map((col) => {
                    const value = row[col.accessorKey as keyof typeof row];
                    return typeof value === "number" ? formatCurrency(value) : value || "";
                })
            );

            return [[], categoryRow, ...dataRows];
        });

        // ✅ Convert data to CSV format
        const csvRows = [
            ...summaryRows,
            ...formattedSummary.map((row) => row.join(",")),
            ...expensesSection.map((row) => row.join(",")),
            [],
            columnsData.map((col) => col.header).join(","), // Headers
            ...formattedDataRows.map((row) => row.join(",")), // Data
        ];

        // ✅ Generate CSV file
        const csvContent = csvRows.join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${downloadFileName}_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadExcelFunc = () => {
        const dt = $(tableRef.current).DataTable();
        const allColumns = dt.columns().indexes().toArray();
        // const columnsData = columns.filter((_, index) => allColumns.indexOf(index) !== -1)
        const columnsData = getVisibleColumns()
        const totalColumns = columnsData.length
        const finalFileName = downloadFileName?.trim() ? downloadFileName : document.title

        const categoryRowMapping: Record<string, string> = {} // Stores category -> row reference
        const sectionStartRows: Record<string, number> = {} // Stores section start row numbers for navigation

        const convertToNumberIfValid = (value: any) => {
            if (value === null || value === undefined || value === "" || value === "N/A") return ""
            if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
            if (typeof value === "string") {
                if (/[a-zA-Z]/.test(value)) return value.trim()
                const cleanedValue = value.replace(/[^0-9.-]/g, "").trim()
                const numericValue = Number.parseFloat(cleanedValue)
                return isNaN(numericValue) ? "-" : Number.parseFloat(numericValue.toFixed(2))
            }
            return typeof value === "number" ? Number.parseFloat(value.toFixed(2)) : 0
        }

        const getProfitLossLabel = (value: number) => (value >= 0 ? "Profit" : "Loss")

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
        const reportTitle = `FINANCIAL YEAR REPORT OF ${finalFileName.replace(/_/g, " ")}: ${year}`
        const dateRange = `Date Range: ${fromDate} to ${toDate}`
        const clientInfo = `Name: ${details.userDetails?.clientName}   |   Client ID: ${details.currentUser}   |   PAN: ${details.userDetails?.pan}   |   Mobile: ${details.userDetails?.mobile}`

        // Company name with logo-like styling
        const titleRow = worksheet.addRow([companyName])
        mergeAndCenter(1, "title")
        titleRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } } // Blue background
            cell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } } // White text
        })

        worksheet.addRow([]) // Empty row

        // Report title
        worksheet.addRow([reportTitle])
        mergeAndCenter(3, "subtitle")

        // Date range
        worksheet.addRow([dateRange])
        mergeAndCenter(4)

        // Client info
        worksheet.addRow([clientInfo])
        mergeAndCenter(5)

        worksheet.addRow([]) // Empty row

        // --- Table of Contents ---
        const tocStartRow = worksheet.rowCount + 1
        const tocRow = worksheet.addRow(["Table of Contents"])
        mergeAndCenter(tocStartRow, "section")

        worksheet.addRow(["1. Summary"])
        worksheet.addRow(["   1.1 Unrealized "])
        worksheet.addRow(["   1.2 Realized "])
        worksheet.addRow(["   1.3 Other "])
        worksheet.addRow(["   1.4 Expenses "])
        worksheet.addRow(["2. Detailed Report"])

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

        // Create a styled header for the  table
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
        worksheet.addRow([]) // Empty row

        // --- Unrealized Section ---
        worksheet.addRow(["1.1 Unrealized "]).font = { bold: true, size: 12 }
        sectionStartRows["Unrealized"] = worksheet.rowCount

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 2}`).value = {
            text: "   1.1 Unrealized ",
            hyperlink: `#'${worksheet.name}'!A${sectionStartRows["Unrealized"]}`,
        }
        worksheet.getCell(`A${tocStartRow + 2}`).font = { color: { argb: "0563C1" }, underline: true }

        // Add unrealized data with better formatting
        const unrealizedTotal = totalDataSummary.unrealized
        Object.entries(data)
            .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
            .forEach(([category, value]) => {
                // Ensure correct naming
                const categoryLabel =
                    {
                        OP_ASSETS: "OPENING ASSETS",
                    }[category] || category // Default to original category if not listed

                const sum = convertToNumberIfValid((value as { sum: number }).sum)

                const rowIndex = worksheet.rowCount + 1
                const categoryRow = worksheet.addRow([categoryLabel, sum])

                // Apply cell styling
                categoryRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    }
                })

                // Format number cell
                if (typeof sum === "number") {
                    worksheet.getCell(`B${rowIndex}`).numFmt = "#,##0.00;[Red]-#,##0.00"
                    if (sum < 0) {
                        worksheet.getCell(`B${rowIndex}`).font = { color: { argb: "FF0000" } }
                    }
                }

                // Store category row index for hyperlinking
                const categoryRef = `Category_${category.replace(/\s+/g, "_")}`
                categoryRowMapping[categoryLabel] = categoryRef
                worksheet.getCell(`A${rowIndex}`).name = categoryRef

                // Make category name clickable
                worksheet.getCell(`A${rowIndex}`).value = {
                    text: categoryLabel,
                    hyperlink: `#'${worksheet.name}'!${categoryRef}`,
                }
                worksheet.getCell(`A${rowIndex}`).font = { color: { argb: "0563C1" }, underline: true }
            })

        // Add total row with bold formatting
        const unrealizedTotalRow = worksheet.addRow([
            `Unrealized Total (${getProfitLossLabel(unrealizedTotal)})`,
            unrealizedTotal,
        ])
        unrealizedTotalRow.font = { bold: true }
        unrealizedTotalRow.eachCell((cell) => {
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
        if (unrealizedTotal < 0) {
            worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
        }

        worksheet.addRow([]) // Empty row

        // --- Realized Section ---
        worksheet.addRow(["1.2 Realized "]).font = { bold: true, size: 12 }
        sectionStartRows["Realized"] = worksheet.rowCount

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 3}`).value = {
            text: "   1.2 Realized ",
            hyperlink: `#'${worksheet.name}'!A${sectionStartRows["Realized"]}`,
        }
        worksheet.getCell(`A${tocStartRow + 3}`).font = { color: { argb: "0563C1" }, underline: true }

        // Add realized data with better formatting
        const realizedTotal = totalDataSummary.realized
        Object.entries(data)
            .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
            .forEach(([category, value]) => {
                const sum = convertToNumberIfValid((value as { sum: number }).sum);

                const rowIndex = worksheet.rowCount + 1;
                const categoryRow = worksheet.addRow([category, sum]);

                // Apply cell styling
                categoryRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });

                // Format number cell
                if (typeof sum === "number") {
                    worksheet.getCell(`B${rowIndex}`).numFmt = "#,##0.00;[Red]-#,##0.00";
                    if (sum < 0) {
                        worksheet.getCell(`B${rowIndex}`).font = { color: { argb: "FF0000" } };
                    }
                }

                // Store category row index for hyperlinking
                const categoryRef = `Category_${category.replace(/\s+/g, "_")}`;
                categoryRowMapping[category] = categoryRef;
                worksheet.getCell(`A${rowIndex}`).name = categoryRef;

                // Make category name clickable
                worksheet.getCell(`A${rowIndex}`).value = { text: category, hyperlink: `#'${worksheet.name}'!${categoryRef}` };
                worksheet.getCell(`A${rowIndex}`).font = { color: { argb: "0563C1" }, underline: true };
            });

        // Manually add "Expenses" row
        const expensesSum = convertToNumberIfValid(expensesData.total as number);
        const expensesRowIndex = worksheet.rowCount + 1;
        const expensesRow = worksheet.addRow(["Expenses", expensesSum]);

        // Apply cell styling
        expensesRow.eachCell((cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Format number cell
        if (typeof expensesSum === "number") {
            worksheet.getCell(`B${expensesRowIndex}`).numFmt = "#,##0.00;[Red]-#,##0.00";
            if (expensesSum < 0) {
                worksheet.getCell(`B${expensesRowIndex}`).font = { color: { argb: "FF0000" } };
            }
        }

        // Store expenses row index for hyperlinking
        const expensesRef = `Category_Expenses`

        categoryRowMapping["Expenses"] = expensesRef;
        worksheet.getCell(`A${expensesRowIndex}`).name = expensesRef;

        // Make "Expenses" name clickable
        worksheet.getCell(`A${expensesRowIndex}`).value = { text: "Expenses", hyperlink: `#'${worksheet.name}'!${expensesRef}` };
        worksheet.getCell(`A${expensesRowIndex}`).font = { color: { argb: "0563C1" }, underline: true };


        // Add total row with bold formatting
        const realizedTotalRow = worksheet.addRow([`Realized Total (${getProfitLossLabel(realizedTotal)})`, realizedTotal])
        realizedTotalRow.font = { bold: true }
        realizedTotalRow.eachCell((cell) => {
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
        if (realizedTotal < 0) {
            worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
        }

        worksheet.addRow([]) // Empty row

        // --- Other Section ---
        worksheet.addRow(["1.3 Other "]).font = { bold: true, size: 12 }
        sectionStartRows["Other"] = worksheet.rowCount

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 4}`).value = {
            text: "   1.3 Other ",
            hyperlink: `#'${worksheet.name}'!A${sectionStartRows["Other"]}`,
        }
        worksheet.getCell(`A${tocStartRow + 4}`).font = { color: { argb: "0563C1" }, underline: true }

        // Add other data with better formatting
        let otherTotal = 0
        Object.entries(data)
            .filter(([type]) => type === "LIABILITIES")
            .forEach(([category, value]) => {
                const sum = convertToNumberIfValid((value as { sum: number }).sum)
                otherTotal += typeof sum === "number" ? sum : 0

                const rowIndex = worksheet.rowCount + 1
                const categoryRow = worksheet.addRow([category, sum])

                // Apply cell styling
                categoryRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    }
                })

                // Format number cell
                if (typeof sum === "number") {
                    worksheet.getCell(`B${rowIndex}`).numFmt = "#,##0.00;[Red]-#,##0.00"
                    if (sum < 0) {
                        worksheet.getCell(`B${rowIndex}`).font = { color: { argb: "FF0000" } }
                    }
                }

                // Store category row index for hyperlinking
                const categoryRef = `Category_${category.replace(/\s+/g, "_")}`
                categoryRowMapping[category] = categoryRef
                worksheet.getCell(`A${rowIndex}`).name = categoryRef

                // Make category name clickable
                worksheet.getCell(`A${rowIndex}`).value = { text: category, hyperlink: `#'${worksheet.name}'!${categoryRef}` }
                worksheet.getCell(`A${rowIndex}`).font = { color: { argb: "0563C1" }, underline: true }
            })

        // Add total row with bold formatting
        const otherTotalRow = worksheet.addRow([`Other Total`, otherTotal])
        otherTotalRow.font = { bold: true }
        otherTotalRow.eachCell((cell) => {
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
        if (otherTotal < 0) {
            worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
        }

        worksheet.addRow([]) // Empty row

        // --- Expenses Section ---
        worksheet.addRow(["1.4 Expenses "]).font = { bold: true, size: 12 }
        sectionStartRows["Expenses"] = worksheet.rowCount

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 5}`).value = {
            text: "   1.4 Expenses ",
            hyperlink: `#'${worksheet.name}'!A${sectionStartRows["Expenses"]}`,
        }
        worksheet.getCell(`A${tocStartRow + 5}`).font = { color: { argb: "0563C1" }, underline: true }

        // Add expenses data with better formatting
        const expensesTotal = convertToNumberIfValid(Math.abs(expensesData.total as number))
        expensesData.rows.forEach((row) => {
            const amount = convertToNumberIfValid(row[expensesData.rowAmount])
            const rowIndex = worksheet.rowCount + 1
            const expenseRow = worksheet.addRow([row[expensesData.rowKey], Math.abs(amount as number)])

            // Apply cell styling
            expenseRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }
            })

            // Format number cell
            if (typeof amount === "number") {
                worksheet.getCell(`B${rowIndex}`).numFmt = "#,##0.00;[Red]-#,##0.00"
                if (amount < 0) {
                    worksheet.getCell(`B${rowIndex}`).font = { color: { argb: "FF0000" } }
                }
            }
        })

        // Add expenses total row with bold formatting
        const expensesTotalRow = worksheet.addRow([`Expenses Total (${getProfitLossLabel(Number(expensesTotal))})`, Number(expensesTotal)])
        expensesTotalRow.font = { bold: true }
        expensesTotalRow.eachCell((cell) => {
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
        if (typeof expensesTotal === "number" && expensesTotal < 0) {
            worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true, color: { argb: "FF0000" } }
        }

        // Store Expenses row index for hyperlinking
        categoryRowMapping["Expenses"] = expensesRef
        worksheet.getCell(`A${sectionStartRows["Expenses"]}`).name = expensesRef

        worksheet.addRow([])
        worksheet.addRow([]) // Empty row

        // --- Detailed Report Section ---
        const detailedReportRow = worksheet.rowCount + 1
        worksheet.addRow(["2. Detailed Report"])
        mergeAndCenter(detailedReportRow, "section")
        sectionStartRows["DetailedReport"] = detailedReportRow

        worksheet.addRow([]) // Empty row

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 6}`).value = {
            text: "2. Detailed Report",
            hyperlink: `#'${worksheet.name}'!A${detailedReportRow}`,
        }
        worksheet.getCell(`A${tocStartRow + 6}`).font = { color: { argb: "0563C1" }, underline: true }

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

        // --- Detailed Data Sections ---
        groupedData.forEach((section) => {
            const sumValue = convertToNumberIfValid(section.sum)
            const categoryWithLabel = `${section.category === "OP_ASSETS" ? "OPENING ASSETS" : section.category.toUpperCase()} (${getProfitLossLabel(Number(sumValue))})`

            const categoryRowIndex = worksheet.rowCount + 1
            const categoryRow = worksheet.addRow([`${categoryWithLabel}: ${sumValue}`])
            categoryRow.font = { bold: true, size: 12 }
            categoryRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F2F2F2" } }

            // Define named range for detailed section
            const categoryRef = `Category_${section.category.replace(/\s+/g, "_")}`
            worksheet.getCell(`A${categoryRowIndex}`).name = categoryRef

            worksheet.mergeCells(categoryRowIndex, 1, categoryRowIndex, totalColumns)
            worksheet.getRow(categoryRowIndex).alignment = { horizontal: "center", vertical: "middle" }

            // Add back navigation to summary
            worksheet.getCell(`A${categoryRowIndex}`).value = {
                text: `${categoryWithLabel}: ${sumValue}`,
                hyperlink: `#'${worksheet.name}'!A${sectionStartRows[
                    section.category === "OP_ASSETS" || section.category === "ASSETS"
                        ? "Unrealized"
                        : section.category === "LIABILITIES"
                            ? "Other"
                            : "Realized"
                ]
                    }`,
            }
            worksheet.getCell(`A${categoryRowIndex}`).font = {
                bold: true,
                size: 12,
                color: { argb: "0563C1" },
                underline: true,
            }

            // Calculate column totals for columns in columnsWithTotals?
            const columnTotals: Record<string, number> = {}

            // Initialize totals for all columns that should have totals
            columnsWithTotals?.forEach((colKey) => {
                columnTotals[colKey] = 0
            })

            // Add data rows with alternating colors and borders
            section.rows.forEach((row, index) => {
                const rowData = columnsData.map((col) => {
                    const value = convertToNumberIfValid(row[col.accessorKey as keyof typeof row])

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
                    if (typeof cell.value === "number") {
                        cell.numFmt = "#,##0.00;[Red]-#,##0.00"
                        if (cell.value < 0) {
                            cell.font = { color: { argb: "FF0000" } }
                        }
                    }
                })
            })

            // Create section total row with totals for specified columns
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

            worksheet.addRow([]) // Empty row
        })

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

        // --- Category Definitions Section ---
        const categoryDefinitionsRow = worksheet.rowCount + 1
        worksheet.addRow(["3. Category Definitions"])
        mergeAndCenter(categoryDefinitionsRow, "section")
        sectionStartRows["CategoryDefinitions"] = categoryDefinitionsRow

        // Make TOC entry clickable
        worksheet.getCell(`A${tocStartRow + 7}`).value = {
            text: "3. Category Definitions",
            hyperlink: `#'${worksheet.name}'!A${categoryDefinitionsRow}`,
        }
        worksheet.getCell(`A${tocStartRow + 7}`).font = { color: { argb: "0563C1" }, underline: true }

        worksheet.addRow([]) // Empty row

        // Add category definitions with styling - each definition merged across the row
        const categories = ["OP_ASSETS", "ASSETS", "SHORTTERM", "LONGTERM", "LIABILITIES", "TRADING"]
        categories.forEach((category, index) => {
            const displayName = category === "OP_ASSETS" ? "OPENING ASSETS" : category
            const definition = getCategoryTooltipContent(category)

            if (!categoryRowMapping[displayName]) return

            // Add the row with combined category and definition text
            const rowIndex = worksheet.rowCount + 1
            const definitionRow = worksheet.addRow([`${displayName}: ${"    "}${definition}`])

            // Merge cells across the row
            worksheet.mergeCells(rowIndex, 1, rowIndex, totalColumns)

            // Apply alternating row colors
            if (index % 2 === 1) {
                definitionRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9F9F9" } }
                })
            }

            // Apply borders and formatting
            definitionRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                }
                cell.alignment = { vertical: "middle", wrapText: true }
            })

            // Make category name clickable if it exists in the report
            if (Object.keys(categoryRowMapping).includes(displayName) || Object.keys(categoryRowMapping).includes(category)) {
                const categoryRef = categoryRowMapping[displayName] || categoryRowMapping[category]
                if (categoryRef) {
                    // Create a hyperlink with bold category name
                    worksheet.getCell(`A${rowIndex}`).value = {
                        text: `${displayName}: ${definition}`,
                        hyperlink: `#'${worksheet.name}'!${categoryRef}`,
                    }
                    // Only make the category name part bold and underlined
                    worksheet.getCell(`A${rowIndex}`).font = { color: { argb: "0563C1" } }
                }
            }
        })

        worksheet.addRow([]) // Empty row

        // Add a back-to-top link at the end
        const backToTopRow = worksheet.addRow(["Back to Table of Contents"])
        backToTopRow.getCell(1).value = {
            text: "Back to Table of Contents",
            hyperlink: `#'${worksheet.name}'!A${tocStartRow}`,
        }
        backToTopRow.getCell(1).font = { color: { argb: "0563C1" }, underline: true }

        // Generate and save the Excel file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
            const filename = `${finalFileName}_${timestamp}.xlsx`
            saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename)
        })

    };

    const downloadPDFFunc = () => {
        const dt = $(tableRef.current).DataTable();
        const allColumns = dt.columns().indexes().toArray();
        const columns = dt
            .columns()
            .header()
            .toArray()
            .filter((_, index) => allColumns.indexOf(index) !== -1)
            .map((col) => col.textContent)

        // Create PDF with minimal margins
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        })

        const finalFileName = downloadFileName?.trim() ? downloadFileName : document.title

        // Function to format currency in Indian style
        const formatIndianCurrency = (num) => {
            if (num === null || num === undefined || num === "") return "-"
            return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        // Set document properties
        doc.setProperties({
            title: `Financial Report - ${details.userDetails?.clientName || "-"}`,
            subject: `Financial Year Report: ${year || "-"}`,
            author: "Pune e Stock Broking Limited",
            creator: "Pune e Stock Broking Limited",
        })

        // Define consistent margins and dimensions
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const margin = 5 // 5mm margin on all sides
        const contentWidth = pageWidth - margin * 2
        let currentY = margin + 10 // Start position from top

        // Company Header with gradient-like appearance - optimized spacing
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

        // Report Title with subtle background - optimized spacing
        doc.setFillColor(240, 245, 250)
        doc.rect(margin, currentY - 2, contentWidth, 16, "F")
        doc.setTextColor(20, 60, 120)
        doc.setFontSize(11)
        doc.text(`FINANCIAL YEAR REPORT - ${finalFileName.replace(/_/g, " ")}`, pageWidth / 2, currentY + 2, {
            align: "center",
        })
        currentY += 10 // Reduced spacing

        // Display Financial Year and Date Range below the title - optimized spacing
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 80)
        doc.setFont("helvetica", "bold")
        doc.text("Financial Year:", margin + 5, currentY)
        doc.setFont("helvetica", "normal")
        doc.text(year || "-", margin + 35, currentY)

        doc.setFont("helvetica", "bold")
        doc.text("Date Range:", pageWidth - 80, currentY)
        doc.setFont("helvetica", "normal")
        doc.text(`${fromDate || "-"} to ${toDate || "-"}`, pageWidth - margin - 5, currentY, { align: "right" })
        currentY += 10 // Reduced spacing

        // Client Information Box - optimized height and spacing
        doc.setFillColor(248, 248, 248)
        doc.rect(margin, currentY - 2, contentWidth, 28, "F") // Adjusted height

        // Top border
        doc.setDrawColor(100, 100, 120)
        doc.setLineWidth(0.5)
        doc.rect(margin, currentY - 2, contentWidth, 28, "S")

        // Add section title with background
        doc.setFillColor(230, 230, 235)
        doc.rect(margin + 1, currentY - 1, contentWidth - 2, 6, "F")

        doc.setFontSize(9)
        doc.setTextColor(50, 50, 80)
        doc.setFont("helvetica", "bold")
        doc.text("CLIENT INFORMATION", pageWidth / 2, currentY + 3, { align: "center" })
        currentY += 10

        // Add client info with proper alignment - optimized spacing
        const leftLabelX = margin + 5
        const leftValueX = margin + 35
        const rightLabelX = pageWidth - 80
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

        // Financial Summary Section - optimized spacing
        doc.setFillColor(245, 222, 179)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(80, 40, 20)
        doc.text("FINANCIAL SUMMARY", pageWidth / 2, currentY, { align: "center" })
        currentY += 10

        // --- Unrealized Section - optimized spacing
        const isUnrealizedProfit = totalDataSummary.unrealized >= 0

        doc.setFillColor(isUnrealizedProfit ? 220 : 240, 230, isUnrealizedProfit ? 240 : 230)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")
        doc.setDrawColor(180, 180, 190)
        doc.setLineWidth(0.2)
        doc.rect(margin, currentY - 5, contentWidth, 8, "S")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(50, 50, 80)
        doc.text("UNREALIZED", margin + 5, currentY + 1)

        currentY += 4

        const unrealizedRows = Object.entries(data)
            .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
            .map(([category, value]) => {
                return [
                    category === "OP_ASSETS" ? "OPENING ASSETS" : category,
                    formatIndianCurrency((value as { sum: number }).sum),
                ]
            })

        // Unrealized total row
        const unrealizedTotal = totalDataSummary.unrealized
        const isTotalProfit = unrealizedTotal >= 0
        const formattedTotal = formatIndianCurrency(unrealizedTotal)
        const profitLossTextUNREALIZED = totalDataSummary.unrealized >= 0 ? "Profit" : "Loss"

        // Generate table with footer row - optimized margins
        autoTable(doc, {
            startY: currentY,
            body: unrealizedRows,
            styles: { fontSize: 8, cellPadding: 2 }, // Reduced padding
            theme: "grid",
            headStyles: { fillColor: [230, 230, 235] },
            alternateRowStyles: { fillColor: [245, 245, 248] },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.7, fontStyle: "bold" },
                1: { cellWidth: contentWidth * 0.3, halign: "right" },
            },
            margin: { left: margin, right: margin }, // Consistent margins
            foot: [
                [
                    {
                        content: `UNREALIZED TOTAL (${profitLossTextUNREALIZED})`,
                        styles: {
                            fontStyle: "bold",
                            fillColor: [isUnrealizedProfit ? 220 : 240, 230, isUnrealizedProfit ? 240 : 230],
                            textColor: [50, 50, 80],
                        },
                    },
                    {
                        content: `${formattedTotal}`,
                        styles: {
                            fontStyle: "bold",
                            fillColor: [isUnrealizedProfit ? 220 : 240, 230, isUnrealizedProfit ? 240 : 230],
                            textColor: [50, 50, 80],
                            halign: "right",
                        },
                    },
                ],
            ],
        })

        currentY = (doc as any).lastAutoTable.finalY + 8 // Reduced spacing

        // --- Realized Section - optimized spacing
        const isRealizedProfit = totalDataSummary.realized >= 0

        doc.setFillColor(isRealizedProfit ? 220 : 240, isRealizedProfit ? 240 : 230, 220)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")
        doc.setDrawColor(180, 190, 180)
        doc.setLineWidth(0.2)
        doc.rect(margin, currentY - 5, contentWidth, 8, "S")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(50, 70, 50)
        doc.text("REALIZED", margin + 5, currentY + 1)

        currentY += 4

        const realizedRows = Object.entries(data)
            .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
            .map(([category, value]) => {
                return [category, formatIndianCurrency((value as { sum: number }).sum)]
            });

        // Add Expenses row at the end
        realizedRows.push(["Expenses", formatIndianCurrency(expensesData.total)])
        const profitLossTextREALIZED = totalDataSummary.realized >= 0 ? "Profit" : "Loss"

        // Print-friendly table styling - optimized margins
        autoTable(doc, {
            startY: currentY,
            body: realizedRows,
            styles: { fontSize: 8, cellPadding: 2 }, // Reduced padding
            theme: "grid",
            headStyles: { fillColor: [230, 235, 230] },
            alternateRowStyles: { fillColor: [245, 248, 245] },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.7, fontStyle: "bold" },
                1: { cellWidth: contentWidth * 0.3, halign: "right" },
            },
            margin: { left: margin, right: margin }, // Consistent margins
            foot: [
                [
                    {
                        content: `REALIZED TOTAL (${profitLossTextREALIZED})`,
                        styles: {
                            fontStyle: "bold",
                            fillColor: [isRealizedProfit ? 220 : 240, isRealizedProfit ? 240 : 230, 220],
                            textColor: [50, 70, 50],
                        },
                    },
                    {
                        content: `${formatIndianCurrency(totalDataSummary.realized)}`,
                        styles: {
                            fontStyle: "bold",
                            fillColor: [isRealizedProfit ? 220 : 240, isRealizedProfit ? 240 : 230, 220],
                            textColor: [50, 70, 50],
                            halign: "right",
                        },
                    },
                ],
            ],
        })

        currentY = (doc as any).lastAutoTable.finalY + 8 // Reduced spacing

        // --- Expenses Section - optimized spacing
        doc.setFillColor(240, 230, 220)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")
        doc.setDrawColor(190, 180, 180)
        doc.setLineWidth(0.2)
        doc.rect(margin, currentY - 5, contentWidth, 8, "S")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(70, 50, 50)
        doc.text("EXPENSES", margin + 5, currentY + 1)
        currentY += 4

        const expenseRows = expensesData.rows.map((row) => [
            row[expensesData.rowKey] || "-",
            formatIndianCurrency(row[expensesData.rowAmount]),
        ])

        // Print-friendly table styling - optimized margins
        autoTable(doc, {
            startY: currentY,
            body: expenseRows,
            styles: { fontSize: 8, cellPadding: 2 }, // Reduced padding
            theme: "grid",
            headStyles: { fillColor: [235, 230, 230] },
            alternateRowStyles: { fillColor: [248, 245, 245] },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.7, fontStyle: "bold" },
                1: { cellWidth: contentWidth * 0.3, halign: "right" },
            },
            margin: { left: margin, right: margin }, // Consistent margins
            foot: [
                [
                    {
                        content: "EXPENSES TOTAL",
                        styles: { fontStyle: "bold", fillColor: [240, 230, 220], textColor: [70, 50, 50] },
                    },
                    {
                        content: formatIndianCurrency(Math.abs(expensesData.total)),
                        styles: { fontStyle: "bold", fillColor: [240, 230, 220], textColor: [70, 50, 50], halign: "right" },
                    },
                ],
            ],
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

        // --- START NEW PAGE FOR DETAILED REPORT ---
        doc.addPage()
        currentY = margin + 10 // Start position from top with margin

        // Detailed Report Header - improved styling
        doc.setFillColor(245, 222, 179)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(80, 40, 20)
        doc.text("DETAILED REPORT", pageWidth / 2, currentY, { align: "center" })
        currentY += 10

        // Render each section of the detailed report
        groupedData.forEach((section) => {
            const formattedSum = formatIndianCurrency(Math.abs(section.sum))
            const isPositive = section.sum >= 0
            const categoryWithLabel = `${section.category === "OP_ASSETS" ? "OPENING ASSETS" : section.category.toUpperCase()} (${isPositive ? "Profit" : "Loss"}: ${formattedSum})`

            // Section header with background - improved styling
            doc.setFillColor(isPositive ? 220 : 240, isPositive ? 240 : 220, 230)
            doc.rect(margin, currentY - 5, contentWidth, 8, "F")
            doc.setDrawColor(isPositive ? 100 : 150, 120, isPositive ? 150 : 100)
            doc.setLineWidth(0.2)
            doc.rect(margin, currentY - 5, contentWidth, 8, "S")

            doc.setFontSize(9)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(50, 50, 70)
            doc.text(categoryWithLabel, margin + 5, currentY + 1)
            currentY += 8

            const sectionRows = section.rows.map((row) =>
                columns.map((_, index) => {
                    const columnKey = dt.column(index).dataSrc() as string
                    const value = row[columnKey]
                    if (value === null || value === undefined || value === "") {
                        return "-"
                    }
                    const numValue = Number(value)
                    return !isNaN(numValue) ? formatIndianCurrency(numValue) : value
                }),
            )

            // Improved table styling for better data wrapping - optimized margins
            autoTable(doc, {
                startY: currentY,
                head: [columns],
                body: sectionRows,
                styles: {
                    fontSize: 7,
                    cellPadding: 1.5, // Reduced padding
                    overflow: "linebreak",
                },
                headStyles: {
                    fillColor: [40, 80, 140],
                    textColor: 255,
                    fontSize: 8,
                    fontStyle: "bold",
                },
                theme: "grid",
                margin: { left: margin, right: margin }, // Consistent margins
                // Column-specific styling to handle wrapping better
                didParseCell: (data) => {
                    // Special handling for date columns (assuming first column is date)
                    if (data.column.index === 0 && data.cell.text && typeof data.cell.text === "string") {
                        // If it's a date, format it consistently
                        if (
                            typeof data.cell.text === "string" &&
                            ((data.cell.text as string).includes("/") || (data.cell.text as string).includes("-"))
                        ) {
                            data.cell.styles.halign = "center"
                        }
                    }

                    // Special handling for amount columns
                    if (
                        data.cell.text &&
                        typeof data.cell.text === "string" &&
                        typeof data.cell.text === "string" &&
                        ((data.cell.text as string).includes("₹") || (data.cell.text as string).includes(","))
                    ) {
                        data.cell.styles.halign = "right"
                        data.cell.styles.font = "helvetica"
                    }
                },
                willDrawCell: (data) => {
                    // Prevent text from being cut off
                    if (data.cell.height < 7) {
                        data.cell.height = 7 // Reduced minimum height
                    }
                },
            })

            currentY = (doc as any).lastAutoTable.finalY + 8 // Reduced spacing
        })

        // Add Category Descriptions at the end of the detailed report
        currentY = (doc as any).lastAutoTable.finalY + 10

        // Check if we're close to the end of the page and need a new page
        if (currentY > pageHeight - 60) {
            doc.addPage()
            currentY = margin + 10
        }

        const categories = new Set<string>()

        // Add categories from unrealized
        Object.entries(data)
            .filter(([type]) => type === "OP_ASSETS" || type === "ASSETS")
            .forEach(([category]) => categories.add(category))

        // Add categories from realized
        Object.entries(data)
            .filter(([type]) => type !== "OP_ASSETS" && type !== "ASSETS" && type !== "LIABILITIES")
            .forEach(([category]) => categories.add(category))

        // Add LIABILITIES if it exists
        if (data["LIABILITIES"]) {
            categories.add("LIABILITIES")
        }

        // Create description rows for the table
        const descriptionRows = Array.from(categories).map((category) => {
            const displayCategory = category === "OP_ASSETS" ? "OPENING ASSETS" : category.toUpperCase()
            return [displayCategory, getCategoryTooltipContent(category)]
        })

        // Category Descriptions Header
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, currentY - 5, contentWidth, 8, "F")
        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.2)
        doc.rect(margin, currentY - 5, contentWidth, 8, "S")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(50, 50, 50)
        doc.text("CATEGORY DESCRIPTIONS", pageWidth / 2, currentY, { align: "center" })
        currentY += 8

        // Add descriptions table to the detailed report page as well - optimized margins
        autoTable(doc, {
            startY: currentY,
            body: descriptionRows,
            styles: {
                fontSize: 7,
                cellPadding: 2,
                overflow: "linebreak",
            },
            theme: "grid",
            headStyles: { fillColor: [240, 240, 240] },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            columnStyles: {
                0: {
                    cellWidth: contentWidth * 0.25,
                    fontStyle: "bold",
                    fillColor: [245, 245, 245],
                },
                1: {
                    cellWidth: contentWidth * 0.75,
                    fontStyle: "normal",
                },
            },
            margin: { left: margin, right: margin }, // Consistent margins
        })

        // Add footer with page numbers
        addFooter(doc)

        // --- Save PDF ---
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        const filename = `${finalFileName}_${timestamp}.pdf`
        doc.save(filename)
    };

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
            }, 100);
        }
    };

    useEffect(() => {
        if (dtRef.current) {
            dtRef.current.search(globalSearchValue).draw();
        }
    }, [globalSearchValue]);

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
            dtRef.current.columns().every((column: any) => {
                column.search("").draw();
            });

            // dtRef.current.columns().every(function () {
            //     (this as any).search("").draw();
            // });


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

    return (
        <div className="w-full mt-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg border border-border shadow-sm sm:justify-between">
                {/* Search (Left on Larger Screens) */}
                <div className="relative flex items-center w-full sm:w-auto max-w-sm ">
                    <Search className="absolute left-2 h-3 w-3 text-muted-foreground" />
                    <Input
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
                <table ref={tableRef} className="row-border hover cell-border row-border">
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

export default DatatableNet
