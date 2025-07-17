/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ongoingBuyback,
  getBuybackOrderDetailsBranch,
  deleteBuybackOrderBranch,
} from "@/api/auth";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation";
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
// import { DataTable } from "@/components/DataTable";
import DataTableSkeleton from "@/components/DataTable-Skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { columns, type BuybackBranchModify } from "./columns";
import {
  FileIcon,
  Trash2,
  CalendarRange,
  Building,
  Library,
  IndianRupee,
  Info,
  FileX,
} from "lucide-react";
import {
  CalendarIcon,
  BuildingIcon,
  DollarSignIcon,
  BarChartIcon,
  TrendingUpIcon,
  LibraryIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
import $ from "jquery";
import dynamic from "next/dynamic";
import CustomDialog from "@/components/ui/CustomDialog";
import BuybackDetails from "@/components/BuybackDetails";
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
  ssr: false,
});

interface TemplateOption {
  scrip: string;
  value: string;
  isin: string;
  fromdate: string;
  todate: string;
  buybackprice: number;
  nsesettno: string;
  bsesettno: string;
}

export default function BuybackModifyOrderBranch() {
  const [data, setData] = useState<BuybackBranchModify[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [isDeleting, setIsDeleting] = useState(false);

  const [buybackCompanyOptions, setBuybackCompanyOptions] = useState<
    TemplateOption[]
  >([]);
  const [selectedBuybackId, setSelectedBuybackId] = useState<string>("");
  const [selectedCompanyDetails, setSelectedCompanyDetails] =
    useState<TemplateOption | null>(null);

  const [selectedRows, setSelectedRows] = useState<BuybackBranchModify[]>([]);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] =
    useState<BuybackBranchModify | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowsRef = useRef<any[]>([]);
  const modalRef = useRef<any | null>(null); // Using ref instead of state

  // const handleSelectedRowsChange = useCallback((rows: BuybackBranchModify[]) => {
  //   const updatedRows = rows.map((row) => ({
  //     ...row,
  //     quantity: row.quantity || row.applied,
  //   }))
  //   setSelectedRows(updatedRows)
  // }, [])

  const getSelectedRowsData = useCallback(() => {
    if (!tableRef.current) return []

    const dt = $(tableRef.current).find("table")
    if (!dt) return []

    const dataTable = dt.DataTable() // Initialize DataTable instance
    const selectedRows = dataTable.rows({ selected: true }).nodes()
    const selectedData = dataTable
      .rows({ selected: true })
      .data()
      .toArray()
      .map((row, index) => {
        const rowNode = $(selectedRows[index])
        const childRow = rowNode.next("tr.child")
        const formData: Record<string, any> = {}

        const inputContainer = rowNode.add(childRow) // ✅ handle both visible and hidden fields
        const inputs = inputContainer.find("input, select, textarea")

        inputs.each(function () {
          const fieldName = $(this).attr("name") || $(this).attr("data-id")
          if (fieldName) {
            formData[fieldName] = (this as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value
          }
        })

        return { ...row, inputs: formData }
      })

    return selectedData
  }, [])

  const getTemplateNames = useCallback(async () => {
    setLoading(true);
    setError(null)
    try {
      const response = await ongoingBuyback();
      const tokenIsValid = validateToken(response);
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true);
        return;
      }

      const parsedData =
        typeof response.data.data === "string"
          ? JSON.parse(response.data.data)
          : response.data.data;

      if (parsedData) {
        setBuybackCompanyOptions(
          parsedData.map((company: any) => ({
            scrip: company.scrip,
            value: company.buybackid.toString(),
            isin: company.isin,
            fromdate: company.fromdate,
            todate: company.todate,
            buybackprice: company.buybackprice,
            nsesettno: company.nsesettno,
            bsesettno: company.bsesettno,
          }))
        );
      } else {
        throw new Error(
          parsedData["Error Description"] || "Failed to fetch template data."
        );
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTemplateNames();
  }, [getTemplateNames]);

  const fetchBuybackData = useCallback(async (isin: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBuybackOrderDetailsBranch({ isin });
      if (!validateToken(response)) {
        setShowSessionExpiredModal(true);
        return;
      }

      const parsedData =
        typeof response.data.data === "string"
          ? JSON.parse(response.data.data)
          : response.data.data;
      setData(
        parsedData && Array.isArray(parsedData) && parsedData.length > 0
          ? parsedData
          : []
      );
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteOrders = useCallback(async () => {
    // const selectedRows = selectedRowsRef.current;
    const rowsToDelete =
      selectedRows.length > 0 ? selectedRows : selectedRowsRef.current;
    if (isDeleting || rowsToDelete.length === 0) {
      toast.error("Please select orders to delete.");
      return;
    }

    setIsDeleting(true);
    try {
      const company = selectedCompanyDetails;
      const buybackId = selectedBuybackId;
      if (!company?.scrip || !buybackId) {
        toast.error("Please select a company first.");
        return;
      }

      const ordersToDelete =
        rowsToDelete.length > 0
          ? rowsToDelete
          : orderToDelete
            ? [orderToDelete]
            : [];
      if (ordersToDelete.length === 0) {
        toast.error("No orders selected for deletion");
        return;
      }

      const record = ordersToDelete.map((order) => ({
        boid: order.boid,
        scrip: company.scrip,
        isin: order.original.isin,
        buybackid: Number.parseInt(selectedBuybackId),
        clientId: order.clientId.toString(),
        quantity: order.quantity.toString(),
        applied: order.applied.toString(),
        id: order.original.id,
      }));

      const response = await deleteBuybackOrderBranch({ data: record });

      const tokenIsValid = validateToken(response);
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true);
        return;
      }
      const responseData = response.data;
      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every(
          (item: any) => item.status === true
        );
        if (allSuccessful) {
          toast.success(`Order deleted successfully`);

          await fetchBuybackData(company.isin);
        } else {
          toast.error("Failed to delete order. Please check and try again.");
        }
      } else {
        toast.error(
          `Failed to delete order: ${response.data.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(
        `An error occurred while deleting the order: ${error.message || "Unknown error"
        }`
      );
    } finally {
      setIsDeleting(false);
      setDeleteConfirmDialogOpen(false);
      modalRef.current?.close();
    }
  }, [
    selectedRows,
    isDeleting,
    selectedCompanyDetails,
    selectedBuybackId,
    orderToDelete,
    fetchBuybackData,
  ]);

  const handleCompanySelect = (value: string) => {
    if (!value || value === "NONE") {
      toast.error("Please select a company.");
      setSelectedBuybackId("");
      setData([]);
      setSelectedCompanyDetails(null);
      return;
    }

    setSelectedBuybackId(value);
    const selectedCompany = buybackCompanyOptions.find(
      (company) => company.value === value
    );
    if (selectedCompany) {
      setSelectedCompanyDetails(selectedCompany);
      fetchBuybackData(selectedCompany.isin);
    }
  };

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    const $table = $(tableRef.current)
    $table.off("select.dt")

    $table.on("select.dt", (e, dt, type, indexes) => {
      if (type === "row") {
        // If only one row is selected, use the original logic
        if (indexes.length === 1) {
          const index = indexes[0]
          const rowData = dt.row(index).data()
          const rowNode = dt.row(index).node()

          if (["PROCESSED"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - Please only select orders with the 'APPLIED' status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }

          if (["CANCELLED"].includes(rowData.original.orderStatus)) {
            $(rowNode).data("suppressCheckbox", true)
            dt.row(index).deselect()
            toast.warning(
              `Cannot select order for ${rowData.original.clientId || "this client"} - The order is already cancelled. Please only select orders with the 'APPLIED' order status.`,
              {
                position: "top-center",
                duration: 5000,
              },
            )
            $(rowNode).find(".rowCheckbox").prop("checked", false)
            return
          }
        } else if (indexes.length > 1) {
          // For multiple rows selected at once, group ALL warnings into a single toast
          // Track all invalid selections in a single array
          const invalidSelections: (string | number)[] = []

          indexes.forEach((index) => {
            const rowData = dt.row(index).data()
            const rowNode = dt.row(index).node()

            // Check if order status is invalid (PROCESSED or CANCELLED)
            if (["PROCESSED", "CANCELLED"].includes(rowData.original.orderStatus)) {
              $(rowNode).data("suppressCheckbox", true)
              dt.row(index).deselect()
              invalidSelections.push(rowData?.original?.clientId || "this client")
              $(rowNode).find(".rowCheckbox").prop("checked", false)
            } else if (["APPLIED"].includes(rowData?.original?.orderStatus)) {
              $(rowNode).find(".rowCheckbox").prop("checked", true)
              $(rowNode).data("shouldCheck", true)
            }
          })

          // Show a single warning for all invalid selections
          if (invalidSelections.length > 0) {
            const firstThree = invalidSelections.slice(0, 3)
            const remaining = invalidSelections.length - 3

            if (remaining > 0) {
              toast.warning(
                `Cannot select orders for clients: ${firstThree.join(", ")} and ${remaining} more - Please only select orders with the 'APPLIED' status.`,
                {
                  position: "top-center",
                  duration: 5000,
                },
              )
            } else {
              toast.warning(
                `Cannot select order${firstThree.length > 1 ? "s" : ""} for ${firstThree.join(", ")} - Please only select orders with the 'APPLIED' status.`,
                {
                  position: "top-center",
                  duration: 5000,
                },
              )
            }
          }
        }
      }
    })

    return () => {
      if (tableRef.current) {
        $table.off("select.dt")
      }
    }
  }, [data])

  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Manage Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Company Selection Section */}
          <div className="bg-slate-50 rounded-md p-1 mb-2">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="w-full md:w-auto">
                {/* <div className="text-sm font-medium mb-1">Select Company</div> */}
                <div className="relative w-full md:w-[260px]">
                  <Select
                    value={selectedBuybackId}
                    onValueChange={handleCompanySelect}
                  >
                    <SelectTrigger className="w-full bg-white h-9">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Select a company</SelectItem>
                      {buybackCompanyOptions.map((company) => (
                        <SelectItem key={company.value} value={company.value}>
                          {company.scrip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCompanyDetails && selectedBuybackId !== "NONE" ? (
                <>
                  {data.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const selectedData = getSelectedRowsData();

                        if (selectedData.length === 0) {
                          toast.error(
                            "Please select at least one order to delete"
                          );
                          return;
                        }
                        selectedRowsRef.current = selectedData;
                        setSelectedRows(selectedData);
                        modalRef.current?.open();
                      }}
                      className="whitespace-nowrap"
                    >
                      {" "}
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Order
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Company Details Section */}
          {/* {selectedCompanyDetails && (
            <div className="mb-0 border rounded-md p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-blue-100 p-1 rounded-md">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Company</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {selectedCompanyDetails.scrip}
                      </span>
                      {selectedCompanyDetails.isin &&
                        selectedCompanyDetails.isin !== "-" && (
                          <Badge variant="outline" className="text-xs">
                            {selectedCompanyDetails.isin}
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-green-100 p-1 rounded-md">
                    <CalendarRange className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="font-medium text-sm">
                      {selectedCompanyDetails.fromdate &&
                        selectedCompanyDetails.fromdate !== "-"
                        ? selectedCompanyDetails.fromdate
                        : "N/A"}
                      {" - "}
                      {selectedCompanyDetails.todate &&
                        selectedCompanyDetails.todate !== "-"
                        ? selectedCompanyDetails.todate
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-purple-100 p-1 rounded-md">
                    <IndianRupee className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">
                      Price & Settlement No
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">
                        ₹
                        {selectedCompanyDetails.buybackprice > 0
                          ? selectedCompanyDetails.buybackprice
                          : "N/A"}
                      </span>

                      {selectedCompanyDetails.nsesettno &&
                        selectedCompanyDetails.nsesettno !== "-" && (
                          <Badge variant="secondary" className="text-xs">
                            NSE: {selectedCompanyDetails.nsesettno}
                          </Badge>
                        )}
                      {selectedCompanyDetails.bsesettno &&
                        selectedCompanyDetails.bsesettno !== "-" && (
                          <Badge variant="secondary" className="text-xs">
                            BSE: {selectedCompanyDetails.bsesettno}
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}
          <BuybackDetails selectedCompanyDetails={selectedCompanyDetails} />

          {selectedBuybackId && selectedBuybackId !== "NONE" && (
            <>
              <Separator />

              {/* <div className="flex space-x-2 w-full xs:w-auto sm:w-auto justify-between xs:justify-end sm:justify-end"> */}
              {/* {data.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const selectedData = getSelectedRowsData();
                     
                      if (selectedData.length === 0) {
                        toast.error(
                          "Please select at least one order to delete"
                        );
                        return;
                      }
                      selectedRowsRef.current = selectedData;
                      setSelectedRows(selectedData)
                      modalRef.current?.open();
                    }}
                    className="flex-1 xs:flex-none sm:flex-none"
                  >
                    {" "}
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Order
                  </Button>
                )} */}
              {/* </div> */}
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : (
                <>
                  {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                      <div className="rounded-full bg-muted p-3 mb-4">
                        <FileX className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No records found</h3>
                      <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" ref={tableRef}>
                      <DataTableArray
                        key={`buyback_table_${data.length}`}
                        columns={columns}
                        data={data}
                        //onSelectedRowsChange={handleSelectedRowsChange}
                        selectableRows={true}
                        showPagination={true}
                        filterColumn="clientId"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* <CustomDialog
        ref={modalRef}
        title="Confirm Delete"
        onConfirm={handleDeleteOrders}
        confirmLoading={isDeleting}
        confirmText="Delete"
      >
        <div className="py-2">
          <p>Are you sure you want to delete the selected buyback order(s)?</p>
          <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
        </div>
      </CustomDialog> */}

      <CustomDialog
        ref={modalRef}
        title="Confirm Delete ?"
        // onClose={() => modalRef.current?.close()}
        onConfirm={handleDeleteOrders}
        confirmLoading={isDeleting}
        confirmText="Delete"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-base font-medium">
              Are you sure you want to delete the selected buyback order(s)?
            </p>

            {selectedCompanyDetails && (
              <div className="flex flex-col space-y-2 p-3 bg-slate-50 rounded-md">
                <div className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  <span className="font-semibold">
                    {selectedCompanyDetails.scrip}
                  </span>

                  {selectedCompanyDetails.buybackprice > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <LibraryIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                      <span className="text-sm text-muted-foreground">
                        ISIN:
                      </span>
                      <Badge variant="secondary" className="font-medium">
                        {selectedCompanyDetails.isin}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">ClientId</TableHead>
                  <TableHead className="w-1/4">Applied Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRows && selectedRows.length > 0 ? (
                  selectedRows.map((share, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {share.clientId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {share.original?.applied || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No scrip selected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            <p>Please review the details before confirming.</p>
          </div>
        </div>
      </CustomDialog>

      {showSessionExpiredModal && <SessionExpiredModal />}
    </DashboardLayout>
  );
}
