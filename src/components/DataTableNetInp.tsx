"use client"

import type React from "react"

import { useEffect, useRef, useMemo, useState } from "react"
import $ from "jquery"
import "datatables.net"
import "datatables.net-responsive-dt"
import "datatables.net-select-dt"
import "datatables.net-fixedheader"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import "@/components/data-table.css"
import 'mark.js/dist/jquery.mark.js'; // This attaches mark.js to jQuery

interface DataTableProps {
    data: any[]
    columns: any[]
    showPagination?: boolean
    showAllRows?: boolean
    selectableRows?: boolean
    getActionButtonDetails?: (event: React.MouseEvent, row: any, actionType: string) => void
    onRowRender?: (row: any, rowElement: HTMLElement) => void
}

export default function DataTable({
    data,
    columns,
    showPagination = false,
    showAllRows = false,
    selectableRows = false,
    getActionButtonDetails,
    onRowRender,
}: DataTableProps) {
    const tableRef = useRef<HTMLTableElement>(null)
    const dataTableRef = useRef<any>(null)
    const initializedRef = useRef(false)
    const prevDataLengthRef = useRef(0)
    const [globalSearchValue, setGlobalSearchValue] = useState("")

    useEffect(() => {
        const tableApi = dataTableRef.current;
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

    // Process data once and memoize it
    const processedData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            segment: item.segment || "CM", // Set default segment if not present
            clientName: item.clientName || "", // Set default segment if not present
            pan: item.pan || "", // Set default segment if not present
            orderStatus: item.orderStatus || "", // Set default segment if not present
            BseStatus: item.BseStatus || "", // Set default segment if not present
            boid: item.boid || "", // Set default segment if not present
        }))
    }, [data])

    // Memoize table columns configuration
    const tableColumns = useMemo(() => {
        // Add select-all checkbox column at the beginning
        return [
            {
                title: '<input type="checkbox" id="select-all-checkbox" class="select-all-checkbox" />',
                data: null,
                orderable: false,
                className: "select-checkbox",
                width: "30px",
                render: (data, type, row) => '<input type="checkbox" class="rowCheckbox" />',
            },
            {
                title: "",
                data: "",
                defaultContent: "",
                className: "dtr-control dtr-hidden",
                orderable: false,
                visible: true,
            },
            ...columns
                .filter((col) => col.hidden !== true)
                .map((col) => ({
                    title: col.header,
                    data: col.accessorKey || col.id,
                    width: col.width || "auto",
                    render: (data: any, type: string, row: any, meta: any) => {
                        // Store row data as attribute for later access
                        if (type === "display") {
                            // For custom cell rendering components
                            if (col.id === "unpledgedQuantityInp") {
                                // Add a responsive class to ensure proper styling in responsive mode
                                return `<input 
                            name="quantity" 
                            autoComplete="off" 
                            id="quantity-${row.isin}" 
                            type="text" 
                            inputMode="numeric" 
                            pattern="[0-9]*" 
                            placeholder="Pledge Quantity" 
                            class="transition-all duration-200 border border-gray-300 focus:ring-0 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-2 responsive-input"  
                            value="${row.quantity?.toString() || row.unpledgedQuantity?.toString() || ""}" 
                        />`
                            } else if (col.id === "segment") {
                                // Set a default selected value based on row data or default to "CM"
                                const currentSegment = row.segment || "CM"
                                return `
                            <div class="flex justify-center align-center gap-1">
                            <select 
                                id="segment-${meta.row}" 
                                name="segment" 
                                title="segment" 
                                class="p-2 bg-white text-black border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
                            >
                                <option value="CM" ${currentSegment === "CM" ? "selected" : ""}>CASH</option>
                                <option value="FO" ${currentSegment === "FO" ? "selected" : ""}>FO</option>
                                <option value="CO" ${currentSegment === "CO" ? "selected" : ""}>MCX</option>
                                <option value="CD" ${currentSegment === "CD" ? "selected" : ""}>CDS</option>
                            </select>
                            <button 
                                id="action-btn" 
                                class="px-2 py-1 h-8 text-xs action-btn hidden transition-opacity duration-200 rounded-md bg-primary text-primary-foreground hover:bg-primary/90" 
                                data-action="applySeg" 
                                data-id="${row.id || ""}" 
                                title="Apply same segment to all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                            </button>
                            </div>
                        `
                            } else if (col.id === "applyQuantityInp") {
                                return `<input 
                            name="quantity" 
                            autoComplete="off" 
                            id="quantity-${row.isin}" 
                            type="text" 
                            inputMode="numeric" 
                            pattern="[0-9]*" 
                            placeholder="Quantity" 
                            class="transition-all duration-200 border border-gray-300 focus:ring-0 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-2 responsive-input"  
                            value="${row.applied?.toString() || row.quantity?.toString() || ""}" 
                        />`
                            } else if (col.id === "clientNameInp") {
                                const name = row?.clientName || "";
                                const initials = name
                                    ? name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                    : "";

                                const bgColors = [
                                    "bg-red-500",
                                    "bg-blue-500",
                                    "bg-green-500",
                                    "bg-yellow-500",
                                    "bg-purple-500",
                                    "bg-pink-500",
                                    "bg-indigo-500",
                                    "bg-teal-500",
                                ];
                                const randomIndex = Math.floor(Math.random() * bgColors.length);
                                const bgColor = bgColors[randomIndex];

                                return `
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${bgColor}">
                                        ${initials}
                                    </div>
                                    <span class="truncate max-w-[150px] font-medium" title="${name}">
                                        ${name}
                                    </span>
                                </div>
                            `;
                            } else if (col.id === "boid") {
                                const boids = row.boidsDetails || []; // Assuming boidDetails is an array of objects with a 'boid' property
                                const selectedBoid = boids.length > 0 ? boids[0].boid : "";

                                return `
                                <select
                                    name="boid" // Added name attribute
                                    aria-label="Select BOID" // Added accessible name
                                    class="w-[180px] p-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    value="${selectedBoid}"
                                    onchange="handleBoidChange(event, '${row.id}')"
                                >
                                    ${boids.length > 0
                                        ? boids
                                            .map(
                                                (boidDetail) =>
                                                    `<option value="${boidDetail.boid}">${boidDetail.boid}</option>`
                                            )
                                            .join("")
                                        : `<option value="" disabled>No BOIDs available</option>`}
                                </select>
                            `;
                            } else if (col.id === "amountInp") {
                                return `<span id="amountCell_${row.isin}">
                            ${row.amount}
                          </span>`;
                            }

                        }
                        return data
                    },
                })),
        ]
    }, [columns])

    // Single effect to handle both initialization and updates
    useEffect(() => {
        // Skip if no data or no table ref
        if (!tableRef.current || processedData.length === 0) {
            return
        }

        // Initialize table if not already initialized
        if (!initializedRef.current) {
            // Initialize DataTable with options
            const dt = $(tableRef.current).DataTable({
                data: processedData,
                columns: tableColumns,
                columnDefs: [
                    // {
                    //     targets: [2, 3, 4], // ✅ ...except column at index 1 (second column)
                    //     orderable: true,
                    // },
                    {
                        targets: "_all", // 🔒 Disable ordering on all columns...
                        orderable: true,
                    },
                ],
                order: [[2, "asc"]],
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
                select: selectableRows
                    ? {
                        style: "multi",
                        selector: "td:first-child",
                    }
                    : false,
                paging: showPagination,
                pageLength: showAllRows ? -1 : 10,
                lengthMenu: [
                    [10, 25, 50, -1],
                    [10, 25, 50, "All"],
                ],
                language: {
                    emptyTable: "No records available",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    infoEmpty: "Showing 0 to 0 of 0 entries",
                    lengthMenu: "Show _MENU_ entries",
                    search: "Search:",
                    zeroRecords: "No matching records found",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous",
                    },
                },
                dom: '<"datatable-container"t><"datatable-footer"<"datatable-info"i><"datatable-pagination"p>>',
                autoWidth: false,
                rowCallback: (row, data, index) => {
                    $(row).css({
                        "line-height": "1.2",
                        "font-size": "0.75rem",
                    })
                },

                initComplete: function () {
                    const api = (this as any).api()

                    $(".dataTables_filter").hide() // Hide the default search box

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
                            paginationContainer.html(paginationHtml).show()
                        } else {
                            paginationContainer.hide()
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
                    api.draw() // Force a redraw to apply all styles properly

                    // Clear any existing icons in dtr-control cells to avoid duplication
                    $(dataTableRef.current).find("td.dtr-control").empty()

                    // Initialize the control cells with the right icon
                    $(dataTableRef.current)
                        .find("td.dtr-control")
                        .html(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>',
                        )

                    // Handle the responsive display event to ensure icon state is correct
                    api.on("responsive-display", (e, datatable, row, showHide) => {
                        const $cell = $(row.node()).find("td.dtr-control")

                        // Clear icon
                        $cell.empty()

                        if (showHide) {
                            // ✅ Row was expanded
                            $cell.addClass("expanded")
                            $(row.node()).addClass("expanded-row")

                            // ✅ Check if row is selected and multiple rows are selected
                            const isSelected = $(row.node()).hasClass("selected")
                            const selectedCount = api.rows({ selected: true }).count()

                            if (isSelected && selectedCount > 1) {
                                // ✅ Reveal the #action-btn inside the .child row
                                const childRow = $(row.node()).next("tr.child")
                                const actionBtn = childRow.find("#action-btn")

                                if (actionBtn.length) {
                                    actionBtn.removeClass("hidden")
                                }
                            }
                        } else {
                            // ✅ Row was collapsed
                            $cell.removeClass("expanded")
                            $(row.node()).removeClass("expanded-row")
                        }
                    })


                    // Add a pulsing effect to the expand icon for first-time users
                    setTimeout(() => {
                        $(".dtr-control").addClass("pulse-hint")
                        setTimeout(() => {
                            $(".dtr-control").removeClass("pulse-hint")
                        }, 3000)
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

            dataTableRef.current = dt
            initializedRef.current = true
            prevDataLengthRef.current = processedData.length

            // Add event listeners for action buttons
            $(tableRef.current).on("click", "[data-action]", function (e) {
                e.stopPropagation()
                const action = $(this).data("action")
                const rowEl = $(this).closest("tr")
                const rowData = JSON.parse(rowEl.attr("data-row-data") || "{}")

                const rowNode = $(this).closest("tr")

                // Fetch all input values in the row
                const inputs = rowNode.find("input, select, textarea")
                const formData: Record<string, any> = {}

                inputs.each(function () {
                    const fieldName = $(this).attr("name") || $(this).attr("data-id")
                    if (fieldName) {
                        formData[fieldName] = $(this).val()
                    }
                })

                if (getActionButtonDetails) {
                    getActionButtonDetails(e as any, { ...rowData, inputs: formData }, action)
                }
            })

            // Handle row selection events
            if (selectableRows) {
                dt.on("select deselect", () => {
                    const selectedRows = dt.rows({ selected: true }).nodes()

                    // Show/hide action buttons based on selection
                    if (selectedRows.length > 1) {
                        $(selectedRows).find("#action-btn").removeClass("hidden")
                    } else {
                        $('[id="action-btn"]').addClass("hidden")
                    }

                    // Ensure input fields and selects maintain their styling when row is selected
                    if (tableRef.current) {
                        $(tableRef.current).find("input, select").css({
                            "background-color": "white",
                            color: "black",
                        })
                    }
                })
            }

            // Add validation for quantity inputs
            $(tableRef.current).on("input", 'input[name="quantity"]', function () {
                const $input = $(this)
                const row = $input.closest("tr").hasClass("child") ? $input.closest("tr").prev() : $input.closest("tr")
                const rowData = JSON.parse(row.attr("data-row-data") || "{}")
                const inputValue = Number.parseInt($input.val() as string)
                const quantity = Number.parseInt(rowData.totalQuantity)

                // Clear previous error
                $input.removeClass("border-red-500")
                $input.next(".error-message").remove()

                if (isNaN(inputValue) || inputValue <= 0) {
                    // Invalid input value or no value entered
                    $input.addClass("border-red-500")
                    $input.after('<span class="error-message text-red-500 mt-1">*Quantity should not be blank or zero.</span>')
                } else if (inputValue > quantity) {
                    // Invalid input value
                    $input.addClass("border-red-500")
                    $input.after(`<span class="error-message text-red-500">*Cannot pledge more than ${quantity} shares.</span>`)
                }
            })

            // Handle select all checkbox
            $(tableRef.current).on("click", "#select-all-checkbox", function () {
                const isChecked = $(this).prop("checked")

                // Update all checkboxes in the table (not just visible ones)
                if (tableRef.current) {
                    $(tableRef.current).find(".rowCheckbox").prop("checked", isChecked)
                }

                // If using DataTables select extension, also update the selection state
                if (selectableRows && dataTableRef.current) {
                    if (isChecked) {
                        // Select all rows, not just current page
                        dataTableRef.current.rows().select()
                    } else {
                        // Deselect all rows
                        dataTableRef.current.rows().deselect()
                    }
                }

                // Trigger any action that should happen when selection changes
                if (isChecked) {
                    if (tableRef.current) {
                        $(tableRef.current).find("#action-btn").removeClass("hidden")
                    }
                } else {
                    $('[id="action-btn"]').addClass("hidden")
                }

                // Ensure input fields and selects maintain their styling when input fields and selects maintain their styling when rows are selected
                if (tableRef.current)
                    $(tableRef.current).find("input, select").css({
                        "background-color": "white",
                        color: "black",
                    })
            })

            // Handle individual row checkboxes
            $(tableRef.current).on("click", ".rowCheckbox", function (e) {
                e.stopPropagation() // Prevent row selection when clicking the checkbox

                const allCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox").length : 0
                const checkedCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox:checked").length : 0

                // Update the "select all" checkbox state
                $("#select-all-checkbox").prop({
                    checked: checkedCheckboxes > 0 && checkedCheckboxes === allCheckboxes,
                    indeterminate: checkedCheckboxes > 0 && checkedCheckboxes < allCheckboxes,
                })

                // If using DataTables select extension, also update the selection state
                if (selectableRows && dataTableRef.current) {
                    const row = dataTableRef.current.row($(this).closest("tr"))
                    if ($(this).prop("checked")) {
                        row.select()
                    } else {
                        row.deselect()
                    }
                }

                // Ensure input fields and selects maintain their styling when row is selected/deselected
                $(this).closest("tr").find("input, select").css({
                    "background-color": "white",
                    color: "black",
                })
            })

            // Sync row selection with checkboxes when using select extension
            if (selectableRows && dataTableRef.current) {
                dataTableRef.current.on("select", (e, dt, type, indexes) => {
                    if (type === "row") {
                        indexes.forEach((index) => {
                            const row = dataTableRef.current.row(index)
                            $(row.node()).find(".rowCheckbox").prop("checked", true)

                            // Ensure input fields and selects maintain their styling when row is selected
                            $(row.node()).find("input, select").css({
                                "background-color": "white",
                                color: "black",
                            })
                        })

                        // Update header checkbox
                        const allCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox").length : 0
                        const checkedCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox:checked").length : 0
                        $("#select-all-checkbox").prop({
                            checked: checkedCheckboxes > 0 && checkedCheckboxes === allCheckboxes,
                            indeterminate: checkedCheckboxes > 0 && checkedCheckboxes < allCheckboxes,
                        })
                    }
                })

                dataTableRef.current.on("deselect", (e, dt, type, indexes) => {
                    if (type === "row") {
                        indexes.forEach((index) => {
                            const row = dataTableRef.current.row(index)
                            $(row.node()).find(".rowCheckbox").prop("checked", false)
                        })

                        // Update header checkbox
                        const allCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox").length : 0
                        const checkedCheckboxes = tableRef.current ? $(tableRef.current).find(".rowCheckbox:checked").length : 0
                        $("#select-all-checkbox").prop({
                            checked: checkedCheckboxes > 0 && checkedCheckboxes < allCheckboxes,
                            indeterminate: checkedCheckboxes > 0 && checkedCheckboxes < allCheckboxes,
                        })
                    }
                })
            }
        }
        // Update data if already initialized and data length has changed
        else if (prevDataLengthRef.current !== processedData.length) {
            if (dataTableRef.current) {
                dataTableRef.current.clear()
                dataTableRef.current.rows.add(processedData)
                dataTableRef.current.draw(false)
                prevDataLengthRef.current = processedData.length
            }
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
    
    /* Add responsive input styling */
    .responsive-input {
        width: 100%;
        max-width: 150px;
    }
    
    /* In child rows (responsive mode), ensure inputs are properly sized */
    .dtr-details .dtr-data input.responsive-input {
        width: 100%;
        max-width: 100%;
    }
    
    /* Style for the expanded control cell */
    td.dtr-control.expanded {
        background-color: rgba(59, 130, 246, 0.1) !important;
    }
    
    /* Fix for error messages in responsive mode */
    .error-message {
        display: block;
        white-space: normal !important;
        word-break: break-word;
        max-width: 100%;
    }
    
    /* Ensure child rows handle error messages properly */
    .dtr-details .dtr-data {
        white-space: normal !important;
        word-break: break-word;
    }
    
    /* Prevent horizontal scrolling in child rows */
    table.dataTable > tbody > tr.child {
        white-space: normal !important;
    }
    
    table.dataTable > tbody > tr.child ul.dtr-details > li {
        white-space: normal !important;
    }
  `)
            .appendTo("head")

        // Clean up function
        return () => {
            if (dataTableRef.current && initializedRef.current) {
                // Remove event listeners
                if (tableRef.current) {
                    $(tableRef.current).off("click", "[data-action]")
                    $(tableRef.current).off("input", 'input[name="quantity"]')
                    $(tableRef.current).off("click", "#select-all-checkbox")
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                    $(tableRef.current).off("click", ".rowCheckbox")
                }

                dataTableRef.current.destroy()
                dataTableRef.current = null
                initializedRef.current = false
            }
        }
    }, [tableColumns, showPagination, showAllRows, selectableRows, getActionButtonDetails, processedData, onRowRender])

    useEffect(() => {
        if (dataTableRef.current) {
            dataTableRef.current.search(globalSearchValue).draw()
        }
    }, [globalSearchValue])

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
                            const value = e.target.value
                            setGlobalSearchValue(value)
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
                    {/* Entries Selector */}
                    {showPagination && (
                        <div className="ml-auto">
                            <span className="text-xs text-muted-foreground">Show</span>
                            <select
                                title="entries"
                                className="h-8 px-1 rounded-md border border-border bg-background text-xs mx-1"
                                onChange={(e) => {
                                    if (dataTableRef.current) {
                                        dataTableRef.current.page.len(Number.parseInt(e.target.value)).draw()
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
            <div className="w-full overflow-x-auto">
                <table
                    ref={tableRef}
                    className="responsive nowrap w-full row-border hover cell-border"
                    style={{ width: "100%" }}
                >
                    <thead>
                        <tr>
                            {columns
                                .filter((col) => col.hidden !== true)
                                .map((column) => (
                                    <th key={column.id}>{column.header}</th>
                                ))}
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    )
}
