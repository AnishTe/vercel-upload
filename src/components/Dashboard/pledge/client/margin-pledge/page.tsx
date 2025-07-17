/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { applyMarginPledge, marginPledge } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import {
  HandCoins,
  AlertCircle,
  FileX,
  Info,
  Copy,
  Lock,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownUp,
  ArrowUpDown,
  ListFilter,
} from "lucide-react"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import type { MarginPledgeEntry } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"
import CustomDialog from "@/components/ui/CustomDialog"
const DataTableArray = dynamic(() => import("@/components/DataTableNetInp"), {
  ssr: false,
})

// First, add a formatIndianCurrency function at the top of the file, after the imports
const formatIndianCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value)
}

// Define a type for the input values
type InputValues = {
  [key: string]: {
    quantity: number
    segment: string
  }
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

export default function MarginPledge() {
  const [data, setData] = useState<MarginPledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState<MarginPledgeEntry[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [inputValues, setInputValues] = useState<InputValues>({})
  const [showRedirectModal, setShowRedirectModal] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState("")
  const [pledgeFormData, setPledgeFormData] = useState<any>(null)
  const [lastChangedSegment, setLastChangedSegment] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<string>("amount-high-low")
  const [isRedirecting, setIsRedirecting] = useState(false)
  //const [returnedFromCDSL, setReturnedFromCDSL] = useState(false)

  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowsRef = useRef<any[]>([])
  const modalRef = useRef<any | null>(null)
  const [isMobile, setIsMobile] = useState(false)

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
      case "amount-high-low":
        return sortedData.sort((a, b) => b.amount - a.amount)
      case "script-a-z":
        return sortedData.sort((a, b) => a.scriptName.localeCompare(b.scriptName))
      case "script-z-a":
        return sortedData.sort((a, b) => b.scriptName.localeCompare(a.scriptName))
      case "amount-low-high":
        return sortedData.sort((a, b) => a.amount - b.amount)
      default:
        return sortedData
    }
  }, [data, sortOption])

  const fetchMarginPledgeData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await marginPledge()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = response.data.data

      // Initialize input values with default values
      const initialInputValues: InputValues = {}
      parsedData.forEach((item) => {
        const key = `${item.boID}-${item.isin}`
        initialInputValues[key] = {
          quantity: item.unpledgedQuantity,
          segment: item.segment || "CM",
        }
      })

      setInputValues(initialInputValues)
      setData(parsedData)

      if (parsedData.length === 0) {
        toast.info("No pledge data available.")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
      toast.error("Failed to fetch pledge data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarginPledgeData()
  }, [])

  // Modify the handleQuantityChange function to calculate and update the amount
  const handleQuantityChange = (itemKey: string, value: string, maxQuantity: number) => {
    // Force integer value
    const intValue = Number.parseInt(value, 10)

    // Update the input value state
    setInputValues((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        quantity: intValue || 0,
      },
    }))

    // Validate the input
    validateInput(itemKey, intValue, maxQuantity)

    // Update the selected row if it exists
    const [boID, isin] = itemKey.split("-")
    const rowIndex = selectedRows.findIndex((row) => row.boID === boID && row.isin === isin)

    if (rowIndex >= 0) {
      const updatedRows = [...selectedRows]
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        inputs: {
          ...updatedRows[rowIndex].inputs,
          quantity: intValue,
          segment: inputValues[itemKey]?.segment || "CM",
        },
      }
      setSelectedRows(updatedRows)
    }

    // Update the amount display for this item
    const amountElement = document.getElementById(`amount-${itemKey}`)
    if (amountElement) {
      // Find the item in data
      const item = data.find((row) => row.boID === boID && row.isin === isin)
      if (item) {
        const ogAmt = item.amount
        const freeQty = item.unpledgedQuantity
        // Calculate the new amount
        const calculatedAmount = freeQty > 0 ? (ogAmt * intValue) / freeQty : 0
        // Update the display
        amountElement.textContent = formatIndianCurrency(calculatedAmount)
      }
    }
  }

  const handleSegmentChange = (itemKey: string, value: string) => {
    // Update the input value state
    setInputValues((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        segment: value,
      },
    }))

    // Set the last changed segment
    setLastChangedSegment(value)

    // Update the selected row if it exists
    const [boID, isin] = itemKey.split("-")
    const rowIndex = selectedRows.findIndex((row) => row.boID === boID && row.isin === isin)

    if (rowIndex >= 0) {
      const updatedRows = [...selectedRows]
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        inputs: {
          ...updatedRows[rowIndex].inputs,
          segment: value,
          quantity: inputValues[itemKey]?.quantity || 0,
        },
      }
      setSelectedRows(updatedRows)
    }
  }

  // Apply the last changed segment to all selected rows
  const applySegmentToSelected = () => {
    if (!lastChangedSegment || selectedRows.length <= 1) return

    // Update input values for all selected rows
    const updatedInputValues = { ...inputValues }

    selectedRows.forEach((row) => {
      const itemKey = `${row.boID}-${row.isin}`
      updatedInputValues[itemKey] = {
        ...updatedInputValues[itemKey],
        segment: lastChangedSegment,
      }
    })

    setInputValues(updatedInputValues)

    // Update selected rows
    const updatedRows = selectedRows.map((row) => ({
      ...row,
      inputs: {
        ...row.inputs,
        segment: lastChangedSegment,
        quantity: inputValues[`${row.boID}-${row.isin}`]?.quantity || row.unpledgedQuantity,
      },
    }))

    setSelectedRows(updatedRows)

    toast.success(
      `Applied ${getSegmentDisplayName(lastChangedSegment)} segment to ${selectedRows.length} selected items`,
    )
  }

  // Get segment display name
  const getSegmentDisplayName = (segmentCode: string) => {
    switch (segmentCode) {
      case "CM":
        return "CASH"
      case "FO":
        return "FO"
      case "CO":
        return "MCX"
      case "CD":
        return "CDS"
      default:
        return segmentCode
    }
  }

  // Shared function for handling checkbox changes
  const handleCheckboxChange = (checked: boolean, item: MarginPledgeEntry) => {
    const itemKey = `${item.boID}-${item.isin}`

    if (checked) {
      const newRow = {
        ...item,
        inputs: {
          quantity: inputValues[itemKey]?.quantity || item.unpledgedQuantity,
          segment: inputValues[itemKey]?.segment || item.segment || "CM",
        },
      }
      setSelectedRows([...selectedRows, newRow])
    } else {
      setSelectedRows(selectedRows.filter((row) => !(row.boID === item.boID && row.isin === item.isin)))
    }
  }

  // Render a list item based on current device
  const renderListItem = (item: MarginPledgeEntry, index: number) => {
    const itemKey = `${item.boID}-${item.isin}`
    const errorKey = `${itemKey}-quantity`
    const hasError = !!validationErrors[errorKey]
    const isSelected = selectedRows.some((row) => row.boID === item.boID && row.isin === item.isin)
    const currentValue =
      inputValues[itemKey]?.quantity !== undefined ? inputValues[itemKey].quantity : item.unpledgedQuantity
    const currentSegment = inputValues[itemKey]?.segment || item.segment || "CM"

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
                    <span className="text-sm font-medium">{item.scriptName}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {item.isin}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 ml-6 mb-2">
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-700 font-medium">BOID:</span>{" "}
                  <span className="font-medium">{item.boID}</span>
                </div>
                <div className="text-xs bg-gray-50 p-1 rounded">
                  <span className="text-gray-700 font-medium">Amount:</span>{" "}
                  <span id={`amount-${itemKey}`} className="font-medium">
                    {formatIndianCurrency(
                      inputValues[itemKey]?.quantity && item.unpledgedQuantity > 0
                        ? (item.amount * inputValues[itemKey].quantity) / item.unpledgedQuantity
                        : item.amount,
                    )}
                  </span>
                </div>
                <div className="text-xs flex items-center bg-green-50 p-1 rounded">
                  <Lock className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-gray-700 font-medium">Total:</span>{" "}
                  <span className="font-medium ml-1">{item.totalQuantity}</span>
                </div>
                <div className="text-xs flex items-center bg-amber-50 p-1 rounded">
                  <Info className="h-3 w-3 text-amber-500 mr-1" />
                  <span className="text-gray-700 font-medium">Unpledged:</span>{" "}
                  <span className="font-medium ml-1">{item.unpledgedQuantity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between ml-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-[10px] text-gray-700 font-medium block mb-1">Segment</span>
                    <Select value={currentSegment} onValueChange={(value) => handleSegmentChange(itemKey, value)}>
                      <SelectTrigger className="h-7 w-24 text-xs font-medium">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CM">CASH</SelectItem>
                        <SelectItem value="FO">FO</SelectItem>
                        <SelectItem value="CO">MCX</SelectItem>
                        <SelectItem value="CD">CDS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-700 font-medium block mb-1">Pledge Quantity</span>
                    <QuantityInput
                      itemKey={itemKey}
                      currentValue={currentValue}
                      hasError={hasError}
                      maxQuantity={item.unpledgedQuantity}
                      onChange={handleQuantityChange}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Desktop Layout
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Left section - Checkbox and Script Name */}
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox
                  id={`select-${index}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCheckboxChange(!!checked, item)}
                />
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{item.scriptName}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {item.isin}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-gray-100 px-1 py-0.5 rounded font-medium text-gray-800">BOID: {item.boID}</span>
                    <span>•</span>
                    <span className="bg-gray-100 px-1 py-0.5 rounded font-medium text-gray-800">
                      Amount:{" "}
                      <span id={`amount-${itemKey}`}>
                        {formatIndianCurrency(
                          inputValues[itemKey]?.quantity && item.unpledgedQuantity > 0
                            ? (item.amount * inputValues[itemKey].quantity) / item.unpledgedQuantity
                            : item.amount,
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle section - Total and Unpledged */}
              <div className="col-span-4 flex items-center justify-center space-x-3">
                <div className="flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <Lock className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-700">Total: {item.totalQuantity}</span>
                </div>
                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-md">
                  <Info className="h-3 w-3 text-amber-500 mr-1" />
                  <span className="text-xs font-medium text-amber-700">Unpledged: {item.unpledgedQuantity}</span>
                </div>
              </div>

              {/* Right section - Segment and Quantity */}
              <div className="col-span-4 flex items-center justify-end space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-medium text-gray-700">Segment</span>
                  <Select value={currentSegment} onValueChange={(value) => handleSegmentChange(itemKey, value)}>
                    <SelectTrigger className="h-7 w-24 text-xs mt-1 font-medium">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CM">CASH</SelectItem>
                      <SelectItem value="FO">FO</SelectItem>
                      <SelectItem value="CO">MCX</SelectItem>
                      <SelectItem value="CD">CDS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4 flex items-center justify-end">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium text-gray-700">Apply Qty</span>
                    <QuantityInput
                      itemKey={itemKey}
                      currentValue={currentValue}
                      hasError={hasError}
                      maxQuantity={item.unpledgedQuantity}
                      onChange={handleQuantityChange}
                    />
                  </div>
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

  // Finally, update the handleConfirm function to use the calculated amount
  const handleConfirm = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one item.")
      return
    }

    if (selectedRows.length > 49) {
      toast.error("Please select less than 50 items.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const record = selectedRows.map((row: any) => {
        const boID = row.boID
        const isin = row.isin
        const itemKey = `${boID}-${isin}`
        const quantity = row.inputs.quantity || ""

        const amountText = document.getElementById(`amount-${itemKey}`)?.textContent || "0"
        const parsedAmount = parseFloat(amountText.replace(/[^0-9.]/g, "") || "0").toFixed(2)

        return {
          clientid: row.clientId.toString() || "",
          boid: boID,
          isin: isin,
          quantity: quantity.toString(),
          amount: parsedAmount,
          segment: row.inputs.segment,
        }
      })


      const response = await applyMarginPledge({ record: record })
      const tokenIsValid = validateToken(response)

      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const responseData = JSON.parse(response.data.data)

      if (responseData.reqid) {
        // Clear selected rows after successful pledge application
        setSelectedRows([])
        localStorage.setItem("pledgeReturnUrl", window.location.pathname)

        setRedirectUrl(responseData.url)
        setPledgeFormData({
          pledgedtls: responseData.pledgedtls,
          dpid: responseData.dpid,
          version: responseData.version,
          reqid: responseData.reqid,
        })
        setIsRedirecting(true)
        //setShowRedirectModal(true)
      } else {
        throw new Error(responseData?.error || "Failed to pledge stock")
      }
    } catch (error) {
      console.error("Error during pledge application:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while pledging the stock")
    } finally {
      setLoading(false)
      setModalOpen(false)
      modalRef.current?.close()
    }
  }

  useEffect(() => {
    if (isRedirecting && redirectUrl && pledgeFormData) {
      //localStorage.setItem("cdslRedirectActive", "true")
      const timer = setTimeout(() => {
        const form = document.getElementById("pledgeForm") as HTMLFormElement
        if (form) {
          form.pledgeDtls.value = pledgeFormData.pledgedtls
          form.dpid.value = pledgeFormData.dpid
          form.version.value = pledgeFormData.version
          form.reqid.value = pledgeFormData.reqid

          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
          if (submitButton) {
            submitButton.click()
            setIsRedirecting(false)
          }
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isRedirecting, redirectUrl, pledgeFormData])

  const validateInput = (itemId: string, inputValue: number, maxQuantity: number) => {
    const errorKey = `${itemId}-quantity`

    if (isNaN(inputValue) || inputValue <= 0 || !Number.isInteger(inputValue)) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: "Quantity should not be blank or zero.",
      }))
      return false
    } else if (inputValue > maxQuantity) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: `Quantity cannot exceed the unpledged quantity (${maxQuantity})`,
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
      const itemKey = `${row.boID}-${row.isin}`
      const inputValue = inputValues[itemKey]?.quantity || 0
      const errorKey = `${itemKey}-quantity`

      if (isNaN(inputValue) || inputValue <= 0 || !Number.isInteger(inputValue)) {
        newErrors[errorKey] = "Quantity should not be blank or zero."
        allValid = false
      } else if (inputValue > row.unpledgedQuantity) {
        newErrors[errorKey] = `Quantity cannot exceed the unpledged quantity (${row.unpledgedQuantity})`
        allValid = false
      }
    })

    setValidationErrors(newErrors)
    return allValid
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Margin Pledge</CardTitle>

          {data.length > 0 && (
            <>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 flex items-center mx-auto">
                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <p className="sm:whitespace-nowrap">
                  <span className="font-semibold">Note:</span> Do not pledge stocks you plan to sell today or have
                  already sold. Pledging such stocks can lead to settlement issues or short delivery.
                </p>
              </div>

              <Button
                onClick={() => {
                  const selectedData = getSelectedRowsData()
                  if (selectedData.length === 0) {
                    toast.error("Please select at least one item")
                    return
                  }
                  if (selectedData.length > 49) {
                    toast.error("Please select less than 50 items.")
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
                className="bg-primary hover:bg-primary/90 whitespace-nowrap"
              >
                <HandCoins className="h-4 w-4 mr-2" />
                Apply Pledge
              </Button>
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
                  <div className="flex flex-wrap items-center justify-between p-2 bg-muted/10 rounded-md mb-3 shadow-sm gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedRows.length === data.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all rows
                            const allRows = data.map((item) => {
                              const itemKey = `${item.boID}-${item.isin}`
                              return {
                                ...item,
                                inputs: {
                                  quantity: inputValues[itemKey]?.quantity || item.unpledgedQuantity,
                                  segment: inputValues[itemKey]?.segment || item.segment || "CM",
                                },
                              }
                            })
                            setSelectedRows(allRows)
                          } else {
                            // Deselect all rows
                            setSelectedRows([])
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

                    {/* Sorting Dropdown - Responsive */}
                    <div
                      className={`${isMobile ? "w-[140px]" : selectedRows.length > 1 && lastChangedSegment ? "flex-1 flex justify-center" : "flex-1 flex justify-end"}`}
                    >
                      <div className={`${isMobile ? "w-full" : "max-w-[200px] w-full mx-auto"}`}>
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
                              {sortOption === "amount-low-high" && (
                                <div className="flex items-center">
                                  <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                                  <span>Amount (Low-High)</span>
                                </div>
                              )}
                              {sortOption === "amount-high-low" && (
                                <div className="flex items-center">
                                  <ArrowDownUp className="h-3.5 w-3.5 mr-2" />
                                  <span>Amount (High-Low)</span>
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
                            <SelectItem value="amount-low-high">
                              <div className="flex items-center">
                                <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                                <span>Amount (Low-High)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="amount-high-low">
                              <div className="flex items-center">
                                <ArrowDownUp className="h-3.5 w-3.5 mr-2" />
                                <span>Amount (High-Low)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedRows.length > 1 && lastChangedSegment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={applySegmentToSelected}
                        className={`bg-blue-50 border-blue-200 hover:bg-blue-50 text-blue-700 text-xs px-2 py-1 ${isMobile ? "h-7 text-[10px] whitespace-nowrap" : "h-7"}`}
                      >
                        <Copy className={`${isMobile ? "h-2.5 w-2.5 mr-1" : "h-3 w-3 mr-1"}`} />
                        {isMobile ? "Apply" : `Apply ${getSegmentDisplayName(lastChangedSegment)}`}
                      </Button>
                    )}
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
        title="Confirm Pledge"
        onConfirm={handleConfirm}
        confirmLoading={loading}
        confirmText="Confirm"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium">Are you sure you want to pledge the following shares?</p>

          <div className="rounded-md border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="w-1/3 text-xs">Script Name</TableHead>
                    <TableHead className="w-1/4 text-xs">Quantity</TableHead>
                    <TableHead className="w-1/4 text-xs">Segment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRows && selectedRows.length > 0 ? (
                    selectedRows.map((share, index) => {
                      const itemKey = `${share.boID}-${share.isin}`
                      return (
                        <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <TableCell className="text-xs">{share.scriptName}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                              {inputValues[itemKey]?.quantity || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              {getSegmentDisplayName(inputValues[itemKey]?.segment || "CM")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-xs">
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
  )
}
