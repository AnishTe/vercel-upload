"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Building,
  Upload,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  CreditCard,
  Building2,
  Hash,
  Code,
  Check,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { addClientBankDetailsKYC, getBankDataKYC, pennyDropKYC } from "@/lib/auth"
import { useKYC } from "@/contexts/kyc-context"
import { KYCBackButton } from "./kyc-back-button"
import { motion } from "framer-motion"

const bankSchema = z
  .object({
    bankName: z.string().optional(),
    bankAddress: z.string().optional(),
    accountNumber: z.string().optional(),
    accountType: z.string().optional(),
    micrNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    chequeImage: z.any().optional(),
    isDefault: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const isManualFilled =
        !!data.bankName?.trim() &&
        !!data.bankAddress?.trim() &&
        !!data.accountNumber?.trim() &&
        !!data.accountType?.trim() &&
        !!data.micrNumber?.trim() &&
        !!data.ifscCode?.trim()

      const isChequeUploaded = !!data.chequeImage

      return isManualFilled || isChequeUploaded
    },
    {
      message: "Either all bank details or a cancelled cheque must be provided.",
      path: ["chequeImage"],
    },
  )
  .superRefine((data, ctx) => {
    const isChequeUploaded = !!data.chequeImage
    const shouldValidateFields = !isChequeUploaded

    if (shouldValidateFields) {
      if (!data.bankName?.trim()) {
        ctx.addIssue({
          path: ["bankName"],
          code: z.ZodIssueCode.custom,
          message: "Bank Name is required",
        })
      }
      if (!data.bankAddress?.trim()) {
        ctx.addIssue({
          path: ["bankAddress"],
          code: z.ZodIssueCode.custom,
          message: "Bank Address is required",
        })
      }
      if (!data.accountNumber?.trim()) {
        ctx.addIssue({
          path: ["accountNumber"],
          code: z.ZodIssueCode.custom,
          message: "Account Number is required",
        })
      }
      if (!data.accountType?.trim()) {
        ctx.addIssue({
          path: ["accountType"],
          code: z.ZodIssueCode.custom,
          message: "Account Type is required",
        })
      }
      if (!data.micrNumber?.trim()) {
        ctx.addIssue({
          path: ["micrNumber"],
          code: z.ZodIssueCode.custom,
          message: "MICR is required",
        })
      }
      if (!data.ifscCode?.trim()) {
        ctx.addIssue({
          path: ["ifscCode"],
          code: z.ZodIssueCode.custom,
          message: "IFSC code is required",
        })
      }
    }
  })

type BankData = z.infer<typeof bankSchema>

interface BankFormProps {
  onFormSubmitted?: () => void
}

