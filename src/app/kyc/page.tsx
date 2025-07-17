"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCompatibleUrl } from "@/utils/url-helpers"

export default function KYCPage() {
  const router = useRouter()

  useEffect(() => {
    const url = getCompatibleUrl("/kyc/signin")
    router.replace(url)
  }, [router])

  return null
}
