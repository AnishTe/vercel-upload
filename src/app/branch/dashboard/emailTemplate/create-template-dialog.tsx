"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AccountType {
    id: string
    name: string
}

interface CreateTemplateDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (templateData: { name: string; subject: string; message: string; accountType: string }) => Promise<void>
    accountTypes: AccountType[]
    defaultAccountType?: string
}

export function CreateTemplateDialog({
    isOpen,
    onClose,
    onSubmit,
    accountTypes,
    defaultAccountType,
}: CreateTemplateDialogProps) {
    const [name, setName] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [accountType, setAccountType] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Set default account type when dialog opens or defaultAccountType changes
    useEffect(() => {
        if (defaultAccountType && isOpen) {
            setAccountType(defaultAccountType)
        }
    }, [defaultAccountType, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountType) {
            toast.error("Account Type is required")
            return
        }
        if (!name || !subject || !message) {
            toast.error("All fields are required")
            return
        }
        setIsSubmitting(true)
        try {
            await onSubmit({ name, subject, message, accountType })
            setName("")
            setSubject("")
            setMessage("")
            setAccountType("")
            onClose()
        } catch (error) {
            console.error("Error creating template:", error)
            toast.error("Failed to create template")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setName("")
        setSubject("")
        setMessage("")
        setAccountType("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Email Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="account-type">Account Type *</Label>
                            <Select value={accountType} onValueChange={setAccountType}>
                                <SelectTrigger id="account-type">
                                    <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accountTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter template name"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter email message"
                                rows={5}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
