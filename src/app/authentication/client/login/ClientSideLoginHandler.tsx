/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { odinLogin } from "@/api/auth"

interface ClientSideLoginHandlerProps {
    onSuccessfulLogin: (responseData: any, userId: string) => void
}

export default function ClientSideLoginHandler({ onSuccessfulLogin }: ClientSideLoginHandlerProps) {
    const searchParams = useSearchParams()

    useEffect(() => {
        const userId = searchParams.get("UserId")
        const sessionId = searchParams.get("SessionId")

        if (userId && sessionId) {
            handleSSOLogin(userId, sessionId)
        }
    }, [searchParams])

    const handleSSOLogin = async (userId: string, sessionId: string) => {
        try {
            const response = await odinLogin(userId, sessionId)
            const responseData = response?.data

            if (responseData.status === "success") {
                onSuccessfulLogin(responseData, userId)
            } else {
                throw new Error(responseData.message || "SSO login failed")
            }
        } catch (error) {
            toast.error((error as Error).message || "An error occurred during SSO login")
        }
    }

    return null
}

