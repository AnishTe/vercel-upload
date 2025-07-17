"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@/contexts/UserContext"
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react"

export default function LoginFallback() {

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-4 text-center">
                <div className="relative w-full h-48">
                    <Image src="/images/SVG/login-error.svg" alt="Login Error Illustration" layout="fill" objectFit="contain" priority />
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-400" />
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Login Temporarily Unavailable</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We're experiencing some issues with the login process. Our
                        team has been notified and is working to resolve this as quickly as possible.
                    </p>
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">What you can do:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 text-left">
                            <li>Try refreshing the page</li>
                            <li>Clear your browser cache and cookies</li>
                            <li>Try again in a few minutes</li>
                        </ul>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <Link href="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Login
                        </Link>

                    </div>
                </div>

                {/* <p className="mt-4 text-xs text-gray-500">
                    If you continue to experience issues, please contact our support team at{" "}
                    <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-500">
                        support@example.com
                    </a>
                </p> */}
            </div>
        </div>
    )
}

