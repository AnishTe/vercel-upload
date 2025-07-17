"use client"
import { emailBounce } from "@/lib/auth"
import DashboardLayout from "@/components/Dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { X, CheckCircle, XCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function ImportFile() {
    const [file, setFile] = useState<File | null>(null)
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogContent, setDialogContent] = useState({ title: "", message: "", isError: false })
    const [notifyAP, setNotifyAP] = useState(true)

    // Create a ref for the file input
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0])
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!file) {
            // toast.error("Please select a file to upload");
            showDialog("Error", "Please select a file to upload", true)
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file, file.name) // Ensure 'file' matches backend expectation

            const dataObject = {
                sentToAP: notifyAP,
            }
            const jsonString = JSON.stringify(dataObject)
            const jsonBlob = new Blob([jsonString], { type: "application/json" })

            formData.append("data", jsonBlob)

            const response = await emailBounce(formData)

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            if (response?.data?.data?.fileUploadStatus && response?.data?.data?.recordsInsertedStatus) {
                // toast.success(`File uploaded and data inserted successfully! Unique Email Id's from log files: ${response?.data?.data?.uniqueRecipientsCount}`);
                showDialog(
                    "Success",
                    `File uploaded and data inserted successfully! Unique Email Id's from log files: ${response?.data?.data?.uniqueRecipientsCount}`,
                    false,
                )

                // Clear the file input and reset the state
                setFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = "" // Reset the input field
                }
            } else {
                throw new Error(response?.data?.data?.error || "Failed to upload file :(")
            }
        } catch (error) {
            showDialog("Error", "Error uploading file", true)
            // toast.error("Error uploading file");
            console.error("Upload error:", error)
        } finally {
            setIsUploading(false)
        }
    }

    const showDialog = (title: string, message: string, isError: boolean) => {
        setDialogContent({ title, message, isError })
        setDialogOpen(true)
    }

    useEffect(() => {
        if (dialogOpen) {
            const timer = setTimeout(() => {
                setDialogOpen(false)
            }, 5000) // Auto close after 5 seconds

            return () => clearTimeout(timer)
        }
    }, [dialogOpen])

    return (
        <>
            <DashboardLayout>
                <div className="space-y-4">
                    <Card className="w-full shadow-lg">
                        <CardHeader className="">
                            <CardTitle className="text-center">Mail Bounce Import File</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col justify-center items-center gap-8 min-h-[400px]">
                                <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md p-6 rounded-xl">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Input
                                            id="file"
                                            type="file"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                            ref={fileInputRef} // Attach ref to the file input
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="notifyAP"
                                                checked={notifyAP}
                                                onCheckedChange={(checked) => setNotifyAP(checked as boolean)}
                                            />
                                            <Label htmlFor="notifyAP">Notify AP</Label>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full " disabled={!file || isUploading}>
                                        {isUploading ? "Uploading..." : "Submit"}
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {showSessionExpired && <SessionExpiredModal />}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center justify-center mb-4">
                            {dialogContent.isError ? (
                                <XCircle className="h-16 w-16 text-red-500" />
                            ) : (
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            )}
                        </div>
                        <DialogTitle className="text-center text-xl font-semibold">{dialogContent.title}</DialogTitle>

                    </DialogHeader>
                    <DialogDescription className="text-center text-base">{dialogContent.message}</DialogDescription>
                    <DialogFooter>
                        <Button onClick={() => setDialogOpen(false)} className="w-full">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

