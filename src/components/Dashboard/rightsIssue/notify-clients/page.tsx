"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { File, FileX, Upload, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ongoingRightsIssue, rightsissueUpload, rightsIssueLog } from "@/api/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import DataTableSkeleton from "@/components/DataTable-Skeleton"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { columns, type RightsIssueLogs } from "./columns"

const DataTableArray = dynamic(() => import("@/components/DataTableArray"), { ssr: false })

interface CompanyOption {
  scrip: string
  isin: string
  value: string
  rightsissueid: string
}

export default function NotifyClients() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RightsIssueLogs[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRightsIssueId, setSelectedRightsIssueId] = useState<string>("")
  const [logsLoading, setLogsLoading] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        const response = await ongoingRightsIssue()

        // Token validation
        const tokenIsValid = validateToken(response)
        if (!tokenIsValid) {
          setShowSessionExpiredModal(true)
          return
        }

        const data = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

        if (data) {
          setCompanies(
            data.map((company: any) => ({
              scrip: company.scrip,
              isin: company.isin,
              value: company.isin,
              rightsissueid: company.rightsissueid || "",
            })),
          )
        }
      } catch (error: any) {
        setError(error.message || "Failed to load companies")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setSelectedFile(null)
  }

  // Handle company selection
  const handleCompanySelect = (value: string) => {
    setSelectedCompany(value)

    if (!value || value === "NONE") {
      toast.error("Please select a company.")
      setData([])
      resetFileInput()
      return
    }

    resetFileInput()

    // Find the selected company and get its rightsissueid
    const selectedCompanyData = companies.find((company) => company.value === value)
    setSelectedRightsIssueId(selectedCompanyData?.rightsissueid || "")
    const rightsissueid = selectedCompanyData?.rightsissueid || ""
    fetchRightsIssueLogs(value, rightsissueid)
  }

  const fetchRightsIssueLogs = useCallback(async (isin: string, rightsissueid: string) => {
    setLogsLoading(true)
    setError(null)
    try {
      const response = await rightsIssueLog({ isin: isin, rightsissueid: rightsissueid.toString() })
      if (!validateToken(response)) {
        setShowSessionExpiredModal(true)
        return
      }

      const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data
      setData(parsedData && Array.isArray(parsedData) && parsedData.length > 0 ? parsedData : [])
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.")
    } finally {
      setLogsLoading(false)
    }
  }, [])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedCompany) {
      toast.error("Please select a company")
      return
    }

    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }

    setLoading(true)
    toast.loading("Uploading file...")

    try {
      const formData = new FormData()
      formData.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              isin: selectedCompany,
              rightsissueid: selectedRightsIssueId.toString(),
            }),
          ],
          { type: "multipart/alternative" },
        ),
      )
      formData.append("file", selectedFile, selectedFile.name)

      await rightsissueUpload(formData)

      toast.dismiss()
      toast.success("File uploaded successfully")
      resetFileInput()

      // Refresh logs after successful upload
      fetchRightsIssueLogs(selectedCompany, selectedRightsIssueId)

      // Close the modal after successful upload
      setIsUploadModalOpen(false)
    } catch (error) {
      toast.dismiss()
      toast.error("Failed to upload file")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    resetFileInput()
    setIsUploadModalOpen(false)
  }

  return (
    <DashboardLayout>
      <Card className="w-full">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between">
            <CardTitle>Notify Clients</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              {/* {selectedCompany && selectedCompany !== "NONE" && (
            <>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 flex items-center mx-auto max-w-full overflow-hidden">
                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <p className="overflow-hidden">
                  <span className="font-semibold">Note:</span> If the WhatsApp Status Reason is Message undeliverable_131026,
                  then for communication, the client needs to send a WhatsApp message with "Hi" to the number:
                  9175125008.
                </p>
              </div>
            </>
          )} */}
              {selectedCompany && selectedCompany !== "NONE" && (
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              )}
            </div>
          </div>


        </CardHeader>
        <CardContent>
          <div className="flex items-center w-full sm:w-auto">
            <Select value={selectedCompany} onValueChange={handleCompanySelect}>
              <SelectTrigger className="w-full sm:w-[300px] bg-white text-black border-gray-300">
                <SelectValue placeholder="Select a Company" className="text-black" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="NONE" className="text-black hover:bg-gray-100">
                  NONE
                </SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.value} value={company.value} className="text-black hover:bg-gray-100">
                    {company.scrip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading && <p>Loading...</p>}
          {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}

          {selectedCompany && selectedCompany !== "NONE" && (
            <>
              {/* <div className="flex space-x-2 w-full xs:w-auto sm:w-auto justify-between xs:justify-end sm:justify-end"> */}
              {/* <h3 className="text-lg font-semibold flex items-center"> */}
              {/* <FileTextIcon className="mr-2 h-4 w-4" />
                  Rights Issue Log */}
              {/* </h3> */}
              {/* <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button> */}
              {/* </div> */}

              {logsLoading ? (
                <DataTableSkeleton columns={4} rows={10} />
              ) : data.length === 0 ? (
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
                <div className="overflow-x-auto">
                  <DataTableArray
                    key="rights_issue_logs"
                    columns={columns}
                    data={data}
                    selectableRows={false}
                    showPagination={false}
                    filterColumn="clientId"
                  />
                </div>
              )}

              {/* Upload File Modal */}
              <Dialog
                open={isUploadModalOpen}
                onOpenChange={(open) => {
                  if (!open) handleModalClose()
                  else setIsUploadModalOpen(true)
                }}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Notify Clients</DialogTitle>
                    <DialogDescription>Please select a file to upload for the rights issue.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <File className="h-6 w-6 text-primary" />
                    </div>

                    <label htmlFor="file-upload" className="block w-full">
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="cursor-pointer mb-3"
                      />
                    </label>

                    {selectedFile && <p className="text-sm font-medium">Selected: {selectedFile.name}</p>}

                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={handleModalClose}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={loading || !selectedFile}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {loading ? "Uploading..." : "Upload File"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      {showSessionExpiredModal && <SessionExpiredModal />}
    </DashboardLayout>
  )
}
