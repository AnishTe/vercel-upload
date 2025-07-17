"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/UserContext"
import { getCompatibleUrl } from "@/utils/url-helpers"

const REDIRECT_DELAY = 5000

export default function NotFound() {
    const router = useRouter()
    const pathname = usePathname()
    const [timeLeft, setTimeLeft] = useState(REDIRECT_DELAY)
    const { loginType } = useUser()

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer)
                    router.back()
                    return 0
                }
                return prevTime - 10
            })
        }, 10)

        return () => clearInterval(timer)
    }, [loginType, pathname, router])

    const progressValue = ((REDIRECT_DELAY - timeLeft) / REDIRECT_DELAY) * 100

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center flex md:flex-col ">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <FileQuestion className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
                    <CardDescription>We couldn&apos;t find the page you&apos;re looking for.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                        The page you are trying to access might have been removed, had its name changed, or is temporarily
                        unavailable.
                    </p>
                    <p className="text-sm text-muted-foreground mb-2 p-2">
                        Redirecting to home page in {Math.ceil(timeLeft / 1000)} seconds...
                    </p>
                    <Progress value={progressValue} className="w-full" />
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.back()} className="inline-flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return Home
                    </Button>

                </CardFooter>
            </Card>
        </div>
    )
}

