"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

export default function DigioReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { handleDigioReturn } = useKYC()

  const status = searchParams.get("status")
  const step = searchParams.get("step")
  const sessionId = searchParams.get("sessionId")

  useEffect(() => {
    if (status && step && sessionId) {
      // Process the return from Digio
      handleDigioReturn(step, status === "success" ? "success" : "failure")

      // Redirect after a short delay to show success/failure message
      const timer = setTimeout(() => {
        router.push(`/kyc/${step}`)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      // If no parameters, redirect to KYC home
      router.push("/kyc")
    }
  }, [status, step, sessionId, handleDigioReturn, router])

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
          {status === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-center">Verification Successful</h2>
              <p className="text-muted-foreground text-center mt-2">Your information has been verified successfully.</p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-center">Verification Failed</h2>
              <p className="text-muted-foreground text-center mt-2">
                There was an issue with your verification. Please try again.
              </p>
            </>
          )}

          <Button className="mt-6" onClick={() => router.push(`/kyc/${step}`)}>
            Return to KYC
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
