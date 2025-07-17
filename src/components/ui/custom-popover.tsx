"use client"

import type React from "react"

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"

export interface CustomPopoverRef {
    open: () => void
    close: () => void
    updatePosition: (x: number, y: number, side: "left" | "right" | "bottom") => void
    isOpen: () => boolean
}

interface CustomPopoverProps {
    children: React.ReactNode
    className?: string
    onClose?: () => void
}

const CustomPopover = forwardRef<CustomPopoverRef, CustomPopoverProps>(({ children, className = "", onClose }, ref) => {
    // Use refs instead of state to avoid re-renders
    const popoverRef = useRef<HTMLDivElement>(null)
    const isOpenRef = useRef(false)
    const positionRef = useRef({
        x: 0,
        y: 0,
        side: "bottom" as "left" | "right" | "bottom",
    })
    const portalRef = useRef<HTMLDivElement | null>(null)

    // Create portal element on mount
    useEffect(() => {
        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.top = "0"
        div.style.left = "0"
        div.style.zIndex = "9999"
        div.style.pointerEvents = "none" // The div itself doesn't capture events
        document.body.appendChild(div)
        portalRef.current = div

        return () => {
            if (portalRef.current) {
                document.body.removeChild(portalRef.current)
            }
        }
    }, [])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        open: () => {
            isOpenRef.current = true
            renderPopover()
            setupEventListeners()
        },
        close: () => {
            isOpenRef.current = false
            renderPopover()
            removeEventListeners()
            if (onClose) onClose()
        },
        updatePosition: (x, y, side) => {
            positionRef.current = { x, y, side }
            if (isOpenRef.current) {
                renderPopover()
            }
        },
        isOpen: () => isOpenRef.current,
    }))

    // Calculate position styles based on side
    const getPositionStyle = () => {
        const { x, y, side } = positionRef.current
        const styles: React.CSSProperties = {
            position: "fixed",
            zIndex: 50,
            maxHeight: "80vh",
            overflowY: "auto",
        }

        // Get viewport dimensions
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Adjust position based on side
        switch (side) {
            case "left":
                styles.top = Math.min(y, viewportHeight - 100)
                styles.left = Math.max(x - 10, 10)
                styles.transform = "translateX(-100%)"
                break
            case "right":
                styles.top = Math.min(y, viewportHeight - 100)
                styles.left = Math.min(x + 10, viewportWidth - 10)
                break
            default: // bottom
                styles.top = Math.min(y, viewportHeight - 200)

                // Center for mobile, otherwise position relative to click
                if (viewportWidth <= 640) {
                    styles.left = viewportWidth / 2
                    styles.transform = "translateX(-50%)"
                } else {
                    // Ensure popover stays within viewport horizontally
                    const isRightHalf = x > viewportWidth / 2
                    if (isRightHalf) {
                        styles.left = Math.min(x, viewportWidth - 20)
                        styles.transform = "translateX(-90%)"
                    } else {
                        styles.left = Math.max(x, 20)
                        styles.transform = "translateX(-10%)"
                    }
                }
        }

        return styles
    }

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && isOpenRef.current) {
            if (ref && 'current' in ref && ref.current) {
                ref.current.close()
            }
        }
    }

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpenRef.current) {
            if (ref && 'current' in ref && ref.current) {
                ref.current.close()
            }
        }
    }

    // Handle scroll and resize
    const handleScrollOrResize = () => {
        if (isOpenRef.current) {
            if (ref && 'current' in ref && ref.current) {
                ref.current.close()
            }
        }
    }

    // Setup event listeners
    const setupEventListeners = () => {
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
        window.addEventListener("scroll", handleScrollOrResize, { passive: true })
        window.addEventListener("resize", handleScrollOrResize, { passive: true })
    }

    // Remove event listeners
    const removeEventListeners = () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
        window.removeEventListener("scroll", handleScrollOrResize)
        window.removeEventListener("resize", handleScrollOrResize)
    }

    // Render popover content to portal
    const renderPopover = () => {
        if (!portalRef.current) return

        if (isOpenRef.current) {
            const styles = getPositionStyle()
            const styleString = Object.entries(styles)
                .map(([key, value]) => `${key}:${value}`)
                .join(";")

            // Render popover content
            portalRef.current.innerHTML = `
          <div style="${styleString}; pointer-events: auto;">
            <div id="popover-content"></div>
          </div>
        `

            // Get the container and render React content
            const container = portalRef.current.querySelector("#popover-content")
            if (container && popoverRef.current) {
                container.appendChild(popoverRef.current)
            }
        } else {
            // Clear portal content
            portalRef.current.innerHTML = ""
        }
    }

    // Create the popover element but don't render it yet
    return (
        <div
            ref={popoverRef}
            className={`bg-background rounded-md border shadow-md p-4 animate-in fade-in-0 zoom-in-95 ${className}`}
            style={{ display: "none" }} // Initially hidden
        >
            {children}
        </div>
    )
})

CustomPopover.displayName = "CustomPopover"
export default CustomPopover

