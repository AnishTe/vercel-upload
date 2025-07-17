/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { login, sendOtp, loginWithOtp, odinLogin } from "@/lib/auth"
import { getCompatibleUrl } from "@/utils/url-helpers"
import { getLocalStorage, removeLocalStorage, setLocalStorage } from "@/utils/localStorage"

const baseSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
})

const passwordSchema = baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters").nonempty("Password is required"),
})

const otpSchema = baseSchema.extend({
    mobileNumber: z
        .string()
        .min(10, "Mobile number must be 10 digits")
        .max(10, "Mobile number must be 10 digits")
        .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    otp: z.string().optional(),
})

type LoginFormValues = z.infer<typeof passwordSchema> & z.infer<typeof otpSchema>

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [activeTab, setActiveTab] = useState<"password" | "otp">("password")
    const searchParams = useSearchParams()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(activeTab === "password" ? passwordSchema : otpSchema),
        defaultValues: {
            clientId: "",
            password: "",
            mobileNumber: "",
            otp: "",
        },
    })

    const handleLogin = async (data: LoginFormValues) => {
        event?.preventDefault();
        setLoading(true)
        try {
            let response
            if (activeTab === "password") {
                response = await login(data.clientId, data.password)
            } else {
                if (!isOtpSent) {
                    await handleSendOtp(data)
                    return
                }
                response = await loginWithOtp({
                    clientId: data.clientId,
                    otp: data.otp!,
                })
            }

            const responseData = response?.data
            if (responseData.status === "success") {
                handleSuccessfulLogin(responseData, data.clientId)
            } else {
                toast.error(responseData.message)
            }
        } catch (error) {
            toast.error((error as Error).message || "Login failed.")
        } finally {
            setLoading(false)
        }
    }

    const handleSendOtp = async (data: LoginFormValues) => {
        setLoading(true)
        try {
            const response = await sendOtp({
                clientId: data.clientId,
                mobile: data.mobileNumber,
            })
            const responseData = response?.data

            if (responseData.status === "success") {
                toast.success("OTP sent successfully!")
                setIsOtpSent(true)
            } else {
                throw new Error(responseData.message || "Failed to send OTP")
            }
        } catch (error) {
            toast.error((error as Error).message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessfulLogin = (responseData: any, clientId: string) => {
        const userToken = responseData?.token
        if (!userToken) {
            return toast.error("Invalid Token!")
        }
        const userId = clientId

        // Store token and userId
        // localStorage.setItem(`userToken_${userId}`, userToken)
        // localStorage.setItem("currentClientId", userId)
        // localStorage.setItem(`userDetails_${userId}`, JSON.stringify(responseData.userDetails))
        // localStorage.setItem(`loginType_${userId}`, "client")
        setLocalStorage(`userToken_${userId}`, userToken)
        setLocalStorage("currentClientId", userId)
        setLocalStorage(`userDetails_${userId}`, JSON.stringify(responseData.userDetails))
        setLocalStorage(`loginType_${userId}`, "client")

        toast.success(responseData.message || "Login Successful!")

        setTimeout(() => router.push(getCompatibleUrl("/client/dashboard")), 1000)
    }

    useEffect(() => {
        const userId = searchParams.get("UserId")
        const sessionId = searchParams.get("SessionId")

        console.log(userId);
        console.log(sessionId);

        if (userId && sessionId) {
            handleSSOLogin(userId, sessionId)
        } else {
            checkExistingLogin()
        }
    }, [])

    const handleSSOLogin = async (userId: string, sessionId: string) => {
        setLoading(true)
        try {
            const response = await odinLogin(userId, sessionId)
            const responseData = response?.data

            if (responseData.status === "success") {
                handleSuccessfulSSOLogin(responseData, userId)
            } else {
                throw new Error(responseData.message || "SSO login failed")
            }
        } catch (error) {
            toast.error((error as Error).message || "An error occurred during SSO login")
            setLoading(false)
        }
    }

    const checkExistingLogin = () => {
        // const currentClientId = localStorage.getItem("currentClientId")
        // const userToken = currentClientId ? localStorage.getItem(`userToken_${currentClientId}`) : null
        const currentClientId = getLocalStorage("currentClientId")
        const userToken = currentClientId ? getLocalStorage(`userToken_${currentClientId}`) : null

        if (currentClientId && userToken) {
            router.push(getCompatibleUrl("/client/dashboard"))
        }
    }

    const handleSuccessfulSSOLogin = (responseData: any, userId: string) => {
        setLoading(true)

        // const currentClientId = localStorage.getItem("currentClientId")
        const currentClientId = getLocalStorage("currentClientId")

        if (currentClientId && currentClientId !== userId) {
            // Clear existing session completely
            removeLocalStorage(`userToken_${currentClientId}`)
            removeLocalStorage(`userDetails_${currentClientId}`)
            removeLocalStorage(`loginType_${currentClientId}`)
            removeLocalStorage("currentClientId")

            // Force a short delay before setting new login
            setTimeout(() => {
                handleSuccessfulLogin(responseData, userId)
                setLoading(false)
            }, 100)
        } else {
            handleSuccessfulLogin(responseData, userId)
            setLoading(false)
        }
    }

    return (
        <div className="container flex h-screen items-center justify-center ">
            {/* <Suspense fallback={null}>
        <ClientSideLoginHandler onSuccessfulLogin={handleSuccessfulSSOLogin} />
      </Suspense> */}
            <Card className="w-[550px]">
                <CardHeader>
                    <CardTitle>Client Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* <Tabs defaultValue="password" onValueChange={(value) => setActiveTab(value as "password" | "otp")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger> */}
                    {/* <TabsTrigger value="otp">OTP</TabsTrigger> */}
                    {/* </TabsList> */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your Client ID"
                                                {...field}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Tab") {
                                                        e.preventDefault()
                                                        if (activeTab === "password") {
                                                            ; (document.querySelector('input[name="password"]') as HTMLElement)?.focus()
                                                        } else {
                                                            ; (document.querySelector('input[name="mobileNumber"]') as HTMLElement)?.focus()
                                                        }
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* <TabsContent value="password"> */}
                            <FormField
                                control={form.control}
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
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Tab") {
                                                            e.preventDefault()
                                                                ; (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.focus()
                                                        }
                                                    }}
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
                            {/* </TabsContent> */}
                            {/* <TabsContent value="otp">
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your Mobile Number"
                            {...field}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Tab") {
                                e.preventDefault()
                                if (isOtpSent) {
                                  (document.querySelector('input[name="otp"]') as HTMLInputElement)?.focus()
                                } else {
                                  (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.focus()
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isOtpSent && (
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter the OTP"
                              {...field}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Tab") {
                                  e.preventDefault()
                                    ; (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.focus()
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent> */}
                            <Button
                                type="submit"
                                disabled={loading}
                                tabIndex={0}
                                className={`
    w-full text-md font-bold transition-colors
    ${loading ? "cursor-not-allowed opacity-70" : ""}
    bg-primary text-primary-foreground 
    hover:bg-primary/90
    dark:bg-primary dark:hover:bg-primary/80
  `}
                            >
                                {loading
                                    ? "Loading..."
                                    : activeTab === "password"
                                        ? "Sign In"
                                        : isOtpSent
                                            ? "Sign In"
                                            : "Send OTP"}
                            </Button>
                        </form>
                    </Form>
                    {/* </Tabs> */}

                    <div className="mt-4 text-center text-md font-[600]">
                        Don't have an account?
                        <a
                            target="_blank"
                            rel="noreferrer noopener"
                            href="https://ekyc.pesb.co.in/"
                            className="text-primary hover:underline ml-2"
                        >
                            Sign Up
                        </a>
                    </div>

                    <div className="mt-4 text-center text-md ">
                        <a
                            href={getCompatibleUrl("/authentication/client/login/resetPassword")}
                            className="text-primary hover:underline"
                        >
                            Reset Password
                        </a>
                    </div>

                    <div className="mt-4 text-center text-md">
                        <a href={getCompatibleUrl("/guestIPO")} className="text-primary hover:underline">
                            Guest IPO Login
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

