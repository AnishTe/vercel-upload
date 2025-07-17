"use client"

import { useEffect, useRef } from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ongoingBuyback, getOrderbookDetailsHO, orderbookUpload } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { FileIcon, Trash2, CalendarRange, Building, Library, IndianRupee, Info, FileX } from "lucide-react"
// import { DataTable } from "@/components/DataTable"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { columns, type BuybackOrderBookDetailsHO } from "./columns"
import { CalendarIcon, BuildingIcon, DollarSignIcon, BarChartIcon, TrendingUpIcon, Upload, LibraryIcon } from "lucide-react"
import { FileUploadModal, type FormValues } from "./orderbook_upload"
import { useForm } from "react-hook-form"

import dynamic from "next/dynamic"
import CustomDialog from "@/components/ui/CustomDialog"
import BuybackDetails from "@/components/BuybackDetails"
const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

interface TemplateOption {
  scrip: string
  value: string
  isin: string
  fromdate: string
  todate: string
  buybackprice: number
  nsesettno: string
  bsesettno: string
}

export default function BuybackHOOrderBook() {
  const [data, setData] = useState<BuybackOrderBookDetailsHO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const [buybackCompanyOptions, setBuybackCompanyOptions] = useState<TemplateOption[]>([])
  const [selectedBuybackId, setSelectedBuybackId] = useState<string>("")
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<TemplateOption | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>()

  const getTemplateNames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ongoingBuyback()
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

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
          })),
        )
      } else {
        throw new Error(parsedData["Error Description"] || "Failed to fetch template data.")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getTemplateNames()
  }, [getTemplateNames])

  const fetchBuybackData = useCallback(async (isin: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getOrderbookDetailsHO({ isin: isin })
      const tokenIsValid = validateToken(response)
      if (!tokenIsValid) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

      if (parsedData && Object.keys(parsedData).length > 0) {
        setData(parsedData)
      } else {
        setData([])
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCompanySelect = (value: string) => {
    if (!value || value === "NONE") {
      toast.error("Please select a company.")
      setSelectedBuybackId("")
      setData([])
      setSelectedCompanyDetails(null)
      return
    }

    setSelectedBuybackId(value)
    const selectedCompany = buybackCompanyOptions.find((company) => company.value === value)
    if (selectedCompany) {
      setSelectedCompanyDetails(selectedCompany)
      fetchBuybackData(selectedCompany.isin)
    }
  }

  const handleFileUpload = async (data: FormValues) => {
    const { exchange, file } = data

    try {
      setLoading(true)

      if (!selectedCompanyDetails?.isin || !selectedBuybackId) {
        toast.error("Missing company information. Please select a company first.")
        return
      }

      toast.loading("File upload in process...")

      if (!file) {
        console.error("File is missing!")
        return
      }

      const formData = new FormData()

      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              isin: selectedCompanyDetails.isin,
              buybackid: selectedBuybackId.toString(), // Ensure string format
              exchange: exchange,
            }),
          ],
          { type: "multipart/alternative" },
        ),
      )

      formData.append("orderbook", file, file.name)

      const responseData = await orderbookUpload(formData)

      toast.dismiss()
      toast.success("File Upload Successfully.")
      setIsUploadModalOpen(false)

      // Reset the form
      form.reset()

      // Refresh the buyback data
      if (selectedCompanyDetails?.isin) {
        await fetchBuybackData(selectedCompanyDetails.isin)
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast.dismiss()
      toast.error("An error occurred while uploading the file.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Buyback OrderBook</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Company Selection Section */}
          <div className="bg-slate-50 rounded-md p-1 mb-2">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="w-full md:w-auto">
                {/* <div className="text-sm font-medium mb-1">Select Company</div> */}
                <div className="relative w-full md:w-[260px]">
                  <Select value={selectedBuybackId} onValueChange={handleCompanySelect}>
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
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    // disabled={!selectedBuybackId || selectedBuybackId === "NONE"}
                    // className="bg-yellow-600 hover:bg-yellow-700"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    size="sm"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
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
                      <span className="font-medium">{selectedCompanyDetails.scrip}</span>
                      {selectedCompanyDetails.isin && selectedCompanyDetails.isin !== "-" && (
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
                      {selectedCompanyDetails.fromdate && selectedCompanyDetails.fromdate !== "-"
                        ? selectedCompanyDetails.fromdate
                        : "N/A"}
                      {" - "}
                      {selectedCompanyDetails.todate && selectedCompanyDetails.todate !== "-"
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
                    <div className="text-xs text-slate-500">Price & Settlement No</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">
                        ₹{selectedCompanyDetails.buybackprice > 0 ? selectedCompanyDetails.buybackprice : "N/A"}
                      </span>

                      {selectedCompanyDetails.nsesettno && selectedCompanyDetails.nsesettno !== "-" && (
                        <Badge variant="secondary" className="text-xs">
                          NSE: {selectedCompanyDetails.nsesettno}
                        </Badge>
                      )}
                      {selectedCompanyDetails.bsesettno && selectedCompanyDetails.bsesettno !== "-" && (
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

              <div className="flex space-x-2 w-full xs:w-auto sm:w-auto justify-between xs:justify-end sm:justify-end">
                {/* {data.length > 0 && ( */}
                {/* <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  // disabled={!selectedBuybackId || selectedBuybackId === "NONE"}
                  // className="bg-yellow-600 hover:bg-yellow-700"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  size="sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button> */}
                {/* )} */}
              </div>
              {loading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : error ? (
                <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
              ) : data.length === 0 ? (
                <div className="overflow-x-auto" ref={tableRef}>
                  <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <FileX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No records found</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">There are no records available for this criteria.</p>
                  </div>
                </div>
              ) : (
                <DataTableArray key="buyback_table" columns={columns} data={data} showPagination={false} filterColumn="clientId" />
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          form.reset()
        }}
        onSubmit={handleFileUpload}
      />
      {showSessionExpiredModal && <SessionExpiredModal />}
    </DashboardLayout>
  )
}

