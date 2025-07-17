"use client"

import { useEffect, useState } from "react"

/**
 * Hook to track unsaved form changes and show a confirmation dialog when navigating away
 * @param isDirty Boolean indicating if the form has unsaved changes
 * @param message Custom message to show in the confirmation dialog (browser dependent)
 */
export function useUnsavedChanges(
    isDirty: boolean,
    message = "You have unsaved changes. Are you sure you want to leave this page?",
) {
    // Track if the hook is mounted to avoid memory leaks
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        // Only add the event listener if the form is dirty and we're in the browser
        if (!isDirty || !mounted || typeof window === "undefined") return

        // This function will be called when the user tries to navigate away
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Cancel the event and show confirmation dialog
            e.preventDefault()
            // For modern browsers
            e.returnValue = message
            // For older browsers
            return message
        }

        // Add event listener
        window.addEventListener("beforeunload", handleBeforeUnload)

        // Clean up the event listener when the component unmounts or isDirty changes
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [isDirty, message, mounted])
}
