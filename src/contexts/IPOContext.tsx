"use client"

import { getLocalStorage, removeLocalStorage, setLocalStorage } from "@/utils/localStorage"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface IPOData {
    ipoid?: string
    companyname?: string
    logolink?: string
    brokercode?: string | null
    noofequitysharesbid?: string
    bidprice?: string
    issuesize?: string
    maxlotsize?: string
    issueenddateqibbidders?: string | null
    facevalue?: string | null
    applicationformnoend?: string | null
    listingondate?: string | null
    createdby?: string
    companylogoex?: string
    typeofissue?: string
    syndicatememberstampcode?: string | null
    applicationformdatestart?: string
    companysymbol?: string
    minpricerange?: string
    machineip?: string
    applicationformnostart?: string | null
    applicationformnoendshare?: string | null
    maxpricerange?: string
    applicationformdateend?: string
    cutoffprice?: string
    listingprice?: string | null
    companyAddress?: string
    category?: string
    isin?: string
    applicationformnostartshare?: string | null
    status?: string | null
    categories?: [] | object
    clientDetails?: object
    selectedCategory?: string
}

interface IPOContextType {
    selectedIPO: IPOData | null
    setSelectedIPO: (ipo: IPOData | null) => Promise<void>
    clientDetails: any
    setClientDetailsIPO: (details: any) => void
}

const IPOContext = createContext<IPOContextType | undefined>(undefined)

export function IPOProvider({ children }: { children: ReactNode }) {
    const [selectedIPO, setSelectedIPOState] = useState<IPOData | null>(null)
    const [clientDetails, setClientDetailsIPO] = useState<any>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize state from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined" && !isInitialized) {
            try {
                const storedIPO = getLocalStorage("selectedIPO")
                if (storedIPO) {
                    const parsedIPO = JSON.parse(storedIPO)
                    setSelectedIPOState(parsedIPO)
                }
                setIsInitialized(true)
            } catch (error) {
                console.error("Error loading IPO data from localStorage:", error)
                setIsInitialized(true)
            }
        }
    }, [isInitialized])

    // Create a Promise-based setter for selectedIPO
    const setSelectedIPO = async (ipo: IPOData | null): Promise<void> => {
        return new Promise((resolve) => {
            setSelectedIPOState(ipo)

            // Use setTimeout to ensure state is updated before resolving
            setTimeout(() => {
                if (ipo) {
                    try {
                        // Include clientDetails in the stored object
                        const updatedIPO = { ...ipo, clientDetails }
                        // localStorage.setItem("selectedIPO", JSON.stringify(updatedIPO))
                        setLocalStorage("selectedIPO", JSON.stringify(updatedIPO))
                    } catch (error) {
                        console.error("Error saving IPO data to localStorage:", error)
                    }
                } else {
                    removeLocalStorage("selectedIPO")
                }
                resolve()
            }, 100)
        })
    }

    // Update localStorage when clientDetails changes
    useEffect(() => {
        if (selectedIPO && isInitialized) {
            try {
                const updatedIPO = { ...selectedIPO, clientDetails }
                // localStorage.setItem("selectedIPO", JSON.stringify(updatedIPO))
                setLocalStorage("selectedIPO", JSON.stringify(updatedIPO))
            } catch (error) {
                console.error("Error updating IPO data in localStorage:", error)
            }
        }
    }, [clientDetails, selectedIPO, isInitialized])

    // Debug logging
    // useEffect(() => {
    //     if (process.env.NODE_ENV !== "production") {
    //         console.log("IPOContext state updated:", { selectedIPO, clientDetails })
    //     }
    // }, [selectedIPO, clientDetails])

    return (
        <IPOContext.Provider
            value={{
                selectedIPO,
                setSelectedIPO,
                clientDetails,
                setClientDetailsIPO,
            }}
        >
            {children}
        </IPOContext.Provider>
    )
}

export function useIPO() {
    const context = useContext(IPOContext)
    if (context === undefined) {
        throw new Error("useIPO must be used within an IPOProvider")
    }
    return context
}

