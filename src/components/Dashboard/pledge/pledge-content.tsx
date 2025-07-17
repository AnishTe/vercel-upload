/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { getcdslpledge } from "@/lib/auth"
import { useState, useEffect } from "react"
import { validateToken } from "@/utils/tokenValidation"
import { useSearchParams } from "next/navigation"
import { SessionExpiredModal } from "@/utils/tokenValidation"

export default function PledgeContent() {
    const [showSessionExpired, setShowSessionExpired] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<any[]>([])
    const searchParams = useSearchParams()


    const [formData, setFormData] = useState({
        reqid: '',
        pledgeidentifier: '',
        pledgeresdtls: ''
    });

    useEffect(() => {
        setFormData({
            reqid: searchParams.get("reqid") || '',
            pledgeidentifier: searchParams.get("pledgeidentifier") || '',
            pledgeresdtls: searchParams.get("pledgeresdtls") || ''
        });

    }, [searchParams]);

    const getCDSLResponse = async () => {
        setLoading(true)
        try {
            // const reqid = searchParams.get("reqid")
            // const pledgeidentifier = searchParams.get("pledgeidentifier")
            // const pledgeresdtls = searchParams.get("pledgeresdtls")

            if (!formData.reqid || !formData.pledgeidentifier || !formData.pledgeresdtls) {
                setError("Invalid request parameters")
                setLoading(false)
                return
            }

            const response = await getcdslpledge({
                reqid: formData.reqid,
                pledgeidentifier: formData.pledgeidentifier,
                pledgeresdtls: formData.pledgeresdtls,
            })
            const tokenIsValid = validateToken(response)
            if (!tokenIsValid) {
                setShowSessionExpired(true)
                return
            }

            const parsedData = typeof response.data.data === "string" ? JSON.parse(response.data.data) : response.data.data

            if (parsedData) {
                setData(parsedData)
            } else {
                throw new Error("Failed to fetch EPN Records :(")
            }
        } catch (error: any) {
            setError(error.message || "An error occurred while fetching data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getCDSLResponse()
    }, [searchParams]) // Added searchParams to dependencies

    if (loading) return null // Suspense fallback will handle loading state
    if (error) return <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>

    return (
        <>
            {/* Render your data here */}
            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}

