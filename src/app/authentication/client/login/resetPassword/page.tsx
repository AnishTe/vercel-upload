/* eslint-disable @next/next/no-html-link-for-pages */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { forgotPassword, resetPassword } from "@/api/auth"

const initialSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
})

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const otpSchema = initialSchema
    .extend({
        otp: z.string().min(6, "Enter a valid OTP"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                passwordRegex,
                "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(isOtpSent ? otpSchema : initialSchema),
        defaultValues: {
            clientId: "",
            mobile: "",
            otp: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            if (!isOtpSent) {
                const response = await forgotPassword({ clientId: data.clientId, mobile: data.mobile })
                if (response.data.status === "success") {
                    toast.success(response.data.message)
                    setIsOtpSent(true)
                } else {
                    toast.error(response.data.message)
                }
            } else {
                const response = await resetPassword({
                    clientId: data.clientId,
                    otp: data.otp,
                    newPassword: data.newPassword,
                })
                if (response.data.status === "success") {
                    toast.success(response.data.message)
                    setTimeout(() => router.push("/"), 1000)
                } else {
                    toast.error(response.data.message)
                }
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[url('/images/loginClient.jpg')] bg-cover bg-center bg-no-repeat relative">
            {/* <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div> */}
            <div className="w-full max-w-md">
                <div className="container flex h-screen items-center justify-center">
                    <Card className="w-[400px] shadow-xl bg-background/95 backdrop-blur-md border-primary/10 z-10">
                        <CardHeader className="flex flex-col">
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Enter your details to reset your password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Client ID</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your Client ID" autoComplete="off" disabled={isOtpSent} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mobile"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your Mobile Number" autoComplete="off" disabled={isOtpSent} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isOtpSent && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="otp"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>OTP</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter the OTP" autoComplete="off" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>New Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="Enter your new password"
                                                                    autoComplete="new-password"
                                                                    {...field}
                                                                    onFocus={(e) => e.target.setAttribute("autocomplete", "new-password")}
                                                                    data-lpignore="true"
                                                                    data-form-type="other"
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
                                            <FormField
                                                control={form.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirm Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="Confirm your password"
                                                                    autoComplete="off"
                                                                    {...field}
                                                                    onFocus={(e) => e.target.setAttribute("autocomplete", "new-password")}
                                                                    data-lpignore="true"
                                                                    data-form-type="other"
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
                                        </>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading || (isOtpSent && !form.formState.isValid)}>
                                        {loading ? "Processing..." : isOtpSent ? "Reset Password" : "Send OTP"}
                                    </Button>
                                </form>
                            </Form>
                            <div className="mt-4 text-center text-sm">
                                <a href="/" className="text-primary hover:underline">
                                    Back to Login
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

