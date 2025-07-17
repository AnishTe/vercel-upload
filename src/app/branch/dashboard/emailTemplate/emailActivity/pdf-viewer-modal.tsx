/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Download, X } from "lucide-react"

interface PDFViewerModalProps {
    isOpen: boolean
    onClose: () => void
    pdfData: string | null
    filename: string
}

export function PDFViewerModal({ isOpen, onClose, pdfData, filename }: PDFViewerModalProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (pdfData && isOpen) {
            setLoading(true)
            try {
                // Convert base64 to blob
                const byteCharacters = atob(pdfData)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: "application/pdf" })

                // Create object URL
                const url = URL.createObjectURL(blob)
                setObjectUrl(url)
            } catch (error) {
                console.error("Error processing PDF data:", error)
            } finally {
                setLoading(false)
            }
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [pdfData, isOpen])

    const handleDownload = () => {
        if (pdfData) {
            const byteCharacters = atob(pdfData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: "application/pdf" })

            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = filename || "document.pdf"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-medium">{filename || "PDF Document"}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : objectUrl ? (
                        <iframe src={objectUrl} className="w-full h-full border rounded-md" title="PDF Viewer" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-red-500">Failed to load PDF</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleDownload} disabled={!pdfData}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

