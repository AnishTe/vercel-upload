"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Cookies from "js-cookie"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { logout } from "@/api/auth"
import { getLocalStorage, removeLocalStorage } from "@/utils/localStorage"
import { getCompatibleUrl } from "@/utils/url-helpers"

interface BranchSignOutModalProps {
    open: boolean
    onClose: () => void
}

const BranchSignOutModal: React.FC<BranchSignOutModalProps> = ({ open, onClose }) => {
    const router = useRouter()

    const handleLogout = async () => {
        // try {
        //     const response = await logout() // Assuming the logout function can handle an empty array
        //     const logoutData = response?.data?.data
        //     if (!logoutData || !Array.isArray(logoutData)) {
        //         throw new Error("Invalid API response structure")
        //     }

        //     const userId = localStorage.getItem("currentClientId")
        //     if (userId) {
        //         removeLocalStorage(`userToken_${userId}`)
        //         removeLocalStorage(`userID_${userId}`)
        //         removeLocalStorage(`userDetails_${userId}`)
        //         removeLocalStorage(`userAccessDetails_${userId}`)
        //         removeLocalStorage("currentClientId")
        //         removeLocalStorage("accountType")
        //         removeLocalStorage("loginType")
        //         removeLocalStorage("loginType")
        //     }

        //     toast.success("You have been logged out successfully!")
        //     onClose()
        //     setTimeout(() => {
        //         router.push("/")
        //     }, 1000)
        // } catch (error) {
        //     toast.error("Failed to log out. Please try again.")
        // }

        // const userId = localStorage.getItem("currentBranchId")
        const userId = getLocalStorage("currentBranchId")
        if (userId) {
            removeLocalStorage(userId)
            removeLocalStorage(`userToken_${userId}`)
            removeLocalStorage(`userID_${userId}`)
            removeLocalStorage(`userDetails_${userId}`)
            removeLocalStorage(`userAccessDetails_${userId}`)
            removeLocalStorage("currentBranchId")
            removeLocalStorage(`accountType_${userId}`)
            removeLocalStorage(`loginType_${userId}`)
        }

        toast.success("You have been logged out successfully!")
        onClose()
        setTimeout(() => {
            router.push(getCompatibleUrl("/authentication/branch/login"))
        }, 1000)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Logout from the Application</DialogTitle>
                    <DialogDescription>Will be Logout from the current Application</DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex justify-between gap-4">
                    <Button onClick={handleLogout} className="flex-1">
                        Logout
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default BranchSignOutModal

