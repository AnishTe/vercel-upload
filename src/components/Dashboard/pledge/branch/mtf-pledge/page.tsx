/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import $ from "jquery";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { HandCoins, AlertCircle, FileX } from "lucide-react";
import { applyMtfPledgeBranch, mtfPledgeBranch } from "@/lib/auth";
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation";
import DashboardLayout from "@/components/Dashboard/dashboard-layout";
// import { DataTable } from "@/components/DataTable";
// import { ConfirmModal } from "./confirm-modal";
import DataTableSkeleton from "@/components/DataTable-Skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { columns, type MTFPledgeEntry } from "./columns";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";
import CustomDialog from "@/components/ui/CustomDialog";
const DataTableArray = dynamic(() => import("@/components/DataTableNetInp"), {
  ssr: false,
});
// const DataTableArray = dynamic(() => import("@/components/DataTableArray"), {
//   ssr: false,
// });

const formatIndianCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value)
}

const AmountCell = ({ clientId, rowData }: { clientId: string; rowData: any }) => {
  const ogAmt = rowData.original.amount
  const freeQty = rowData.original.unpledgedQuantity
  const qtyPledge = rowData.inputs.unpledgedQuantityInp

  const calculatedAmount = ogAmt * qtyPledge / freeQty || 0

  return <span id={`amountCell_${rowData.original.isin}`}>
    {formatIndianCurrency(calculatedAmount)}
  </span>
}

