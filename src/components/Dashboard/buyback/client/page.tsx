"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { applyforBuyback, buyback } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { toast } from "sonner"
import { HandCoins, AlertCircle, CheckCircle2, ClipboardList, FileX, Info, Lock, ShoppingBag, ArrowDownAZ, ArrowUpAZ, ArrowDownUp, ArrowUpDown, ListFilter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import type { BuybackDataEntry } from "./columns"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import CustomDialog from "@/components/ui/CustomDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { getCompatibleUrl } from "@/utils/url-helpers"

// Define a type for the input values
type InputValues = {
  [key: string]: number
}

// Reusable quantity input component
const QuantityInput = ({
  itemKey,
  currentValue,
  hasError,
  maxQuantity,
  onChange,
}: {
  itemKey: string
  currentValue: number | undefined
  hasError: boolean
  maxQuantity: number
  onChange: (itemKey: string, value: string, maxQuantity: number) => void
}) => (
  <div className="relative w-32">
    <Input
      name="quantity"
      type="number"
      step="1"
      min="1"
      data-id={`quantity-${itemKey}`}
      placeholder="Qty"
      value={currentValue || ""}
      className={`h-7 text-right pr-6 text-xs ${hasError
        ? "border-destructive bg-red-50"
        : "border-gray-300 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
        }`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Prevent decimal point
        if (e.key === "." || e.key === ",") {
          e.preventDefault()
        }
      }}
      onChange={(e) => {
        onChange(itemKey, e.target.value, maxQuantity)
      }}
    />
    <Button
      variant="ghost"
      size="icon"
      className="h-4 w-4 absolute right-1 top-1.5 p-0 text-primary hover:text-primary/80"
      onClick={(e) => {
        e.stopPropagation()
        const input = document.querySelector(`input[data-id="quantity-${itemKey}"]`) as HTMLInputElement
        if (input) {
          input.focus()
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </Button>
  </div>
)

export default function Buyback() {
  const router = useRouter()
  const [data, setData] = useState<BuybackDataEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState<BuybackDataEntry[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [inputValues, setInputValues] = useState<InputValues>({})
  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowsRef = useRef<any[]>([])
  const modalRef = useRef<any | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sortOption, setSortOption] = useState<string>("script-a-z")

  // Store selected identifiers in localStorage to persist across refreshes
  const localStorageKey = "buyback-selected-rows"

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Save selected rows to localStorage whenever they change
  useEffect(() => {
    if (selectedRows.length > 0) {
      const identifiers = selectedRows.map((row) => `${row.clientId}-${row.isin}`)
      localStorage.setItem(localStorageKey, JSON.stringify(identifiers))
    } else {
      localStorage.removeItem(localStorageKey)
    }
  }, [selectedRows])

  const getSelectedRowsData = useCallback(() => {
    return selectedRows.map((row) => {
      const inputs = row.inputs || {}
      return { ...row, inputs }
    })
  }, [selectedRows])

  const getSortedData = useCallback(() => {
    const sortedData = [...data]

    switch (sortOption) {
      // case "default":
      case "script-a-z":
        return sortedData.sort((a, b) => a.scrip.localeCompare(b.scrip))
      case "script-z-a":
        return sortedData.sort((a, b) => b.scrip.localeCompare(a.scrip))
      default:
        return sortedData
    }
  }, [data, sortOption])


  const fetchBuybackData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await buyback()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = response.data.data

      // Initialize input values with default values
      const initialInputValues: InputValues = {}
      parsedData.forEach((item) => {
        const key = `${item.clientId}-${item.isin}`
        initialInputValues[key] = item.applied || item.quantity
      })

      setInputValues(initialInputValues)
      setData(parsedData)

      // Restore selection from localStorage
      try {
        const savedSelection = localStorage.getItem(localStorageKey)
        if (savedSelection) {
          const identifiers = JSON.parse(savedSelection) as string[]

          // Find matching rows in the new data
          const newSelectedRows = parsedData
            .filter((item) => {
              const key = `${item.clientId}-${item.isin}`
              return identifiers.includes(key)
            })
            .map((item) => ({
              ...item,
              inputs: {
                quantity: initialInputValues[`${item.clientId}-${item.isin}`] || item.applied || item.quantity,
              },
            }))

          if (newSelectedRows.length > 0) {
            setSelectedRows(newSelectedRows)
          }
        }
      } catch (e) {
        console.error("Error restoring selection:", e)
      }

      if (parsedData.length === 0) {
        toast.info("No buyback data available.")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
      toast.error("Failed to fetch buyback data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuybackData()
  }, [])

  const handleConfirm = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one item.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const record = selectedRows.map((row) => ({
        applied: inputValues[`${row.clientId}-${row.isin}`] || row.applied,
        clientId: row.clientId.toString(),
        quantity: row.quantity,
        boid: row.boid,
        scrip: row.scrip,
        isin: row.isin,
        buybackid: row.buybackId,
        branchcode: row.branchcode.toString(),
        orderType: "CDSL"
      }))

      // Save current selection before API call
      const currentSelection = selectedRows.map((row) => `${row.clientId}-${row.isin}`)
      localStorage.setItem(localStorageKey, JSON.stringify(currentSelection))

      const response = await applyforBuyback({ data: record })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const responseData = response.data

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
          setSelectedRows([])
          await fetchBuybackData()

        }
      }

      else {
        toast.error("Buyback request failed. Please try again.")
      }
    } catch (error) {
      console.error("Error during buyback application:", error)
      toast.error("An error occurred while applying for buyback. Please try again later.")
    } finally {
      setLoading(false)
      setModalOpen(false)
      modalRef.current?.close()
    }
  }

  const handleViewOrders = () => {
    router.push(getCompatibleUrl("/client/dashboard/buyback/viewOrders"))
  }

  const validateInput = (itemId: string, inputValue: number, maxQuantity: number) => {
    const errorKey = `${itemId}-quantity`

    // Find the item to get the alreadyApplied value
    const [clientId, isin] = itemId.split("-")
    const item = data.find((item) => item.clientId === clientId && item.isin === isin)
    const alreadyApplied = item?.alreadyApplied || 0
    const availableQuantity = maxQuantity - alreadyApplied

    if (isNaN(inputValue) || inputValue < 0 || !Number.isInteger(inputValue)) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: "Quantity should not be blank or zero.",
      }))
      return false
    } else if (inputValue > availableQuantity) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: `*Already applied Quantity ${alreadyApplied}. Available Quantity : ${availableQuantity}`,
      }))
      return false
    } else if (inputValue > maxQuantity) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: `Quantity cannot exceed the free quantity (${maxQuantity})`,
      }))
      return false
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
      return true
    }
  }

  const validateAllInputs = () => {
    let allValid = true
    const newErrors: Record<string, string> = {}

    selectedRows.forEach((row) => {
      const itemKey = `${row.clientId}-${row.isin}`
      const inputValue = inputValues[itemKey] || 0
      const errorKey = `${itemKey}-quantity`
      const alreadyApplied = row.alreadyApplied || 0
      const availableQuantity = row.quantity - alreadyApplied

      if (isNaN(inputValue) || inputValue <= 0 || !Number.isInteger(inputValue)) {
        newErrors[errorKey] = "Quantity should not be blank or zero."
        allValid = false
      } else if (inputValue > availableQuantity) {
        newErrors[errorKey] = `*Already applied Quantity ${alreadyApplied}. Available Quantity : ${availableQuantity}`
        allValid = false
      } else if (inputValue > row.quantity) {
        newErrors[errorKey] = `Quantity cannot exceed the free quantity (${row.quantity})`
        allValid = false
      }
    })

    setValidationErrors(newErrors)
    return allValid
  }

  const handleQuantityChange = (itemKey: string, value: string, maxQuantity: number) => {
    // Force integer value
    const intValue = Number.parseInt(value, 10)

    // Update the input value state
    setInputValues((prev) => ({
      ...prev,
      [itemKey]: intValue || 0,
    }))

    // Validate the input
    validateInput(itemKey, intValue, maxQuantity)

    // Update the selected row if it exists
    const [clientId, isin] = itemKey.split("-")
    const rowIndex = selectedRows.findIndex((row) => row.clientId === clientId && row.isin === isin)

    if (rowIndex >= 0) {
      const updatedRows = [...selectedRows]
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        inputs: { ...updatedRows[rowIndex].inputs, quantity: intValue },
      }
      setSelectedRows(updatedRows)
    }
  }

  // Shared function for handling checkbox changes
  const handleCheckboxChange = (checked: boolean, item: BuybackDataEntry) => {
    const itemKey = `${item.clientId}-${item.isin}`

    if (checked) {
      const newRow = {
        ...item,
        inputs: {
          quantity: inputValues[itemKey] || item.applied || item.quantity,
        },
      }
      const newSelectedRows = [...selectedRows, newRow]
      setSelectedRows(newSelectedRows)

      // Update localStorage
      const identifiers = newSelectedRows.map((row) => `${row.clientId}-${row.isin}`)
      localStorage.setItem(localStorageKey, JSON.stringify(identifiers))
    } else {
      const filteredRows = selectedRows.filter((row) => !(row.clientId === item.clientId && row.isin === item.isin))
      setSelectedRows(filteredRows)

      // Update localStorage
      if (filteredRows.length > 0) {
        const identifiers = filteredRows.map((row) => `${row.clientId}-${row.isin}`)
        localStorage.setItem(localStorageKey, JSON.stringify(identifiers))
      } else {
        localStorage.removeItem(localStorageKey)
      }
    }
  }

  // Render a list item based on current device
  const renderListItem = (item: BuybackDataEntry, index: number) => {
    const itemKey = `${item.clientId}-${item.isin}`
    const errorKey = `${itemKey}-quantity`
    const hasError = !!validationErrors[errorKey]
    const isSelected = selectedRows.some((row) => row.clientId === item.clientId && row.isin === item.isin)
    const currentValue = inputValues[itemKey] !== undefined ? inputValues[itemKey] : item.applied || item.quantity

    return (
      <div
        key={`${itemKey}-${index}`}
        className={`rounded-md mb-2 transition-all duration-200 ${isSelected
          ? "bg-primary/5 border border-primary/20 shadow"
          : "border border-gray-200 hover:border-primary/30 hover:shadow-sm"
          }`}
      >
        <div className="p-2">
          {isMobile ? (
            // Mobile Layout
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`select-${index}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleCheckboxChange(!!checked, item)}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.scrip}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {item.isin}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 ml-6 mb-2">
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-800 font-medium">Client:</span>{" "}
                  <span className="font-medium text-gray-900">{item.clientId}</span>
                </div>
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-800 font-medium">Branch:</span>{" "}
                  <span className="font-medium text-gray-900">{item.branchcode}</span>
                </div>
                <div className="text-xs flex items-center bg-green-50 p-1 rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-gray-800 font-medium">Free:</span>{" "}
                  <span className="font-medium text-gray-900 ml-1">{item.quantity}</span>
                </div>
                <div className="text-xs flex items-center bg-amber-50 p-1 rounded">
                  <Info className="h-3 w-3 text-amber-500 mr-1" />
                  <span className="text-gray-800 font-medium">Pledged:</span>{" "}
                  <span className="font-medium text-gray-900 ml-1">{item.pledgedquantity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between ml-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-[10px] text-gray-800 font-medium block mb-1">Already Applied</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">
                      {item.alreadyApplied}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-800 font-medium block mb-1">Apply Quantity</span>
                    <QuantityInput
                      itemKey={itemKey}
                      currentValue={currentValue}
                      hasError={hasError}
                      maxQuantity={item.quantity}
                      onChange={handleQuantityChange}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Desktop Layout - Using grid to evenly distribute content
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Left section - Checkbox, Script Name, and Client Info */}
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox
                  id={`select-${index}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCheckboxChange(!!checked, item)}
                />
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{item.scrip}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {item.isin}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Client: {item.clientId}</span>
                    <span className="text-gray-500">•</span>
                    <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Branch: {item.branchcode}</span>
                  </div>
                </div>
              </div>

              {/* Middle section - Free and Pledged Quantities */}
              <div className="col-span-4 flex items-center justify-center space-x-3">
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs font-medium text-green-700">Free: {item.quantity}</span>
                </div>
                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-md">
                  <Info className="h-3 w-3 text-amber-500 mr-1" />
                  <span className="text-xs font-medium text-amber-700">Pledged: {item.pledgedquantity}</span>
                </div>
              </div>

              {/* Right section - Already Applied and Quantity */}
              <div className="col-span-4 flex items-center justify-end space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-gray-800">Already Applied</span>
                  <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">
                    {item.alreadyApplied}
                  </Badge>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-gray-800">Apply Qty</span>
                  <QuantityInput
                    itemKey={itemKey}
                    currentValue={currentValue}
                    hasError={hasError}
                    maxQuantity={item.quantity}
                    onChange={handleQuantityChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Validation error message - unified */}
          {hasError && (
            <div className="mt-1 ml-6 flex items-center text-destructive text-[10px] bg-red-50 p-1 rounded">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{validationErrors[errorKey]}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Buyback</CardTitle>
          {data.length > 0 && (
            <>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 flex items-center mx-auto">
                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <p>
                  <span className="font-semibold">NOTE:</span> On End Date Cut-Off time to place order is 12:00 PM.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleViewOrders}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
                <Button
                  onClick={() => {
                    const selectedData = getSelectedRowsData()
                    if (selectedData.length === 0) {
                      toast.error("Please select at least one item")
                      return
                    }
                    selectedRowsRef.current = selectedData
                    setSelectedRows(selectedData)

                    if (validateAllInputs()) {
                      modalRef.current?.open()
                    } else {
                      toast.error("Please review the details before confirming.", {
                        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
                      })
                    }
                  }}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Apply Buyback
                </Button>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent>
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
                  <p className="text-muted-foreground mb-4 max-w-md">
                    There are no records available for this criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-1" ref={tableRef}>
                  {/* Select All Row */}
                  <div className="flex items-center justify-between p-2 bg-muted/10 rounded-md mb-3 shadow-sm gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedRows.length === data.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all rows
                            const allRows = data.map((item) => ({
                              ...item,
                              inputs: {
                                quantity: inputValues[`${item.clientId}-${item.isin}`] || item.applied || item.quantity,
                              },
                            }))
                            setSelectedRows(allRows)

                            // Save all identifiers to localStorage
                            const allIdentifiers = data.map((item) => `${item.clientId}-${item.isin}`)
                            localStorage.setItem(localStorageKey, JSON.stringify(allIdentifiers))
                          } else {
                            // Deselect all rows
                            setSelectedRows([])
                            localStorage.removeItem(localStorageKey)
                          }
                        }}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select All
                      </label>
                    </div>

                    <div className={`${isMobile ? "w-[140px]" : "w-[200px]"}`}>
                      <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className={`${isMobile ? "h-7 text-xs px-2" : "h-8 text-xs"}`}>
                          <SelectValue placeholder="Sort by">
                            {sortOption === "default" && (
                              <div className="flex items-center">
                                <ListFilter className="h-3.5 w-3.5 mr-2" />
                                <span>Default</span>
                              </div>
                            )}
                            {sortOption === "script-a-z" && (
                              <div className="flex items-center">
                                <ArrowDownAZ className="h-3.5 w-3.5 mr-2" />
                                <span>Script Name (A-Z)</span>
                              </div>
                            )}
                            {sortOption === "script-z-a" && (
                              <div className="flex items-center">
                                <ArrowUpAZ className="h-3.5 w-3.5 mr-2" />
                                <span>Script Name (Z-A)</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            <div className="flex items-center">
                              <ListFilter className="h-3.5 w-3.5 mr-2" />
                              <span>Default</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="script-a-z">
                            <div className="flex items-center">
                              <ArrowDownAZ className="h-3.5 w-3.5 mr-2" />
                              <span>Script Name (A-Z)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="script-z-a">
                            <div className="flex items-center">
                              <ArrowUpAZ className="h-3.5 w-3.5 mr-2" />
                              <span>Script Name (Z-A)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* List Items - Rendered based on device */}
                  {getSortedData().map((item, index) => renderListItem(item, index))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CustomDialog
        ref={modalRef}
        title="Confirm Buyback"
        onConfirm={handleConfirm}
        confirmLoading={loading}
        confirmText="Confirm"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium">Are you sure you want to apply for buyback?</p>

          <div className="rounded-md border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="w-1/4 text-xs">Client ID</TableHead>
                    <TableHead className="w-1/4 text-xs">ISIN</TableHead>
                    <TableHead className="w-1/3 text-xs">Scrip Name</TableHead>
                    <TableHead className="w-1/4 text-xs">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRows && selectedRows.length > 0 ? (
                    selectedRows.map((share, index) => {
                      const itemKey = `${share.clientId}-${share.isin}`
                      return (
                        <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <TableCell className="text-xs">{share.clientId}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              {share.isin}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{share.scrip}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                              {inputValues[itemKey] || "-"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs">
                        No scripts selected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="text-xs text-gray-700 mt-2 bg-amber-50 p-2 rounded-md border border-amber-200 flex items-start">
            <Info className="h-3 w-3 text-amber-500 mr-2 mt-0.5" />
            <p>Please review the details before confirming.</p>
          </div>
        </div>
      </CustomDialog>

      {showSessionExpiredModal && <SessionExpiredModal />}
    </DashboardLayout>
  )
}
