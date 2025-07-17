// import { X } from "lucide-react";
// import { forwardRef, useImperativeHandle, useRef } from "react";
// import { Button } from "@/components/ui/button";

// interface CustomDialogProps {
//     title?: string;
//     children: React.ReactNode;
//     onClose: () => void;
//     onConfirm?: () => void;
//     confirmText?: string;
//     confirmLoading?: boolean;
// }

// export interface CustomDialogRef {
//     open: () => void;
//     close: () => void;
// }

// const CustomDialog = forwardRef<CustomDialogRef, CustomDialogProps>(
//     ({ title, children, onClose, onConfirm, confirmText = "Submit", confirmLoading }, ref) => {
//         const CustomDialogRef = useRef<HTMLDialogElement>(null);

//         useImperativeHandle(ref, () => ({
//             open: () => CustomDialogRef.current?.showModal(),
//             close: () => CustomDialogRef.current?.close(),
//         }));

//         return (
//             <dialog
//                 ref={CustomDialogRef}
//                 className="rounded-md p-4 shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm transition-all duration-200"
//                 onClick={(e) => {
//                     if (e.target === CustomDialogRef.current) onClose();
//                 }}
//             >
//                 <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-2xl transition-all duration-300">
//                     {/* CustomDialog Header */}
//                     <div className="flex items-start justify-between">
//                         <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
//                         <button
//                             onClick={onClose}
//                             className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
//                         >
//                             <X className="h-5 w-5" />
//                             <span className="sr-only">Close</span>
//                         </button>
//                     </div>

//                     {/* CustomDialog Body */}
//                     <div className="py-4 text-sm text-muted-foreground">{children}</div>

//                     {/* CustomDialog Footer */}
//                     <div className="flex justify-end space-x-2">
//                         <Button variant="destructive" onClick={onClose}>Cancel</Button>
//                         {onConfirm && (
//                             <Button variant="outline" onClick={onConfirm} disabled={confirmLoading}>
//                                 {confirmLoading ? "Submitting..." : confirmText}
//                             </Button>
//                         )}
//                     </div>
//                 </div>
//             </dialog>
//         );
//     }
// );

// CustomDialog.displayName = "CustomDialog";
// export default CustomDialog;
"use client"

import type React from "react"

import { forwardRef, useImperativeHandle, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Define Ref Type
export interface CustomDialogRef {
    open: () => void
    close: () => void
}

// Define Props
interface CustomDialogProps {
    title: string
    children: React.ReactNode
    onConfirm?: () => void
    confirmText?: string
    confirmLoading?: boolean
    maxContentHeight?: string // Allow custom max height
}

const CustomDialog = forwardRef<CustomDialogRef, CustomDialogProps>(
    (
        {
            title,
            children,
            onConfirm,
            confirmText = "Submit",
            confirmLoading,
            maxContentHeight = "60vh", // Default max height
        },
        ref,
    ) => {
        const [open, setOpen] = useState(false)

        useImperativeHandle(ref, () => ({
            open: () => setOpen(true),
            close: () => setOpen(false),
        }))

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex flex-col max-w-md w-full md:max-w-lg lg:max-w-xl mx-auto">
                    {/* Header with properly positioned close button */}
                    <DialogHeader className="relative border-b pb-2">
                        <DialogTitle className="pr-8">{title}</DialogTitle>
                        {/* <Button
                            onClick={() => setOpen(false)}
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 rounded-full h-8 w-8 p-0"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button> */}
                    </DialogHeader>

                    {/* Scrollable content area */}
                    <div
                        className="py-4 text-sm text-muted-foreground overflow-y-auto"
                        style={{
                            maxHeight: maxContentHeight,
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
                        }}
                    >
                        {children}
                    </div>

                    {/* Footer with action buttons */}
                    <DialogFooter className="flex justify-end space-x-2 border-t pt-2 mt-auto">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {onConfirm && (
                            <Button onClick={onConfirm} disabled={confirmLoading}>
                                {confirmLoading ? "Submitting..." : confirmText}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    },
)

CustomDialog.displayName = "CustomDialog"
export default CustomDialog

