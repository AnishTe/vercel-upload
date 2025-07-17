"use client"

import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unauthorized Access</AlertTitle>
                    <AlertDescription>You do not have permission to access this page.</AlertDescription>
                </Alert>
                <div className="text-center">
                    <p className="mb-4 text-muted-foreground">
                        Please return to the previous page or contact support if you believe this is an error.
                    </p>
                    <Button onClick={() => router.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}

