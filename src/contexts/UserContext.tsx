"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"
import { getLocalStorage } from "@/utils/localStorage"

type UserContextType = {
    currentUser: string
    loginType: string
    accountType: string
    userAccess: any // Replace 'any' with a more specific type if possible
    userDetails: any // Replace 'any' with a more specific type if possible
    setUserAccess: (access: any) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState("")
    const [loginType, setLoginType] = useState("")
    const [accountType, setAccountType] = useState("")
    const [userAccess, setUserAccess] = useState(null)
    const [userDetails, setUserDetails] = useState(null)
    const pathname = usePathname()

    useEffect(() => {
        const updateUserDetails = () => {
            let newCurrentUser = ""
            let newLoginType = ""

            if (pathname.startsWith("/client")) {
                newCurrentUser = getLocalStorage("currentClientId") || ""
                newLoginType = "Client"
            } else if (pathname.startsWith("/branch")) {
                newCurrentUser = getLocalStorage("currentBranchId") || ""
                newLoginType = "Branch"
            }

            setCurrentUser(newCurrentUser)
            setLoginType(newLoginType)

            if (newCurrentUser) {
                setAccountType(getLocalStorage(`accountType_${newCurrentUser}`) || "")

                const userAccessDetailsKey = `userAccessDetails_${newCurrentUser}`
                const userAccessDetails = getLocalStorage(userAccessDetailsKey)
                if (userAccessDetails && newLoginType !== "client") {
                    try {
                        setUserAccess(JSON.parse(userAccessDetails))
                    } catch (error) {
                        console.error("Failed to parse user details from cookie:", error)
                    }
                }
                const userDetailsDetailsKey = `userDetails_${newCurrentUser}`
                const userDetailsDetails = getLocalStorage(userDetailsDetailsKey)
                if (userDetailsDetails && newLoginType !== "client") {
                    try {
                        setUserDetails(JSON.parse(userDetailsDetails))
                    } catch (error) {
                        console.error("Failed to parse user details from cookie:", error)
                    }
                }
            }
        }

        updateUserDetails()
    }, [pathname])

    return (
        <UserContext.Provider value={{ currentUser, loginType, accountType, userAccess, userDetails, setUserAccess }}>{children}</UserContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}

