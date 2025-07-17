"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Cookies from "js-cookie"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { branchLogin } from "@/lib/auth"
import { findFirstAvailableUrl } from "@/utils/navigation"
import { useUser } from "@/contexts/UserContext"
// import { getCompatibleUrl } from "@/utils/url-helpers"
import { getLocalStorage, setLocalStorage } from "@/utils/localStorage"

const passwordSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
    password: z.string().min(6, "Password must be at least 6 characters").nonempty("Password is required"),
})

function getCompatibleUrl(path: string, removeQueryParams = false): string {
    const isProduction = process.env.NODE_ENV === "production";

    if (typeof window !== "undefined") {
        const clientId = sessionStorage.getItem("clientId");
        const isBranchCheck = sessionStorage.getItem("branchClientCheck") === "true";
        const isFamilyClientCheck = sessionStorage.getItem("familyClientCheck") === "true";

        const excludedRoutes = ["/authentication/branch/login"];

        const shouldAttachQueryParams =
            clientId &&
            (isBranchCheck || isFamilyClientCheck) &&
            !excludedRoutes.some(route => path.startsWith(route));

        const url = new URL(path, window.location.origin);

        if (removeQueryParams) {
            url.search = "";
        } else if (shouldAttachQueryParams) {
            url.searchParams.set("clientId", clientId);
            if (isBranchCheck) url.searchParams.set("branchClientCheck", "true");
            if (isFamilyClientCheck) url.searchParams.set("familyClientCheck", "true");
        }

        const pathname = isProduction
            ? url.pathname.endsWith(".html")
                ? url.pathname
                : `${url.pathname}.html`
            : url.pathname;

        return `${pathname}${url.search}`;
    }

    // fallback for SSR (rare case)
    return isProduction ? `${path}.html` : path;
}


export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { userAccess, setUserAccess } = useUser()

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            clientId: "",
            password: "",
        },
    })

    const handlePasswordLogin = async (data: z.infer<typeof passwordSchema>) => {
        setLoading(true)
        try {
            const response = await branchLogin(data.clientId, data.password)
            const responseData = response?.data

            if (responseData.status === "success") {
                handleSuccessfulLogin(responseData, data.clientId, "branch")
            } else {
                toast.error(responseData.message)
            }
        } catch (error) {
            toast.error((error as Error).message || "Login failed.")
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessfulLogin = (responseData: any, id: string, loginType: "client" | "branch") => {

        const userData = typeof responseData.userDetails === "string"
            ? JSON.parse(responseData.userDetails) // Convert string to object if needed
            : responseData.userDetails;

        const accessData = typeof responseData.userDetails.access === "string"
            ? JSON.parse(responseData.userDetails.access) // Convert string to object if needed
            : responseData.userDetails.access;

        const userToken = responseData?.token
        if (!userToken) {
            return toast.error("Invalid Token!")
        }
        const userId = id

        toast.success(responseData.message || "Login Successful!")

        // Store token, userId, and loginType
        // localStorage.setItem(`userToken_${userId}`, userToken)
        // localStorage.setItem("currentBranchId", userId)
        // localStorage.setItem(`loginType_${userId}`, loginType)
        // localStorage.setItem(`accountType_${userId}`, responseData?.userDetails?.accountType)
        // localStorage.setItem(`userDetails_${userId}`, JSON.stringify(userData))
        // localStorage.setItem(`userAccessDetails_${userId}`, JSON.stringify(accessData))

        setLocalStorage(`userToken_${userId}`, userToken)
        setLocalStorage("currentBranchId", userId)
        setLocalStorage(`loginType_${userId}`, loginType)
        setLocalStorage(`accountType_${userId}`, responseData?.userDetails?.accountType)
        setLocalStorage(`userDetails_${userId}`, JSON.stringify(userData))
        setLocalStorage(`userAccessDetails_${userId}`, JSON.stringify(accessData))

        // Update user access in context
        setUserAccess(responseData.userDetails.access)

        // Redirect user
        if (responseData?.userDetails?.accountType === "branch") {
            router.push(getCompatibleUrl("/branch/dashboard/viewClientDetails"))
        } else {
            const availableUrl = findFirstAvailableUrl(responseData.userDetails.access)
            if (availableUrl) {
                router.push(availableUrl)
            } else {
                router.push(getCompatibleUrl("/branch/dashboard"))
            }
        }
    }

    useEffect(() => {
        const checkExistingLogin = () => {
            const currentClientId = getLocalStorage("currentBranchId")
            const userToken = currentClientId ? getLocalStorage(`userToken_${currentClientId}`) : null
            const accountType = currentClientId ? getLocalStorage(`accountType_${currentClientId}`) : null
            const userAccessDetails = currentClientId ? getLocalStorage(`userAccessDetails_${currentClientId}`) : null

            if (currentClientId && userToken && accountType === "branch") {
                router.push(getCompatibleUrl("/branch/dashboard/viewClientDetails"))
            } else if (currentClientId && userToken && userAccessDetails) {
                const parsedUserAccess = JSON.parse(userAccessDetails)
                setUserAccess(parsedUserAccess)
                const availableUrl = findFirstAvailableUrl(parsedUserAccess)
                if (availableUrl) {
                    router.push(availableUrl)
                } else {
                    router.push(getCompatibleUrl("/branch/dashboard"))
                }
            }
        }

        checkExistingLogin()
    }, [router, setUserAccess])

    return (
        <div className="flex items-center justify-center bg-background bg-[url('/images/login.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center shadow-md h-screen">
            <div className="w-full max-w-md">
                <div className="container flex h-screen items-center justify-center">
                    <Card className="w-[550px]">
                        <CardHeader>
                            <CardTitle>Branch Sign In</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your Username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter your Password"
                                                            {...field}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2"
                                                            onClick={() => setShowPassword((prev) => !prev)}
                                                        >
                                                            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full text-md font-bold" disabled={loading}>
                                        {loading ? "Signing In..." : "Sign In"}
                                    </Button>
                                    <div className="mt-4 text-center text-md">
                                        <a
                                            href={getCompatibleUrl("/authentication/branch/login/resetPassword")}
                                            className="text-primary hover:underline"
                                        >
                                            Reset Password
                                        </a>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

