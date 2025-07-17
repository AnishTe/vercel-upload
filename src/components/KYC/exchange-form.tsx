"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { BarChart3, ArrowRight, Info } from "lucide-react"
import { useKYC } from "@/contexts/kyc-context"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { E_SignKYC, updateSegmentsKYC } from "@/api/auth"
import Image from "next/image"
import { getLocalStorage } from "@/utils/localStorage"
import { KYCBackButton } from "./kyc-back-button"

// Define the schema for the exchange form
const exchangeFormSchema = z
  .object({
    // NSE options
    nse_cash: z.boolean().default(false),
    nse_fo: z.boolean().default(false),
    nse_currency: z.boolean().default(false),
    nse_mf: z.boolean().default(false),
    nse_slb: z.boolean().default(false),

    // BSE options
    bse_cash: z.boolean().default(false),
    bse_mf: z.boolean().default(false),

    // MCX options
    mcx_futures: z.boolean().default(false),
    mcx_options: z.boolean().default(false),
    mcx_commodity: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // At least one option must be selected
      return Object.values(data).some((value) => value === true)
    },
    {
      message: "Please select at least one exchange option",
      path: ["nse_cash"], // Show error on the first checkbox
    },
  )

type ExchangeFormValues = z.infer<typeof exchangeFormSchema>

