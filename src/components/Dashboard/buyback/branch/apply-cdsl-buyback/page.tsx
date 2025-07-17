/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileX, Megaphone, ShoppingBag } from "lucide-react";
import {
  FileIcon,
  Trash2,
  CalendarRange,
  Building,
  Library,
  IndianRupee,
  Info,
} from "lucide-react";
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
  buybackBranch,
  applyforBuybackBranch,
} from "@/lib/auth";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation";
// import { AlertCircle } from "lucide-react";
// import ToastNotification from "@/components/ToastNotification";
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
// import { DataTable } from "@/components/DataTable"
// import { ConfirmModal } from "./confirm-modal"
import DataTableSkeleton from "@/components/DataTable-Skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { columns, type BuybackBranchEntry } from "./columns";
import {
  CalendarIcon,
  BuildingIcon,
  DollarSignIcon,
  BarChartIcon,
  TrendingUpIcon,
  LibraryIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import CustomDialog from "@/components/ui/CustomDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import $ from "jquery";
import BuybackDetails from "@/components/BuybackDetails";
const DataTableArray = dynamic(() => import("@/components/DataTableNetInp"), {
  ssr: false,
});
// const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
//   ssr: false,
// });

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

export default function Buyback() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [buybackCompanyOptions, setBuybackCompanyOptions] = useState<
    TemplateOption[]
  >([]);
  const [selectedBuybackId, setSelectedBuybackId] = useState<string>("");
  const [selectedCompanyDetails, setSelectedCompanyDetails] =
    useState<TemplateOption | null>(null);

  const [selectedRows, setSelectedRows] = useState<BuybackBranchEntry[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowsRef = useRef<any[]>([]);
  const modalRef = useRef<any | null>(null); // Using ref instead of state

  // const getSelectedRowsData = useCallback(() => {
  //   if (!tableRef.current) return []

  //   const dt = $(tableRef.current).find("table")
  //   if (!dt) return []

  //   const dataTable = dt.DataTable() // Initialize DataTable instance
  //   const selectedRows = dataTable.rows({ selected: true }).nodes()
  //   const selectedData = dataTable
  //     .rows({ selected: true })
  //     .data()
  //     .toArray()
  //     .map((row, index) => {
  //       const rowNode = $(selectedRows[index]) // ✅ Get the main row (`tr`)
  //       const childRow = rowNode.next("tr.child") // ✅ Get associated responsive row (if exists)
  //       const formData: Record<string, any> = {}

  //       const isResponsive = childRow.length > 0 // ✅ Check if `tr.child` exists

  //       // ✅ Use child row if responsive, otherwise use main row
  //       const inputContainer = isResponsive ? childRow : rowNode
  //       const inputs = inputContainer.find("input, select, textarea")

  //       // ✅ Fetch updated values from inputs
  //       inputs.each(function () {
  //         const fieldName = $(this).attr("name") || $(this).attr("data-id")
  //         if (fieldName) {
  //           formData[fieldName] = (this as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value // ✅ Get real-time input value
  //         }
  //       })

  //       return { ...row, inputs: formData }
  //     })

  //   return selectedData
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
    //ToastNotification({ message: "This is a notification", description: "This is the description.", position: "top-right" });
  }, [getTemplateNames]);

  const fetchBuybackData = useCallback(async (isin: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await buybackBranch({ isin: isin });
      const tokenIsValid = validateToken(response);
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true);
        return;
      }

      const parsedData =
        typeof response.data.data === "string"
          ? JSON.parse(response.data.data)
          : response.data.data;

      if (parsedData && Object.keys(parsedData).length > 0) {
        setData(parsedData);
      } else {
        setData([]);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

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

      const toDate = new Date(selectedCompany.todate);
      const today = new Date();

      // Check if today is the end date
      if (
        today.getDate() === toDate.getDate() &&
        today.getMonth() === toDate.getMonth() &&
        today.getFullYear() === toDate.getFullYear()
      ) {
        // Create cutoff time (11:30 AM on end date)
        const cutOffTime = new Date(selectedCompany.todate);
        cutOffTime.setHours(12, 0, 0);
        const currentTime = new Date();

        if (currentTime > cutOffTime) {
          toast.warning("On End Date Cut_Off time to place order is 12:00 PM.");
          return; // Exit the function without fetching data
        }
      }

      fetchBuybackData(selectedCompany.isin);
    }
  };

  const handleConfirm = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one client to proceed.");
      return;
    }

    setLoading(true);
    try {
      const record = selectedRows.map((row) => ({
        applied: row.inputs.quantity || row.applied,
        clientId: row.clientId.toString(),
        quantity: row.quantity,
        boid: row.boid,
        scrip: row.scrip,
        isin: row.isin,
        buybackid: selectedBuybackId,
        branchcode: row.branchcode.toString(),
        orderType: "CDSL",
      }));

      const response = await applyforBuybackBranch({ data: record });
      const tokenIsValid = validateToken(response);

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true);
        return;
      }

      const responseData = response.data;

      if (responseData && responseData.data) {
        const allSuccessful = responseData.data.every((item) => item.status === true);

        const messageParts = responseData.data.map((item) => {
          const clientId = item.request?.clientId || "N/A";
          const applied = item.request?.applied || "N/A";
          const message = item.message || (item.status ? "Application submitted successfully." : "Application failed.");

          if (item.status === true) {
            return `✔️ Client ${clientId}: Applied ${applied} – ${message}`;
          } else {
            return `❌ Client ${clientId}: Applied ${applied} – ${message}`;
          }
        });

        // const finalMessage = messageParts.join("\n");

        // toast(finalMessage, {
        //   type: allSuccessful ? "success" : "error",
        //   //autoClose: 10000,
        //   style: { whiteSpace: "pre-line" },
        // });

        const toastContent = (
          <div>
            {messageParts.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))}
          </div>
        );

        // Show toast based on success or failure
        if (allSuccessful) {
          toast.success(toastContent);
        } else {
          toast.error(toastContent);
        }

        if (allSuccessful) {
          await fetchBuybackData(
            buybackCompanyOptions.find(
              (company) => company.value === selectedBuybackId
            )?.isin || ""
          );
        }
      } else {
        toast.error("Buyback request failed. Please try again.");
      }
    } catch (error) {
      console.error("Buyback error:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setModalOpen(false);
      modalRef.current?.close();
    }
  };

  const validateInput = (input) => {
    const $input = $(input);
    const row = $input.closest("tr").hasClass("child")
      ? $input.closest("tr").prev()
      : $input.closest("tr");
    const rowData = JSON.parse(row.attr("data-row-data") || "{}");
    const inputValue = parseInt($input.val());
    const quantity = parseInt(rowData.quantity);
    const alreadyApplied = Number.parseInt(rowData.alreadyApplied) || 0

    const availableQuantity = quantity - alreadyApplied

    if (isNaN(inputValue) || inputValue < 0) {
      // Invalid input value or no value entered
      showError($input, "*Quantity should not be blank or zero.");
      return false;
    }
    else if (inputValue > availableQuantity) {
      // Input quantity exceeds available quantity
      showError($input, `*Already applied Quantity ${alreadyApplied}. Available Quantity : ${availableQuantity}`)
      return false
    }
    else if (inputValue > quantity) {
      // Invalid input value
      showError($input, "*Quantity cannot exceed the free quantity.");
      return false;
    } else {
      // Valid input, update the "applied" property of the row data
      rowData.applied = inputValue;
      clearError($input);
      return true;
    }
  };

  const showError = ($input, message) => {
    $input.addClass("border-red-500"); // Keeps the input field border red
    if (!$input.next(".error-message").length) {
      $input.after(
        `<span class="error-message text-red-500" style="display: block;">${message}</span>`
      ); // Apply shadcn's red color class (text-red-500)
    }
  };

  const clearError = ($input) => {
    $input.removeClass("border-red-500");
    $input.next(".error-message").remove();
  };

  const validateAllInputs = () => {
    let allValid = true;

    if (!tableRef.current) return true;

    const dt = $(tableRef.current).find("table");
    if (!dt.length) return true;

    try {
      const dataTable = dt.DataTable();
      const selectedRows = dataTable.rows({ selected: true }).nodes();

      // Only validate inputs from selected rows
      $(selectedRows).each(function () {
        const $row = $(this);
        const $childRow = $row.next("tr.child");

        // Check both main row and child row for inputs
        const $inputContainer = $row.add($childRow);
        const $quantityInputs = $inputContainer.find("input[name='quantity']");

        $quantityInputs.each(function () {
          if (!validateInput(this)) {
            allValid = false;
          }
        });
      });
    } catch (error) {
      console.error("Error in validateAllInputs:", error);

      // Fallback: if DataTable is not initialized, validate all inputs
      $("input[name='quantity']").each(function () {
        if (!validateInput(this)) {
          allValid = false;
        }
      });
    }

    return allValid;
  };

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return;

    $(tableRef.current).on("input", "input[name='quantity']", function () {
      validateInput(this);
    });

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("input", "input[name='quantity']");
      }
    };
  }, [data]);

  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Buybackk</CardTitle>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <p>
              <span className="font-semibold">NOTE:</span> On End Date Cut_Off
              time to place order is 12:00 PM.
            </p>
          </div>
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
                      onClick={() => {
                        const selectedData = getSelectedRowsData();
                        if (selectedData.length === 0) {
                          toast.error("Please select at least one");
                          return;
                        }
                        selectedRowsRef.current = selectedData;
                        setSelectedRows(selectedData);
                        // modalRef.current?.open();
                        if (validateAllInputs()) {
                          modalRef.current?.open();
                        } else {
                          toast.error(
                            "Please review the details before confirming."
                          );
                        }
                      }}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Apply Buyback
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


          {selectedBuybackId && selectedBuybackId !== "NONE" ? (
            <>
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : data.length === 0 ? (
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
                    key="buyback_table"
                    columns={columns}
                    data={data}
                    // onSelectedRowsChange={handleSelectedRowsChange}
                    selectableRows={true}
                    showPagination={true}
                  />
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* {modalOpen && (
        <ConfirmModal selectedRows={selectedRows} onConfirm={handleConfirm} onClose={() => setModalOpen(false)} />
      )} */}
      <CustomDialog
        ref={modalRef}
        title="Confirm Buyback ?"
        // onClose={() => modalRef.current?.close()}
        onConfirm={handleConfirm}
        confirmLoading={false}
        confirmText="Confirm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-base font-medium">
              Are you sure you want to buyback?
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
                  <TableHead className="w-1/4">Quantity</TableHead>
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
                        {share.inputs?.quantity || "-"}
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

{
  /*  {data.length > 0 && (
        <Button onClick={handleApplyBuyback} className="w-full sm:w-auto">
          Buyback
        </Button>
      )} */
}