export default function BankForm({ onFormSubmitted }: BankFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [banks, setBanks] = useState<BankData[]>([])
  const [activeTab, setActiveTab] = useState("bank-0")
  const [chequeFiles, setChequeFiles] = useState<(File | null)[]>([null])
  const [chequePreviews, setChequePreviews] = useState<(string | null)[]>([null])
  const { toast } = useToast()
  const [formInitialized, setFormInitialized] = useState(false)
  const isTabSwitching = useRef(false)
  const navigationAttempted = useRef(false)

  const { handleStepCompletion, checkTokenValidity } = useKYC()

  // Initialize form with default empty bank
  const defaultBank: BankData = useMemo(
    () => ({
      bankName: "",
      bankAddress: "",
      accountNumber: "",
      accountType: "",
      micrNumber: "",
      ifscCode: "",
      chequeImage: undefined,
      isDefault: false,
    }),
    [],
  )

  const form = useForm<BankData>({
    resolver: zodResolver(bankSchema),
    defaultValues: defaultBank,
    mode: "onChange",
  })

  // Enhanced validation function
  const isValidBank = (bank: BankData) => {
    const hasAllFields =
      bank.bankName?.trim() &&
      bank.bankAddress?.trim() &&
      bank.accountNumber?.trim() &&
      bank.accountType?.trim() &&
      bank.micrNumber?.trim() &&
      bank.ifscCode?.trim()

    const hasCheque = !!bank.chequeImage

    return !!(hasAllFields || hasCheque)
  }

  // Check if bank has any data (to determine if it should be included in API calls)
  const hasAnyBankData = (bank: BankData) => {
    return !!(
      bank.bankName?.trim() ||
      bank.bankAddress?.trim() ||
      bank.accountNumber?.trim() ||
      bank.accountType?.trim() ||
      bank.micrNumber?.trim() ||
      bank.ifscCode?.trim() ||
      bank.chequeImage
    )
  }

  // Save current bank data to the banks array with proper isolation
  const saveCurrentBankData = useCallback(() => {
    const currentBankIndex = Number.parseInt(activeTab.split("-")[1])
    if (currentBankIndex >= 0 && currentBankIndex < banks.length) {
      const currentFormData = form.getValues()

      setBanks((prevBanks) => {
        const updatedBanks = [...prevBanks]
        // Create a deep copy to avoid reference issues
        updatedBanks[currentBankIndex] = {
          ...currentFormData,
          // Preserve the default status from the existing bank data
          isDefault: prevBanks[currentBankIndex]?.isDefault || false,
        }

        // Save to localStorage immediately
        try {
          localStorage.setItem("kyc_banks", JSON.stringify(updatedBanks))
        } catch (error) {
          console.error("Error saving to localStorage:", error)
        }

        return updatedBanks
      })
    }
  }, [activeTab, banks.length, form])

  // Enhanced tab change handler with better data isolation
  const handleTabChange = useCallback(
    (newTab: string) => {
      if (isTabSwitching.current) return

      isTabSwitching.current = true

      // Get current form data before switching
      const currentBankIndex = Number.parseInt(activeTab.split("-")[1])
      const newBankIndex = Number.parseInt(newTab.split("-")[1])

      if (currentBankIndex === newBankIndex) {
        isTabSwitching.current = false
        return
      }

      const currentFormData = form.getValues()

      // Save current bank data immediately with proper isolation
      setBanks((prevBanks) => {
        const updatedBanks = [...prevBanks]

        // Save current bank data with preserved default status
        if (currentBankIndex >= 0 && currentBankIndex < updatedBanks.length) {
          updatedBanks[currentBankIndex] = {
            ...currentFormData,
            isDefault: updatedBanks[currentBankIndex]?.isDefault || false,
          }
        }

        // Save to localStorage
        try {
          localStorage.setItem("kyc_banks", JSON.stringify(updatedBanks))
        } catch (error) {
          console.error("Error saving to localStorage:", error)
        }

        // Load new bank data with a delay to ensure state is updated
        setTimeout(() => {
          if (updatedBanks[newBankIndex]) {
            // Create a clean copy of the bank data to avoid reference issues
            const bankToLoad = {
              bankName: updatedBanks[newBankIndex].bankName || "",
              bankAddress: updatedBanks[newBankIndex].bankAddress || "",
              accountNumber: updatedBanks[newBankIndex].accountNumber || "",
              accountType: updatedBanks[newBankIndex].accountType || "",
              micrNumber: updatedBanks[newBankIndex].micrNumber || "",
              ifscCode: updatedBanks[newBankIndex].ifscCode || "",
              chequeImage: updatedBanks[newBankIndex].chequeImage,
              isDefault: updatedBanks[newBankIndex].isDefault || false,
            }

            form.reset(bankToLoad)
          } else {
            form.reset(defaultBank)
          }

          setActiveTab(newTab)
          isTabSwitching.current = false
        }, 100)

        return updatedBanks
      })
    },
    [activeTab, form, defaultBank],
  )

  // Auto-save form data when form values change
  useEffect(() => {
    if (formInitialized && !isTabSwitching.current) {
      const subscription = form.watch((value, { name }) => {
        // Only save if a field actually changed and we're not switching tabs
        if (name && !isTabSwitching.current) {
          const timeoutId = setTimeout(() => {
            if (!isTabSwitching.current) {
              saveCurrentBankData()
            }
          }, 1000)

          return () => clearTimeout(timeoutId)
        }
      })

      return () => {
        if (subscription && typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe()
        }
      }
    }
  }, [form, formInitialized, saveCurrentBankData])

  // Enhanced add bank function
  const addBank = useCallback(() => {
    if (banks.length >= 3) {
      toast({
        title: "Maximum banks reached",
        description: "You can add up to 3 banks only.",
        variant: "destructive",
      })
      return
    }

    // Save current bank data first
    const currentBankIndex = Number.parseInt(activeTab.split("-")[1])
    const currentFormData = form.getValues()

    // Create updated banks array with current data saved
    const updatedCurrentBanks = [...banks]
    if (currentBankIndex >= 0 && currentBankIndex < updatedCurrentBanks.length) {
      updatedCurrentBanks[currentBankIndex] = {
        ...currentFormData,
        isDefault: updatedCurrentBanks[currentBankIndex]?.isDefault || false,
      }
    }

    // Add new bank (never default by default)
    const newBank = {
      ...defaultBank,
      isDefault: false, // New banks are never default
    }
    const finalBanks = [...updatedCurrentBanks, newBank]

    // Update all states
    setBanks(finalBanks)
    setChequePreviews((prev) => [...prev, null])
    setChequeFiles((prev) => [...prev, null])

    // Save to localStorage
    try {
      localStorage.setItem("kyc_banks", JSON.stringify(finalBanks))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }

    // Switch to the new bank tab
    const newTabIndex = finalBanks.length - 1
    setActiveTab(`bank-${newTabIndex}`)

    // Reset form with new bank data after a delay
    setTimeout(() => {
      form.reset(newBank)
    }, 100)

    toast({
      title: "Bank added",
      description: "You can now enter details for the new bank.",
    })
  }, [banks, activeTab, form, defaultBank, toast])

  // Enhanced remove bank function
  const removeBank = (index: number) => {
    // Check if this is the default bank
    if (banks[index].isDefault) {
      toast({
        title: "Cannot remove default bank",
        description: "Please set another bank as default before removing this one.",
        variant: "destructive",
      })
      return
    }

    const updatedBanks = [...banks]
    updatedBanks.splice(index, 1)
    setBanks(updatedBanks)

    // Update cheque previews and files
    const updatedChequePreviews = [...chequePreviews]
    updatedChequePreviews.splice(index, 1)
    setChequePreviews(updatedChequePreviews)

    const updatedChequeFiles = [...chequeFiles]
    updatedChequeFiles.splice(index, 1)
    setChequeFiles(updatedChequeFiles)

    // Switch to the first bank tab if the active tab was removed
    if (activeTab === `bank-${index}` || updatedBanks.length <= index) {
      setActiveTab(`bank-0`)
      if (updatedBanks.length > 0) {
        form.reset(updatedBanks[0])
      }
    }

    // Save to localStorage
    localStorage.setItem("kyc_banks", JSON.stringify(updatedBanks))
    localStorage.setItem("kyc_bank_cheques", JSON.stringify(updatedChequePreviews))

    toast({
      title: "Bank removed",
      description: "The bank has been removed successfully.",
    })
  }

  // Enhanced set default bank function
  const setDefaultBank = useCallback(
    (index: number) => {
      // Save current data first
      const currentBankIndex = Number.parseInt(activeTab.split("-")[1])
      const currentFormData = form.getValues()

      setBanks((prevBanks) => {
        const updatedBanks = [...prevBanks]

        // Save current form data first
        if (currentBankIndex >= 0 && currentBankIndex < updatedBanks.length) {
          updatedBanks[currentBankIndex] = {
            ...currentFormData,
            isDefault: currentBankIndex === index, // Set default status based on the target index
          }
        }

        // Set new default bank - only one bank can be default
        updatedBanks.forEach((bank, i) => {
          bank.isDefault = i === index
        })

        // Save to localStorage
        try {
          localStorage.setItem("kyc_banks", JSON.stringify(updatedBanks))
        } catch (error) {
          console.error("Error saving to localStorage:", error)
        }

        // Update form if the active bank is the one being set as default
        if (currentBankIndex === index) {
          form.setValue("isDefault", true)
        }

        return updatedBanks
      })

      toast({
        title: "Default bank updated",
        description: "This bank will be used as the default for transactions.",
      })
    },
    [activeTab, form, toast],
  )

  const fetchDetails = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const tradingID = sessionStorage.getItem("TradingId");
      const clientID = sessionStorage.getItem("client_id");

      if (!tradingID || !clientID) {
        throw new Error("Missing Trading ID or Client ID");
      }

      const bankResponse = await getBankDataKYC({
        clientId: clientID,
        kycTradingId: tradingID,
      });

      if (!checkTokenValidity(bankResponse?.data?.tokenValidity)) return;

      const bankDataArray = bankResponse?.data?.data?.data;

      let parsedBanks: BankData[] = [];

      if (Array.isArray(bankDataArray) && bankDataArray.length > 0) {
        parsedBanks = bankDataArray.slice(0, 3).map((bank, index) => ({
          bankName: bank.beneficiary_name_with_bank || "",
          bankAddress: bank.bank_address || "",
          accountNumber: bank.account_no || "",
          micrNumber: bank.micr_code || "",
          ifscCode: bank.ifsc_code || "",
          accountType: bank.account_type || "",
          chequeImage: undefined,
          isDefault: bank.default_account === 1,
        }));

        // Ensure at least one is default
        if (!parsedBanks.some((bank) => bank.isDefault)) {
          parsedBanks[0].isDefault = true;
        }

        toast({
          title: "Success",
          description: "Bank details have been prefilled.",
        });
      } else {
        throw new Error("No bank data found from API.");
      }

      // Set parsed or fallback
      setBanks(parsedBanks);
      setChequeFiles(new Array(parsedBanks.length).fill(null));
      setChequePreviews(new Array(parsedBanks.length).fill(null));

      localStorage.setItem("kyc_banks", JSON.stringify(parsedBanks));
      localStorage.setItem("kyc_bank_cheques", JSON.stringify(new Array(parsedBanks.length).fill(null)));

      form.reset(parsedBanks[0]);
      setActiveTab("bank-0");
    } catch (error) {
      console.error("Bank fetch failed:", error);

      // ✅ Safe fallback
      const fallbackBank: BankData = {
        bankName: "",
        bankAddress: "",
        accountNumber: "",
        micrNumber: "",
        ifscCode: "",
        accountType: "",
        chequeImage: undefined,
        isDefault: true,
      };

      setBanks([fallbackBank]);
      setChequeFiles([null]);
      setChequePreviews([null]);
      localStorage.setItem("kyc_banks", JSON.stringify([fallbackBank]));
      localStorage.setItem("kyc_bank_cheques", JSON.stringify([null]));

      form.reset(fallbackBank);
      setActiveTab("bank-0");

      toast({
        title: "Fallback to manual entry",
        description: "Couldn't fetch banks from Digio. You can enter them manually.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [checkTokenValidity, form, toast]);

  // Enhanced form submission with proper validation
  async function onSubmit(data: BankData) {
    // Save current bank data first
    const currentBankIndex = Number.parseInt(activeTab.split("-")[1])
    const updatedBanks = [...banks]
    updatedBanks[currentBankIndex] = {
      ...data,
      isDefault: updatedBanks[currentBankIndex]?.isDefault || false,
    }

    // Validate all banks that have any data
    for (let i = 0; i < updatedBanks.length; i++) {
      const bank = updatedBanks[i]

      // If bank has any data, it must be complete
      if (hasAnyBankData(bank) && !isValidBank(bank)) {
        setActiveTab(`bank-${i}`)

        // Load the incomplete bank data into the form
        setTimeout(() => {
          form.reset(bank)
        }, 100)

        toast({
          title: `Bank ${i + 1} is incomplete`,
          description: "Please complete all required fields or upload a cancelled cheque.",
          variant: "destructive",
        })
        return
      }
    }

    // Filter out completely empty banks
    const banksWithData = updatedBanks.filter(hasAnyBankData)

    if (banksWithData.length === 0) {
      toast({
        title: "No bank details provided",
        description: "Please add at least one bank account.",
        variant: "destructive",
      })
      return
    }

    // Ensure one bank is marked as default
    if (!banksWithData.some((bank) => bank.isDefault)) {
      banksWithData[0].isDefault = true
    }

    setBanks(updatedBanks)
    setShowConfirmDialog(true)
  }

  async function confirmSubmit() {
    const dematId = sessionStorage.getItem("dematId")
    const TradingId = sessionStorage.getItem("TradingId") || ""
    const client_id = sessionStorage.getItem("client_id") || ""
    const rawBoId = sessionStorage.getItem("boId");
    const boId = !rawBoId || rawBoId === "null" ? "" : rawBoId;

    if (!dematId) {
      console.error("Demat ID not found in session storage")
      return
    }

    setIsSubmitting(true)
    setShowConfirmDialog(false)

    try {
      // Filter only valid banks with data
      const validBanks = banks.filter((bank) => hasAnyBankData(bank) && isValidBank(bank))

      if (validBanks.length === 0) {
        throw new Error("No valid banks found.")
      }

      // Bank API Payload - send default only
      const defaultBank = validBanks.find((bank) => bank.isDefault)

      // Safety check
      if (!defaultBank || !defaultBank.accountNumber || !defaultBank.ifscCode) {
        throw new Error("Default bank details are incomplete.")
      }

      // Bank API Payload
      const bankPayload = {
        dematId: dematId.toString(),
        clientId: client_id,
        beneficiaryAccountName: "",
        bankName: defaultBank.bankName,
        bankAddress: defaultBank.bankAddress,
        accountNo: defaultBank.accountNumber,
        accountType: defaultBank.accountType,
        micrCode: defaultBank.micrNumber || "",
        ifscCode: defaultBank.ifscCode,
        defaultAccount: defaultBank.isDefault ? "YES" : "NO",
        accountStatus: "ACTIVE",
        bankCcy: "999001",
        boId: boId
      }

      // Build penny drop promises only for valid banks (max 3)
      const pennyDropPromises = validBanks.slice(0, 3).map((bank) =>
        pennyDropKYC({
          clientId: client_id,
          boId: boId,
          kycTradingId: TradingId,
          beneficiary_account_no: bank.accountNumber,
          beneficiary_ifsc: bank.ifscCode,
          beneficiary_bank_name: bank.bankName,
          beneficiary_bank_address: bank.bankAddress,
          beneficiary_account_type: bank.accountType,
          beneficiary_micr: bank.micrNumber,
          default_account: bank.isDefault ? true : false,
        }),
      )

      // Run addClientBankDetailsKYC + all penny drops in parallel
      const [bankRes, ...pennyResArray] = await Promise.all([
        validBanks.length > 0 ? addClientBankDetailsKYC(bankPayload) : Promise.resolve({ data: [] }),
        ...pennyDropPromises,
      ])

      // Token validity checks
      const allTokenValid = [
        bankRes?.data?.tokenValidity,
        ...pennyResArray.map((res) => res?.data?.tokenValidity),
      ].every(checkTokenValidity)

      if (!allTokenValid) {
        return
      }

      // Validate Responses
      const isBankSuccess = bankRes?.data?.data?.status === true
      const pennyStatuses = pennyResArray.map((res) => res?.data?.data?.status)
      const isPennyDropSuccess = pennyStatuses.every((status) => status === true)

      console.log("Bank Success:", isBankSuccess)
      console.log("Penny Drop Success:", isPennyDropSuccess)

      if (!isBankSuccess || !isPennyDropSuccess) {
        toast({
          title: "Bank verification failed",
          description: !isBankSuccess
            ? "Failed to save some bank details. Please try again."
            : "Bank verification via penny drop failed.",
          variant: "destructive",
        })
        return
      }

      // Success flow
      setTimeout(() => {
        localStorage.setItem("kyc_bank_cheques", JSON.stringify(chequePreviews))
        handleStepCompletion("bank", validBanks, "exchange")
      }, 100)

      toast({
        title: "Bank details saved",
        description: "Your bank information has been verified.",
      })

      if (onFormSubmitted) onFormSubmitted()
    } catch (error) {
      console.error("Error submitting bank form:", error)
      toast({
        title: "Error saving bank details",
        description: "There was an error verifying your bank information. Please try again.",
        variant: "destructive",
      })
      navigationAttempted.current = false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cheque upload for the current bank
  const handleChequeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const currentBankIndex = Number.parseInt(activeTab.split("-")[1])

    // Update cheque files
    const updatedChequeFiles = [...chequeFiles]
    updatedChequeFiles[currentBankIndex] = file
    setChequeFiles(updatedChequeFiles)

    // Set form value
    form.setValue("chequeImage", file, { shouldValidate: true })

    // Create preview for image files
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => {
        const updatedPreviews = [...chequePreviews]
        updatedPreviews[currentBankIndex] = reader.result as string
        setChequePreviews(updatedPreviews)
        localStorage.setItem("kyc_bank_cheques", JSON.stringify(updatedPreviews))
      }
      reader.readAsDataURL(file)
    } else {
      // For PDF, just show a placeholder
      const updatedPreviews = [...chequePreviews]
      updatedPreviews[currentBankIndex] = "pdf"
      setChequePreviews(updatedPreviews)
      localStorage.setItem("kyc_bank_cheques", JSON.stringify(updatedPreviews))
    }

    toast({
      title: "Cheque uploaded",
      description: "Your cancelled cheque has been uploaded successfully.",
    })
  }

  // Handle removing a cheque file
  const removeChequeFile = () => {
    const currentBankIndex = Number.parseInt(activeTab.split("-")[1])

    // Update cheque files and previews
    const updatedChequeFiles = [...chequeFiles]
    updatedChequeFiles[currentBankIndex] = null
    setChequeFiles(updatedChequeFiles)

    const updatedPreviews = [...chequePreviews]
    updatedPreviews[currentBankIndex] = null
    setChequePreviews(updatedPreviews)

    // Update form
    form.setValue("chequeImage", undefined, { shouldValidate: true })

    // Save to localStorage
    localStorage.setItem("kyc_bank_cheques", JSON.stringify(updatedPreviews))
  }

  // Get current bank index
  const getCurrentBankIndex = useCallback(() => Number.parseInt(activeTab.split("-")[1]), [activeTab])

  // Get account type display name
  const getAccountTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      savings: "Saving",
      current: "Current",
      CashCredit_Overdraft: "Cash Credit / Overdraft",
    }
    return types[type] || type
  }

  useEffect(() => {
    if (typeof window !== "undefined" && !formInitialized) {
      fetchDetails(); // let this handle all cases
      setFormInitialized(true);
    }
  }, [formInitialized, fetchDetails]);


  if (!formInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 border-b pb-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full shadow-md">
          <Building className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bank Details</h2>
          <p className="text-gray-600 mt-1">You can add up to 3 bank accounts. One account must be set as default.</p>
        </div>
      </div>

      <div className="w-full rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>
            <span className="font-semibold">Important:</span> For each bank, you must either complete all bank details
            fields OR upload a cancelled cheque.
          </p>
        </div>
      </div>

      {/* Bank tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
        <div className="sticky top-0 z-10 border-b pb-4 pt-4 px-2 shadow-lg backdrop-blur-md bg-white/60 dark:bg-black/40 rounded-xl mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList
              className="grid gap-3 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 shadow-inner transition-all"
              style={{ gridTemplateColumns: `repeat(${banks.length}, minmax(100px, 1fr))` }}
            >
              {banks.map((bank, index) => (
                <TabsTrigger
                  key={`bank-tab-${index}`}
                  value={`bank-${index}`}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-200 
              hover:bg-white hover:shadow-md dark:hover:bg-zinc-700 transition-all duration-200
              data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md`}
                >
                  {bank.isDefault && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-md m-1">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>Bank {index + 1}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {banks.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBank}
                className="flex items-center gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 hover:text-blue-700 transition-colors rounded-md shadow-sm bg-transparent"
              >
                <Plus className="h-4 w-4" /> Add Bank
              </Button>
            )}
          </div>
        </div>

        {banks.map((bank, index) => (
          <TabsContent key={`bank-content-${index}`} value={`bank-${index}`} className="space-y-6">
            <Card className="border-gray-200 rounded-lg overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Bank {index + 1} Details
                    </h3>
                    {bank.isDefault && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" /> Default
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!bank.isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultBank(index)}
                        className="flex items-center gap-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50 transition-colors"
                      >
                        <Star className="h-4 w-4" /> Set as Default
                      </Button>
                    )}

                    {banks.length > 1 && !bank.isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBank(index)}
                        className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 flex flex-row items-center justify-between py-3 px-4 border-b border-gray-200 rounded-md">
                      <h3 className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                        <Check className="h-5 w-5" /> Option 1: Fill Bank Details
                      </h3>
                      <p className="text-sm text-gray-500">Complete all fields below</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem className="space-y-2 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                            <FormLabel className="flex items-center gap-1.5">
                              <Building2 className="h-4 w-4 text-blue-600" /> Bank Name{" "}
                              <span className="text-red-500 font-bold text-lg">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., State Bank of India"
                                {...field}
                                className="border-blue-200 focus:border-blue-400 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankAddress"
                        render={({ field }) => (
                          <FormItem className="space-y-2 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                            <FormLabel className="flex items-center gap-1.5">
                              <Building className="h-4 w-4 text-blue-600" /> Bank Address{" "}
                              <span className="text-red-500 font-bold text-lg">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Branch address"
                                {...field}
                                className="border-blue-200 focus:border-blue-400 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-2 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                            <FormLabel className="flex items-center gap-1.5">
                              <CreditCard className="h-4 w-4 text-blue-600" /> Account Number{" "}
                              <span className="text-red-500 font-bold text-lg">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your account number"
                                {...field}
                                className="border-blue-200 focus:border-blue-400 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="micrNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-2 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                            <FormLabel className="flex items-center gap-1.5">
                              <Hash className="h-4 w-4 text-blue-600" /> MICR Number{" "}
                              <span className="text-red-500 font-bold text-lg">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="9-digit MICR code"
                                {...field}
                                maxLength={9}
                                className="border-blue-200 focus:border-blue-400 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem className="space-y-2 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                          <FormLabel className="flex items-center gap-1.5">
                            <Code className="h-4 w-4 text-blue-600" /> IFSC Code{" "}
                            <span className="text-red-500 font-bold text-lg">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., SBIN0123456"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase()
                                field.onChange(value)
                              }}
                              className="border-blue-200 focus:border-blue-400 transition-colors"
                            />
                          </FormControl>
                          <FormDescription>11-character IFSC code of your bank branch</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem className="space-y-3 transition-all duration-200 hover:shadow-sm rounded-md p-2">
                          <FormLabel className="flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4 text-blue-600" /> Account Type{" "}
                            <span className="text-red-500 font-bold text-lg">*</span>
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border border-blue-100 p-3 hover:bg-blue-50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Saving" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">Savings</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border border-blue-100 p-3 hover:bg-blue-50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Current" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">Current</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border border-blue-100 p-3 hover:bg-blue-50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Cash Credit" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">Cash Credit / Overdraft</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 flex flex-row items-center justify-between py-3 px-4 border-b border-gray-200 rounded-md">
                        <h3 className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                          <Check className="h-5 w-5" /> Option 2: Upload Cancelled Cheque
                        </h3>
                        <p className="text-sm text-gray-500">Upload a cancelled cheque instead of filling the form</p>
                      </div>

                      <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center hover:bg-green-50 transition-colors cursor-pointer relative">
                        {!chequePreviews[getCurrentBankIndex()] ? (
                          <label
                            htmlFor={`cheque-upload-${getCurrentBankIndex()}`}
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="bg-green-100 p-3 rounded-full mb-3">
                              <Upload className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-green-700">Click to upload or drag and drop</p>
                            <p className="text-xs text-green-600 mt-1">JPG, PNG or PDF (max. 5MB)</p>
                            <input
                              id={`cheque-upload-${getCurrentBankIndex()}`}
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleChequeUpload}
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            {chequePreviews[getCurrentBankIndex()] === "pdf" ? (
                              <div className="flex items-center justify-center bg-green-100 rounded p-4">
                                <p className="text-sm font-medium text-green-700">PDF Document</p>
                              </div>
                            ) : (
                              <div className="relative h-48">
                                <Image
                                  src={chequePreviews[getCurrentBankIndex()] || "/placeholder.svg"}
                                  alt="Cheque preview"
                                  className="w-full h-full object-contain rounded"
                                  fill
                                  style={{ objectFit: "contain" }}
                                />
                                <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded"></div>
                              </div>
                            )}
                            <Button
                              type="button"
                              onClick={removeChequeFile}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Upload a cancelled cheque leaf for verification
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-center"
      >
        <KYCBackButton variant="ghost" />
        <Button
          type="button"
          onClick={() => {
            // Save current bank data before validation
            saveCurrentBankData()

            // Small delay to ensure state is updated
            setTimeout(() => {
              // Ensure one bank is marked default among banks with data
              const banksWithData = banks.filter(hasAnyBankData)
              if (banksWithData.length > 0 && !banksWithData.some((bank) => bank.isDefault)) {
                toast({
                  title: "Validation Error",
                  description: "Please set one bank as default.",
                  variant: "destructive",
                })
                return
              }

              form.handleSubmit(onSubmit, (errors) => {
                console.error("Validation errors", errors)
                toast({
                  title: "Validation Error",
                  description: "Some fields are incomplete. Please check and try again.",
                  variant: "destructive",
                })
              })()
            }, 100)
          }}
          className="w-full sm:w-auto px-6 py-2.5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 rounded-md"
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </>
          ) : (
            <div className="flex items-center">
              Save & Continue <ChevronRight className="ml-1 h-5 w-5" />
            </div>
          )}
        </Button>
      </motion.div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" /> Confirm Bank Details
            </DialogTitle>
            <DialogDescription>
              Please verify that your bank details are correct. These details will be used for all financial
              transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6 text-sm max-h-[60vh] overflow-y-auto">
            {banks.filter(hasAnyBankData).map((bank, index) => (
              <div
                key={`confirm-bank-${index}`}
                className={`rounded-lg border p-4 mb-4 ${bank.isDefault ? "border-yellow-200 shadow-md" : "border-gray-200 shadow-sm"
                  }`}
              >
                <div className="border-b pb-2 bg-gradient-to-r rounded-t-md mb-3 px-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" /> Bank {index + 1}
                    </h4>
                    {bank.isDefault && (
                      <span className="inline-flex items-center text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded my-2">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" /> Default
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {chequePreviews[index] && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">Verification Method:</div>
                      <div className="font-medium text-green-600 flex items-center gap-1">
                        <Check className="h-4 w-4" /> Cancelled Cheque
                      </div>
                    </div>
                  )}

                  {bank.bankName && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">Bank Name:</div>
                      <div className="font-medium">{bank.bankName}</div>
                    </div>
                  )}
                  {bank.bankAddress && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">Bank Address:</div>
                      <div className="font-medium">{bank.bankAddress}</div>
                    </div>
                  )}
                  {bank.accountNumber && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">Account Number:</div>
                      <div className="font-medium">
                        {"•".repeat(bank.accountNumber.length - 4) + bank.accountNumber.slice(-4)}
                      </div>
                    </div>
                  )}
                  {bank.micrNumber && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">MICR Number:</div>
                      <div className="font-medium">{bank.micrNumber}</div>
                    </div>
                  )}
                  {bank.ifscCode && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">IFSC Code:</div>
                      <div className="font-medium">{bank.ifscCode}</div>
                    </div>
                  )}
                  {bank.accountType && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500 font-medium">Account Type:</div>
                      <div className="font-medium">{getAccountTypeDisplay(bank.accountType)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Edit Details
            </Button>
            <Button
              onClick={confirmSubmit}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
              disabled={isSubmitting}
            >
              <Check className="mr-2 h-4 w-4" /> Confirm & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