export default function ExchangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateStepStatus, navigateToStep, handleStepCompletion, checkTokenValidity } = useKYC()
  const { toast } = useToast()

  const completeProfileSubmission = useCallback(() => {
    // Mark the step as completed
    updateStepStatus("personal-details", "completed")

    // Show success toast
    toast({
      title: "Profile verified successfully",
      description: "Your personal information has been saved.",
      variant: "default",
    })

    // Navigate to next step
    navigateToStep("exchange")

    setIsSubmitting(false)
  }, [updateStepStatus, navigateToStep, toast])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      const kid = params.get("digio_doc_id");

      if (status === "success") {
        completeProfileSubmission(); // call the context here
      } else if (status === "cancel") {
        toast({
          title: "Error",
          description: "KYC process was cancelled.",
          variant: "destructive",
        })
        // Optional: navigate back to retry
      }
    }
  }, [completeProfileSubmission, toast]);

  // Initialize form with saved values if they exist
  let defaultValues: ExchangeFormValues = {
    nse_cash: true,
    nse_fo: false,
    nse_currency: false,
    nse_mf: false,
    nse_slb: false,
    bse_cash: true,
    bse_mf: false,
    mcx_futures: false,
    mcx_options: false,
    mcx_commodity: false,
  }

  // Try to load saved form data
  if (typeof window !== "undefined") {
    try {
      const savedValues = localStorage.getItem("kyc_exchange_form")
      if (savedValues) {
        defaultValues = { ...defaultValues, ...JSON.parse(savedValues) }
      }
    } catch (error) {
      console.error("Error loading saved form data:", error)
    }
  }

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ExchangeFormValues) {
    setIsSubmitting(true)
    const TradingId = sessionStorage.getItem("TradingId") || "";
    const currentPAN = getLocalStorage("kyc_pan");

    try {
      const segmentResponse = await updateSegmentsKYC({
        kycTradingId: TradingId,
        ...data
      })
      if (!checkTokenValidity(segmentResponse?.data?.tokenValidity)) return;

      console.log(segmentResponse);
      console.log(segmentResponse.data.data.status);

      if (segmentResponse.status !== 200 || segmentResponse.data.data.status !== "success") {
        throw new Error("Failed to Submit..")
      }

      console.log(segmentResponse);
      const segmentRes = segmentResponse?.data?.data?.status;

      if (!segmentRes) {
        toast({
          title: "Segment submit failed",
          description: "Failed to save segment details. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Segments details saved",
        description: "Your Segments information has been submitted!.",
      });

      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay 100ms


      const eSignRes = await E_SignKYC({
        pan: currentPAN
      })
      if (!checkTokenValidity(eSignRes?.data?.tokenValidity)) return;

      if (eSignRes.status !== 200) {
        throw new Error("Failed to create eSign")
      }

      console.log(eSignRes);

      if (
        eSignRes.data &&
        eSignRes.data.data &&
        eSignRes.data.data.signing_parties &&
        eSignRes.data.data.signing_parties[0]
      ) {
        const eSignData = eSignRes.data.data

        try {
          // const redirectUrl = encodeURIComponent("http://localhost:3000/kyc/completion")
          const redirectUrl = encodeURIComponent("https://capital.pesb.co.in:5500/kyc/completion.html");

          const baseAuthUrl = `https://ext.digio.in/#/gateway/login/${eSignData?.id}/PESB/${eSignData?.signing_parties[0]?.identifier}?link_approach=true&redirect_url=${redirectUrl}`

          // Open in new tab
          window.location.href = baseAuthUrl

          // Mark as completed after opening the URL
          // Save form data
          handleStepCompletion("exchange", data)

        } catch (error) {
          console.error("Error opening authentication URL:", error)
          setIsSubmitting(false)
          toast({
            title: "Error",
            description: "Failed to open authentication URL. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        throw new Error("Invalid response format from createEsign API")
      }
    } catch (error) {
      console.error("Error submitting exchange form:", error)
      toast({
        title: "Error saving exchange preferences",
        description: "There was an error processing your selections. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 border-b pb-4 mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <BarChart3 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exchange Preferences</h2>
          <p className="text-gray-600 mt-1">Select the exchanges and segments you wish to trade in</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* NSE Card */}
            <Card className="border-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 flex items-center justify-center">
                  <Image src="/NSE.png" alt="NSE Logo" width={32} height={32} className="h-8 w-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nse_cash"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Cash</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nse_fo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">F&O (Futures & Options)</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nse_currency"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Currency Derivative</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nse_mf"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Mutual Funds</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nse_slb"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">SLB (Securities Lending & Borrowing)</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* BSE Card */}
            <Card className="border-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 flex items-center justify-center">
                  <Image src="/BSE.jpg" alt="BSE Logo" width={32} height={32} className="h-8 w-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bse_cash"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Cash</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bse_mf"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Mutual Funds</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* MCX Card */}
            <Card className="border-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 flex items-center justify-center">
                  <Image src="/MCX.jpg" alt="MCX Logo" width={32} height={32} className="h-8 w-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mcx_futures"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Futures</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mcx_options"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Options</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mcx_commodity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Commodity</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error message if no option is selected */}
          {form.formState.errors.nse_cash && (
            <p className="text-sm font-medium text-red-500 mt-2">{form.formState.errors.nse_cash.message}</p>
          )}

          {/* Tariff Details Table */}
          <div className="mt-8 border border-blue-100 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-800">Tariff details for Trading & Demat</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        // Prevent the click from propagating to the form
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="sr-only">Tariff Information</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Standard brokerage rates applicable to all segments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="p-2 border border-blue-300 text-left" rowSpan={2}>
                      Transaction Type
                    </th>
                    <th className="p-2 border border-blue-300 text-center" colSpan={2}>
                      Cash
                    </th>
                    <th className="p-2 border border-blue-300 text-center" colSpan={2}>
                      F&O
                    </th>
                    <th className="p-2 border border-blue-300 text-center" colSpan={2}>
                      Currency
                    </th>
                    <th className="p-2 border border-blue-300 text-center" colSpan={2}>
                      Commodity
                    </th>
                  </tr>
                  <tr className="bg-blue-400 text-white">
                    <th className="p-2 border border-blue-300 text-center">%</th>
                    <th className="p-2 border border-blue-300 text-center">Min</th>
                    <th className="p-2 border border-blue-300 text-center">%</th>
                    <th className="p-2 border border-blue-300 text-center">Min</th>
                    <th className="p-2 border border-blue-300 text-center">%</th>
                    <th className="p-2 border border-blue-300 text-center">Min</th>
                    <th className="p-2 border border-blue-300 text-center">%</th>
                    <th className="p-2 border border-blue-300 text-center">Min</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-blue-50">
                    <td className="p-2 border border-blue-100 font-medium">Intraday</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="p-2 border border-blue-100 font-medium">Delivery</td>
                    <td className="p-2 border border-blue-100 text-center">0.30</td>
                    <td className="p-2 border border-blue-100 text-center">30</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="p-2 border border-blue-100 font-medium">Futures</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20</td>
                  </tr>
                  <tr className="hover:bg-blue-50">
                    <td className="p-2 border border-blue-100 font-medium">Options</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">-</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20/lot</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20/lot</td>
                    <td className="p-2 border border-blue-100 text-center">0.03</td>
                    <td className="p-2 border border-blue-100 text-center">20/lot</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * All charges are subject to GST as applicable. Other statutory charges like STT, Stamp Duty, Exchange
              Transaction Charges, SEBI Turnover Fees, etc. will be levied as per actual.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between items-center"
          >

            <KYCBackButton variant="ghost" />

            <Button
              type="submit"
              className="w-full sm:w-auto transition-all hover:scale-105 font-medium px-8 py-2.5 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  )
}