export default function MTFPledge() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [selectedRows, setSelectedRows] = useState<MTFPledgeEntry[]>([]);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [pledgeFormData, setPledgeFormData] = useState<any>(null);
  const [clientId, setClientId] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false)
  //const [returnedFromCDSL, setReturnedFromCDSL] = useState(false)

  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowsRef = useRef<any[]>([]);
  const modalRef = useRef<any | null>(null);

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

  const checkWeekdayAndShowAlert = () => {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    // Check if the current day is Saturday (6) or Sunday (0)
    if (currentDay === 0 || currentDay === 6) {
      toast.warning("Please only apply on working days.", {
        position: "top-center",
        duration: 3000,
      });
      return false; // It's a weekend, so return false
    }

    return true; // It's a weekday, so return true
  };

  // Add useEffect to check for clientId in URL params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdFromUrl = urlParams.get("client")

    if (clientIdFromUrl) {
      setClientId(clientIdFromUrl)
      fetchData(clientIdFromUrl)
    }
  }, [])

  const fetchData = useCallback(async (id: string) => {
    // if (!checkWeekdayAndShowAlert()) {
    //   return;
    // }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await mtfPledgeBranch({ clientId: id.trim() });
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
        if (parsedData.length === 0) {
          toast.info("No pledge data available.")
        }
      } else {
        setData([]);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [])

  const fetchMTFPledgeData = async () => {
    if (!clientId.trim()) {
      toast.error("Please enter a Client ID")
      setData([])
      return
    }

    await fetchData(clientId)
  }

  useEffect(() => {
    if (!tableRef.current || !selectedRows || data.length === 0) return;

    const updateAmount = (clientId: string, lotValue: number, rowData: any) => {
      if (!rowData) {
        console.error("rowData is null or undefined. Cannot update amount.");
        return;
      }

      const ogAmt = rowData.amount;
      const freeQty = rowData.unpledgedQuantity;
      const qtyPledge = lotValue;

      if (typeof ogAmt !== "number" || typeof freeQty !== "number" || typeof qtyPledge !== "number") {
        console.error("Invalid data types. Cannot update amount.");
        return;
      }

      const calculatedAmount = (ogAmt * qtyPledge) / freeQty || 0;

      const amountCellId = `amountCell_${clientId}`;
      try {
        $(`#${amountCellId}`).text(calculatedAmount.toFixed(2));
      } catch (e) {
        console.error("Error updating amount cell:", e);
      }


    };

    const handleChange = function (this: HTMLInputElement) {
      const clientId = this.id.split("-")[1];
      const lotValue = Number(this.value) || 0;

      // Get nearest row and parse rowData
      const rowEl = $(this).closest("tr");
      const rowDataRaw = rowEl.attr("data-row-data");
      console.log(rowDataRaw)
      if (!rowDataRaw) return;

      try {
        const rowData = JSON.parse(rowDataRaw);
        updateAmount(clientId, lotValue, rowData);
      } catch (e) {
        console.error("Failed to parse rowData:", e);
      }
    };

    $(tableRef.current)
      .off("input", 'input[id^="quantity-"]')

    // Add the new handler
    $(tableRef.current).on("input", 'input[id^="quantity-"]', handleChange)

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("input", 'input[id^="quantity-"]');
      }
    };
  }, [data]);



  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      mtfPledgeBranch();
    }
  };

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return;

    $(tableRef.current).on("select.dt", (e, dt, type, indexes) => {
      if (type === "row") {
        indexes.forEach((index) => {
          const rowNode = dt.row(index).node();
          const applyQty = $(rowNode).find("input[name='quantity']");
          const applyQtyValue = applyQty.val()?.toString().trim();

          // Check if the value exists and is a valid number (including zero)
          const isValidNumber =
            applyQtyValue !== undefined &&
            applyQtyValue !== "" &&
            !isNaN(Number(applyQtyValue));

          if (!isValidNumber) {
            dt.row(index).deselect();
            toast.error("Quantity should not be blank or zero", {
              position: "top-center",
              duration: 3000,
            });

            $(rowNode).find(".rowCheckbox").prop("checked", false);
            applyQty.addClass("border-red-500"); // Highlight the invalid input field
          } else {
            applyQty.removeClass("border-red-500"); // Remove error styling if valid
          }
        });
      }
    });

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("change", '[id^="lotDropdown_"]');
        $(tableRef.current).off("select.dt");
      }
    };
  }, [data]);

  const handleConfirm = async () => {
    //selectedRows = selectedRowsRef.current;
    setLoading(true);
    try {
      const record = selectedRows.map((row: any) => {
        const quantity = row.inputs.quantity || "";
        const isin = row.isin;

        const amountText = $(`#amountCell_${isin}`).text().replace(/[^0-9.]/g, "");
        const updatedAmount = parseFloat(amountText || "0").toFixed(2);

        return {
          clientid: row.clientId.toString() || "",
          boid: row.boID.toString() || "",
          isin: isin,
          quantity: quantity.toString(),
          amount: updatedAmount,
          segment: "CM",
        };
      });

      const response = await applyMtfPledgeBranch({ record: record });
      const tokenIsValid = validateToken(response);

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true);
        return;
      }
      const responseData = JSON.parse(response.data.data);

      if (responseData.reqid) {
        localStorage.setItem("pledgeClientId", clientId)
        localStorage.setItem("pledgeReturnUrl", window.location.pathname)
        setRedirectUrl(responseData.url);
        setPledgeFormData({
          pledgedtls: responseData.pledgedtls,
          dpid: responseData.dpid,
          version: responseData.version,
          reqid: responseData.reqid,
        });
        setIsRedirecting(true)
        //setShowRedirectModal(true);
        // await fetchMarginPledgeData()
      } else {
        throw new Error(
          response?.data?.data?.error || "Failed to pledge stock :("
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "An error occurred while pledge the stock :("
      );
    } finally {
      setLoading(false);
      setModalOpen(false);
      modalRef.current?.close();
    }
  };

  useEffect(() => {
    if (isRedirecting && redirectUrl && pledgeFormData) {
      //localStorage.setItem("cdslRedirectActive", "true")
      const timer = setTimeout(() => {
        const form = document.getElementById("pledgeForm") as HTMLFormElement;
        if (form) {
          form.pledgeDtls.value = pledgeFormData.pledgedtls;
          form.dpid.value = pledgeFormData.dpid;
          form.version.value = pledgeFormData.version;
          form.reqid.value = pledgeFormData.reqid;

          const submitButton = form.querySelector(
            'button[type="submit"]'
          ) as HTMLButtonElement;
          if (submitButton) {
            submitButton.click();
            setIsRedirecting(false)
          }
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRedirecting, redirectUrl, pledgeFormData]);


  const validateInput = (input) => {
    const $input = $(input);
    const row = $input.closest("tr").hasClass("child") ? $input.closest("tr").prev() : $input.closest("tr");
    const rowData = JSON.parse(row.attr("data-row-data") || "{}");
    const inputValue = parseInt($input.val());
    const quantity = parseInt(rowData.totalQuantity);

    if (isNaN(inputValue) || inputValue <= 0) {
      // Invalid input value or no value entered
      showError($input, '*Quantity should not be blank or zero.');
      return false;
    } else if (inputValue > quantity) {
      // Invalid input value
      showError($input, `*Cannot pledge more than ${quantity} shares.`);
      return false;
    } else {
      // Valid input, update the "applied" property of the row data
      rowData.applied = inputValue;
      clearError($input);
      return true;
    }
  };

  const showError = ($input, message) => {
    $input.addClass("border-red-500");  // Keeps the input field border red
    if (!$input.next('.error-message').length) {
      $input.after(`<span class="error-message text-red-500" style="display: block;">${message}</span>`); // Apply shadcn's red color class (text-red-500)
    }
  };

  const clearError = ($input) => {
    $input.removeClass("border-red-500");
    $input.next('.error-message').remove();
  };


  const validateAllInputs = () => {
    let allValid = true;
    $("input[name='quantity']").each(function () {
      if (!validateInput(this)) {
        allValid = false;
      }
    });
    return allValid;
  };

  useEffect(() => {
    if (!tableRef.current || data.length === 0) return

    $(tableRef.current).on("input", "input[name='quantity']", function () {
      validateInput(this);
    });

    return () => {
      if (tableRef.current) {
        $(tableRef.current).off("input", "input[name='quantity']")
      }
    }
  }, [data])

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle>MTF Pledge</CardTitle>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="clientId" className="whitespace-nowrap text-sm">
                  ClientID:
                </Label>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    id="clientId"
                    type="text"
                    placeholder="Enter Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-32 sm:w-40 md:w-48 h-9 bg-white text-black placeholder-gray-400 text-sm"
                  />
                  <Button
                    onClick={fetchMTFPledgeData}
                    size="sm"
                    className="h-9 px-2 shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {data.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    const selectedData = getSelectedRowsData();
                    if (selectedData.length === 0) {
                      toast.error("Please select at least one");
                      return;
                    }

                    if (selectedData.length > 49) {
                      toast.error("Please select less than 50 items.");
                      return;
                    }
                    selectedRowsRef.current = selectedData;
                    setSelectedRows(selectedData);
                    //modalRef.current?.open();
                    if (validateAllInputs()) {
                      modalRef.current?.open();
                    } else {
                      toast.error("Please review the details before confirming.");
                    }
                  }}
                  className="h-9 whitespace-nowrap ml-auto sm:ml-0"
                >
                  <HandCoins className="h-4 w-4 mr-2" />
                  Apply Pledge
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-full max-w-full sm:max-w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <p className="sm:whitespace-nowrap">
                    <span className="font-semibold">Note:</span> Do not pledge stocks you plan to sell
                    today or have already sold. Pledging such stocks can lead to settlement issues or short delivery.
                  </p>
                </div>
              </div>
            </div>
            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
            {loading ? (
              <DataTableSkeleton columns={4} rows={10} />
            ) : (
              <>
                {data === null ? (
                  <p></p>
                ) : data.length > 0 ? (
                  <div className="overflow-x-auto" ref={tableRef}>
                    <DataTableArray
                      columns={columns}
                      key="mtf_pledge_table"
                      data={data}
                      showAllRows={true}
                      showPagination={true}
                      selectableRows={true}
                    />
                  </div>
                ) : (
                  hasSearched && <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <FileX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No records found</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CustomDialog
        ref={modalRef}
        title="Confirm Pledge ?"
        onConfirm={handleConfirm}
        confirmLoading={loading}
        confirmText="Confirm"
      >
        <div className="space-y-4">
          <p className="text-base font-medium">
            Are you sure you want to pledge the following shares?
          </p>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Script Name</TableHead>
                  <TableHead className="w-1/4 text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRows && selectedRows.length > 0 ? (
                  selectedRows.map((share, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {share.scriptName}
                      </TableCell>
                      <TableCell className="text-right">
                        {share.inputs?.quantity}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No shares selected
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

      {/* Fixed overlay that will stay visible until page navigation */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Redirecting to CDSL page...</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please Wait! You will be redirected shortly.
              </p>
              <div className="flex justify-center mb-4">
                <svg
                  className="animate-spin h-10 w-10 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      <form
        name="frmpledge"
        id="pledgeForm"
        method="POST"
        action={redirectUrl}
        style={{ display: "none" }}
      //target="_blank"
      >
        <input type="hidden" name="pledgeDtls" />
        <input type="hidden" name="dpid" />
        <input type="hidden" name="version" />
        <input type="hidden" name="reqid" />
        <button type="submit">Submit Pledge</button>
      </form>
    </DashboardLayout>
  );
}
