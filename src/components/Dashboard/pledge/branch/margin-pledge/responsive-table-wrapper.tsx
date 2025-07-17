"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ResponsiveTableWrapperProps {
    children: React.ReactNode
    className?: string
}

export function ResponsiveTableWrapper({ children, className = "" }: ResponsiveTableWrapperProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const isMobile = useMediaQuery("(max-width: 640px)")

    useEffect(() => {
        if (!wrapperRef.current) return

        const wrapper = wrapperRef.current

        // Add horizontal scrolling indicator on mobile
        const handleScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = wrapper

            // Add shadow to indicate more content to the right
            if (scrollLeft === 0) {
                wrapper.classList.add("shadow-right")
                wrapper.classList.remove("shadow-left")
                wrapper.classList.remove("shadow-both")
            }
            // Add shadow to indicate more content to the left
            else if (scrollLeft + clientWidth >= scrollWidth - 5) {
                wrapper.classList.add("shadow-left")
                wrapper.classList.remove("shadow-right")
                wrapper.classList.remove("shadow-both")
            }
            // Add shadow to both sides
            else {
                wrapper.classList.add("shadow-both")
                wrapper.classList.remove("shadow-left")
                wrapper.classList.remove("shadow-right")
            }
        }

        wrapper.addEventListener("scroll", handleScroll)
        // Initial check
        handleScroll()

        return () => {
            wrapper.removeEventListener("scroll", handleScroll)
        }
    }, [isMobile])

    return (
        <div
            ref={wrapperRef}
            className={`relative overflow-x-auto ${isMobile ? "pb-4" : ""} ${className} 
        shadow-right before:absolute before:right-0 before:top-0 before:bottom-0 before:w-8 
        before:bg-gradient-to-l before:from-background/80 before:to-transparent before:opacity-0 
        before:transition-opacity before:pointer-events-none before:z-10
        after:absolute after:left-0 after:top-0 after:bottom-0 after:w-8 
        after:bg-gradient-to-r after:from-background/80 after:to-transparent after:opacity-0 
        after:transition-opacity after:pointer-events-none after:z-10
        shadow-right:before:opacity-100 shadow-left:after:opacity-100 shadow-both:before:opacity-100 shadow-both:after:opacity-100`}
        >
            {children}
        </div>
    )
}

