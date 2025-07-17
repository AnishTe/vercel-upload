"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { Loader2, MonitorSmartphone } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getActiveSessions, logout } from "@/lib/auth"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { getLocalStorage, removeLocalStorage } from "@/utils/localStorage"

interface Session {
    token: string
    device: string
    loginAt: string
}

interface SignOutModalProps {
    open: boolean
    onClose: () => void
}

const SignOutModal: React.FC<SignOutModalProps> = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)

    const router = useRouter()

    const activeUserId = getLocalStorage("currentClientId")
    const activeUserToken = getLocalStorage(`userToken_${activeUserId}`)

    const fetchActiveSessions = async () => {
        setLoading(true)
        setApiError(null)
        try {
            const response = await getActiveSessions()

            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                onClose()
                setShowSessionExpiredModal(true)
                return
            }

            setSessions(response.data.data)
        } catch (error) {
            setApiError((error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchActiveSessions()
        } else {
            setLoading(false)
            setSessions([])
            setApiError(null)
            setSelectedRows([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (Array.isArray(sessions)) {
            const preSelectedTokens = sessions
                .filter((session) => session.token === activeUserToken)
                .map((session) => session.token)

            setSelectedRows(preSelectedTokens)
        }
    }, [sessions, activeUserToken])

    const handleCheckboxChange = (sessionId: string) => {
        setSelectedRows((prevSelected) =>
            prevSelected.includes(sessionId)
                ? prevSelected.filter((id) => id !== sessionId)
                : [...prevSelected, sessionId]
        )
    }

    const handleLogout = async (tokens: string[]) => {
        setLoading(true)
        setApiError(null)
        try {
            const response = await logout({
                tokens: tokens.map((token) => ({ token })),
            })

            const logoutData = response?.data?.data

            if (!logoutData || !Array.isArray(logoutData)) {
                throw new Error("Invalid API response structure")
            }

            const allSuccessful = logoutData.every(
                (session) => session.message === "logout successful."
            )

            if (allSuccessful) {
                const isCurrentDeviceLoggedOut = tokens.includes(activeUserToken!)

                if (isCurrentDeviceLoggedOut) {
                    const userId = getLocalStorage("currentClientId")
                    if (userId) {
                        removeLocalStorage(`userToken_${userId}`)
                        removeLocalStorage(`userID_${userId}`)
                        removeLocalStorage(`userDetails_${userId}`)
                        removeLocalStorage("currentClientId")
                        removeLocalStorage(`loginType_${userId}`)
                    }

                    toast.success("You have been logged out successfully!")

                    onClose()
                    setTimeout(() => {
                        router.push("/")
                    }, 1000)
                } else {
                    toast.success("Selected sessions have been logged out successfully!")
                    fetchActiveSessions() // Refresh the sessions list
                    onClose()
                }
            } else {
                setApiError("Failed to log out from some devices. Please try again.")
            }
        } catch (error) {
            setApiError(
                (error as Error).message || "Failed to log out. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    const formatDateTime = (dateTime: string) => {
        const options: Intl.DateTimeFormatOptions = {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        }
        const date = new Date(dateTime)
        return date.toLocaleString("en-US", options)
    }

    const extractDeviceName = (deviceString: string): string => {
        if (!deviceString || typeof deviceString !== "string") {
            return "Unknown Device";
        }
        if (deviceString.toLowerCase().includes("postmanruntime")) {
            return "Postman";
        }
        const match = deviceString.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            const details = match[1].split(";")[0].trim();
            return details || "Unknown Device";
        }

        return "Unknown Device";
    };


    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Logout from the Application</DialogTitle>
                        <DialogDescription>
                            Logout from devices that will be selected.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : apiError ? (
                            <p className="text-destructive">{apiError}</p>
                        ) : (
                            <ScrollArea className="h-[500px] rounded-md border p-4">
                                {sessions && sessions.length > 0 ? (
                                    sessions
                                        .slice()
                                        .sort((a, b) => {
                                            const isCurrentDeviceA = a.token === activeUserToken
                                            const isCurrentDeviceB = b.token === activeUserToken

                                            if (isCurrentDeviceA && !isCurrentDeviceB) {
                                                return -1
                                            } else if (!isCurrentDeviceA && isCurrentDeviceB) {
                                                return 1
                                            }

                                            return new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()
                                        })
                                        .map((session) => {
                                            const isCurrentDevice = session.token === activeUserToken

                                            return (
                                                <div
                                                    key={session.token}
                                                    className="mb-4 flex items-center justify-between rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <MonitorSmartphone className="h-6 w-6 text-primary" />
                                                        <div>
                                                            <p className="font-medium">
                                                                {extractDeviceName(session.device)}
                                                                {isCurrentDevice && (
                                                                    <span className="ml-2 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                                                                        CURRENT DEVICE
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Last login: {formatDateTime(session.loginAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Checkbox
                                                        checked={selectedRows.includes(session.token)}
                                                        onCheckedChange={() => handleCheckboxChange(session.token)}
                                                    />
                                                </div>
                                            )
                                        })
                                ) : (
                                    <p className="text-center">No active sessions found.</p>
                                )}
                            </ScrollArea>
                        )}
                    </div>
                    <div className="mt-4 flex justify-between gap-4">
                        <Button
                            onClick={() => handleLogout(selectedRows)}
                            disabled={selectedRows.length === 0 || loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Logout Selected Devices"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleLogout(sessions.map((session) => session.token))}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Logout from All Devices"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {showSessionExpiredModal && <SessionExpiredModal />}
        </>
    )
}

export default SignOutModal
