"use client"

import { useEffect, useState } from "react"
import { useKYC } from "@/contexts/kyc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Edit, FileText, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function CompletionPage() {
  const [consentChecked, setConsentChecked] = useState(false)
  const [userName, setUserName] = useState("")
  const [isClient, setIsClient] = useState(false)
  const { setCurrentStep, handleDigioReturn, updateStepStatus, state, getSessionId, navigateToStep, getNextStep } = useKYC()

  // // Check if all steps are completed
  // useEffect(() => {
  //   setIsClient(true)

  //   // Check if all steps are completed
  //   const allStepsCompleted =
  //     state.steps.signin === "completed" &&
  //     // state.steps.address === "completed" &&
  //     state.steps.bank === "completed" &&
  //     // state.steps.profile === "completed" &&
  //     state.steps.exchange === "completed" &&
  //     state.steps.ipv === "completed"

  //   if (!allStepsCompleted) {
  //     // Find the first incomplete step
  //     const steps = ["signin", "address", "bank", "profile", "exchange", "ipv"]
  //     for (const step of steps) {
  //       if (state.steps[step as keyof typeof state.steps] !== "completed") {
  //         redirect(`/kyc/${step}`)
  //         break
  //       }
  //     }
  //   }

  //   // Get user name from profile form data
  //   try {
  //     const profileData = localStorage.getItem("kyc_profile_form")
  //     if (profileData) {
  //       const parsed = JSON.parse(profileData)
  //       if (parsed.fullName) {
  //         setUserName(parsed.fullName)
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error loading profile data:", error)
  //   }
  // }, [state, state.steps])

  // // Don't render anything on the server to prevent hydration mismatch
  // if (!isClient) return null

  useEffect(() => {
    setCurrentStep("completion")
  }, [setCurrentStep])

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">KYC Verification Completed!</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {userName ? `Congratulations ${userName}! ` : "Congratulations! "}
          Your KYC verification has been successfully completed. You're just one step away from opening your Demat &
          Trading account.
        </p>
      </motion.div>

      <Card className="border-none shadow-lg mb-8 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="pt-6 px-6 pb-8">
          <div className="text-center mb-6">
            <p className="text-gray-700 font-medium">
              Please note that according to new SEBI Regulations effective Nov 1 2022, you need to eSign your KYC in 2
              parts, Part 1 and Part 2.
            </p>
          </div>

          <div className="flex justify-center items-center gap-4 mb-8 relative">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mb-2 relative z-10">
                <CheckCircle className="h-8 w-8" />
              </div>
              <span className="font-medium text-blue-600">Step 1</span>
            </div>

            <div className="h-1 bg-gray-200 flex-1 relative max-w-[200px]">
              <div className="absolute inset-0 bg-blue-500 w-full"></div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl mb-2 border-2 border-gray-300">
                <span>2</span>
              </div>
              <span className="font-medium text-gray-500">Step 2</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg py-6 font-medium">
              <FileText className="mr-2 h-5 w-5" />
              Continue eSign Part A
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 text-lg py-6 font-medium"
              disabled
            >
              <FileText className="mr-2 h-5 w-5" />
              eSign Part B
            </Button>
          </div>

          <div className="flex items-start gap-2 mb-6">
            <input
              type="checkbox"
              id="consent"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <label htmlFor="consent" className="text-gray-700">
              I hereby give my consent to use my Aadhar/Virtual ID details (as applicable) for the purpose of e-signing
              my account opening form
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="gap-2">
              <Download className="h-5 w-5" />
              Download PDF
            </Button>

            <Button variant="outline" className="gap-2">
              <Edit className="h-5 w-5" />
              If you want to Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">What happens next?</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <span>Our team will review your submitted documents</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <span>You'll receive an email confirmation once your account is activated</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <span>You can start trading within 24-48 hours after completing the eSign process</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Link href="/">
          <Button className="gap-2">
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
