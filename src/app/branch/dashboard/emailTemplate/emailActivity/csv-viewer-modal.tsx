"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Download, X, TableIcon, FileText, FileX } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CSVViewerModalProps {
    isOpen: boolean
    onClose: () => void
    csvData: string | null
    filename: string
}

export function CSVViewerModal({ isOpen, onClose, csvData, filename }: CSVViewerModalProps) {
    const [parsedData, setParsedData] = useState<string[][]>([])
    const [rawText, setRawText] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (csvData && isOpen) {
            setLoading(true)
            try {
                // Convert base64 to text
                const byteCharacters = atob(csvData)

                // Save raw text for raw view
                setRawText(byteCharacters)

                // Parse CSV for table view
                const lines = byteCharacters.split("\n")
                const result: string[][] = []

                lines.forEach((line, index) => {
                    // Skip empty lines
                    if (!line.trim()) return

                    // Simple CSV parsing - split by comma but respect quotes
                    const row: string[] = []
                    let inQuotes = false
                    let currentValue = ""

                    for (let i = 0; i < line.length; i++) {
                        const char = line[i]

                        if (char === '"') {
                            inQuotes = !inQuotes
                        } else if (char === "," && !inQuotes) {
                            row.push(currentValue)
                            currentValue = ""
                        } else {
                            currentValue += char
                        }
                    }

                    // Don't forget the last value
                    row.push(currentValue)

                    if (row.length > 0) {
                        result.push(row)
                    }
                })

                setParsedData(result)
            } catch (error) {
                console.error("Error processing CSV data:", error)
                setParsedData([])
            } finally {
                setLoading(false)
            }
        }
    }, [csvData, isOpen])

    const handleDownload = () => {
        if (csvData) {
            const byteCharacters = atob(csvData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: "text/csv" })

            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = filename || "document.csv"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl h-[90vh] flex flex-col p-4 md:p-6">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-base md:text-lg font-medium truncate max-w-[70%]">
                        {filename || "CSV Document"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-hidden mt-2">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Tabs defaultValue="raw" className="w-full h-full flex flex-col">
                            <TabsList className="grid w-full max-w-[300px] md:max-w-[400px] grid-cols-2 mx-auto mb-4">
                                <TabsTrigger value="raw" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                                    <FileText className="h-3 w-3 md:h-4 md:w-4" />
                                    <span>CSV Format</span>
                                </TabsTrigger>
                                <TabsTrigger value="table" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                                    <TableIcon className="h-3 w-3 md:h-4 md:w-4" />
                                    <span>Table View</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="raw" className="flex-1 overflow-hidden">
                                <div className="border rounded-md h-full overflow-hidden flex flex-col bg-muted/10">
                                    <div className="p-2 bg-muted/20 border-b flex items-center justify-between">
                                        <span className="text-xs font-medium">Raw CSV Data</span>
                                        <span className="text-xs text-muted-foreground">Scroll to view all content</span>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <pre className="p-2 md:p-4 font-mono text-xs md:text-sm whitespace-pre overflow-x-auto">
                                            {rawText || "No CSV data available"}
                                        </pre>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="table" className="flex-1 overflow-hidden">
                                {parsedData.length > 0 ? (
                                    <div className="border rounded-md h-full overflow-hidden flex flex-col">
                                        <div className="p-2 bg-muted/20 border-b flex items-center justify-between">
                                            <span className="text-xs font-medium">Table View</span>
                                            <span className="text-xs text-muted-foreground">Scroll to view all data</span>
                                        </div>
                                        <div className="flex-1 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {parsedData[0].map((header, index) => (
                                                            <TableHead key={index} className="whitespace-nowrap">
                                                                {header || `Column ${index + 1}`}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {parsedData.slice(1).map((row, rowIndex) => (
                                                        <TableRow key={rowIndex}>
                                                            {row.map((cell, cellIndex) => (
                                                                <TableCell key={cellIndex} className="max-w-[300px] truncate">
                                                                    <span title={cell}>{cell}</span>
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center justify-center p-4 text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20 my-4">
                                            <div className="rounded-full bg-muted p-3 mb-4">
                                                <FileX className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">No data available in CSV file</h3>
                                            <p className="text-muted-foreground mb-4 max-w-md">There are no data available.</p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button onClick={handleDownload} disabled={!csvData} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

