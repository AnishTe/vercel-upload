"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Camera, Check, ShieldCheck, Video, XCircle } from "lucide-react"
import { useKYC } from "@/contexts/kyc-context"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const ipvFormSchema = z.object({
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: "You must accept the terms and conditions to proceed.",
  }),
  consentToVideoKYC: z.boolean().refine((value) => value === true, {
    message: "You must consent to video KYC to proceed.",
  }),
})

type IPVFormValues = z.infer<typeof ipvFormSchema>

export default function IPVForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateStepStatus } = useKYC()
  const { toast } = useToast()
  const router = useRouter()

  // Initialize form with saved values if they exist
  const savedValues = typeof window !== "undefined" ? localStorage.getItem("kyc_ipv_form") : null

  const form = useForm<IPVFormValues>({
    resolver: zodResolver(ipvFormSchema),
    defaultValues: savedValues
      ? JSON.parse(savedValues)
      : {
        acceptTerms: false,
        consentToVideoKYC: false,
      },
  })

  async function onSubmit(data: IPVFormValues) {
    setIsSubmitting(true)

    try {
      // Save form data
      localStorage.setItem("kyc_ipv_form", JSON.stringify(data))

      // Simulate Digio API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, you would:
      // 1. Call your backend API to initiate Digio KYC
      // const response = await fetch('/api/kyc/ipv', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // })
      // const { sessionId, redirectUrl } = await response.json()

      // 2. Store the session ID
      // setDigioSessionId(sessionId)

      // 3. Redirect to Digio
      // window.location.href = redirectUrl

      // For demo purposes, we'll just mark the step as completed
      // updateStepStatus("ipv", "completed")

      toast({
        title: "KYC Verification Complete",
        description: "Your KYC verification has been successfully completed.",
        variant: "default",
      })

      // Redirect to completion page instead of staying on the IPV page
      router.push("/kyc/completion")
    } catch (error) {
      console.error("Error submitting IPV form:", error)
      toast({
        title: "Error completing verification",
        description: "There was an error processing your verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">In-Person Verification (IPV)</h2>
        <p className="text-muted-foreground mt-1">Complete your verification with a quick video KYC process</p>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 font-medium">Verification Required</AlertTitle>
        <AlertDescription className="text-green-700">
          As per SEBI regulations, In-Person Verification (IPV) is mandatory to activate your trading account.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Video KYC</CardTitle>
            <CardDescription>Complete verification via video call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Quick 2-minute process</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Verify from anywhere</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Instant account activation</span>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-center w-full">
              <Video className="h-12 w-12 text-primary" />
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What You'll Need</CardTitle>
            <CardDescription>Prepare these items before starting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">Documents</div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">PAN Card (Original)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Aadhar Card (Original)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm">Technical Requirements</div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Working camera and microphone</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Stable internet connection</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 border rounded-md p-4 bg-muted/30">
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I accept the terms and conditions for KYC verification</FormLabel>
                    <FormDescription>
                      I confirm that all information provided is accurate and belongs to me.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consentToVideoKYC"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I consent to video KYC verification</FormLabel>
                    <FormDescription>
                      I agree to participate in a video call for identity verification purposes.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting} size="lg">
              <Camera className="h-4 w-4" />
              {isSubmitting ? "Processing..." : "Start Video KYC"}
            </Button>
            <Button type="button" variant="outline" className="flex items-center gap-2" size="lg">
              Schedule for Later
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
