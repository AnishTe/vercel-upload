"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function CustomModal({ isOpen, onClose, title, children }: CustomModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden"

            // Focus the modal
            modalRef.current?.focus()
        } else {
            // Restore body scroll when modal is closed
            document.body.style.overflow = ""
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => {
                // Close modal when clicking on backdrop
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-[100vw] sm:max-w-[600px] p-6 m-4 max-h-[90vh] overflow-y-auto"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>

                {/* Content */}
                <div className="text-gray-700 dark:text-gray-300">{children}</div>

                {/* Footer */}
                <div className="flex justify-end mt-6">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )

    // Use portal to render outside of current DOM tree
    return createPortal(modalContent, document.body)
}
