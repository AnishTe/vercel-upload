"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, UserPlus, Loader2, AlertCircle, Shield, CheckCircle2 } from "lucide-react"
import { SessionExpiredModal, validateToken } from "@/utils/tokenValidation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { addFamilyMemberGetOtp, addFamilyMemberVerifyOtp } from "@/api/auth"
import { getLocalStorage } from "@/utils/localStorage"
import { toast } from "sonner";

interface AddFamilyMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type FormStep = 'details' | 'otp-sent' | 'verify-otp'

export function AddFamilyMemberDialog({ open, onOpenChange, onSuccess }: AddFamilyMemberDialogProps) {
    const [currentStep, setCurrentStep] = useState<FormStep>('details')
    const [formData, setFormData] = useState({
        familyClientId: "",
        pan: "",
        otp: ""
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSessionExpired, setShowSessionExpired] = useState(false)

    const currentClientId = getLocalStorage("currentClientId")

    const resetForm = () => {
        setFormData({
            familyClientId: "",
            pan: "",
            otp: ""
        })
        setError(null)
        setCurrentStep('details')
    }

    const validatePAN = (pan: string): boolean => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
        return panRegex.test(pan.toUpperCase())
    }

    const handleGetOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!formData.familyClientId.trim()) {
            setError("Please enter Family Client ID")
            return
        }

        if (formData.familyClientId.trim().length < 3) {
            setError("Family Client ID must be at least 3 characters long")
            return
        }

        if (!formData.pan.trim()) {
            setError("Please enter PAN")
            return
        }

        if (!validatePAN(formData.pan)) {
            setError("Please enter a valid PAN (e.g., ABCDE1234F)")
            return
        }

        setLoading(true)

        try {
            const response = await addFamilyMemberGetOtp({
                clientId: currentClientId,
                familyClientId: formData.familyClientId.trim(),
                familyClientPan: formData.pan.trim().toUpperCase()
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return
            }

            if (response.status === 200) {
                if (response.data?.data.status) {
                    setCurrentStep('otp-sent')
                    toast.success(response.data?.data.message || "OTP sent successfully");
                } else if (!response.data?.data.status) {
                    const errorMessage = response.data?.data.message || "Failed to send OTP"
                    setError(errorMessage)
                    toast.error(errorMessage);
                }
            }
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred while sending OTP"
            setError(errorMessage)
            toast.error(errorMessage);
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!formData.otp.trim()) {
            setError("Please enter OTP")
            return
        }

        if (formData.otp.trim().length !== 6) {
            setError("OTP must be 6 digits")
            return
        }

        if (!/^\d{6}$/.test(formData.otp.trim())) {
            setError("OTP must contain only numbers")
            return
        }

        setLoading(true)

        try {
            const response = await addFamilyMemberVerifyOtp({
                clientId: currentClientId,
                familyClientId: formData.familyClientId.trim(),
                otp: formData.otp.trim(),
            })

            const isTokenValid = validateToken(response)
            if (!isTokenValid) {
                setShowSessionExpired(true)
                return
            }

            if (response.status === 200) {
                setCurrentStep('verify-otp')
                toast.success(response.data?.data.message || "Family member added successfully");
                setTimeout(() => {
                    resetForm()
                    onOpenChange(false)
                    onSuccess()
                }, 1500)
            } else {
                const errorMessage = response.data?.data.message || "Failed to verify OTP"
                setError(errorMessage)
                toast.error(errorMessage);

            }
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred while verifying OTP"
            setError(errorMessage)
            toast.error(errorMessage);

        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setError(null)
        setLoading(true)

        try {
            const response = await addFamilyMemberGetOtp({
                familyClientId: formData.familyClientId.trim(),
                pan: formData.pan.trim().toUpperCase()
            })

            if (response.status === 200) {
                setFormData(prev => ({ ...prev, otpId: response.data?.otpId || "", otp: "" }))
                toast.success("New OTP sent successfully");
            } else {
                setError(response.data?.message || "Failed to resend OTP")
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while resending OTP")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !loading) {
            resetForm()
        }
        onOpenChange(newOpen)
    }

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError(null)
    }

    const canProceedToOtp = formData.familyClientId.trim().length >= 3 &&
        formData.pan.trim().length === 10 &&
        validatePAN(formData.pan)

    const canVerifyOtp = formData.otp.trim().length === 6 && /^\d{6}$/.test(formData.otp.trim())

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button className="flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Family Member</span>
                        <span className="sm:hidden">Add Member</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] flex flex-col">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            {currentStep === 'verify-otp' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : currentStep === 'otp-sent' ? (
                                <Shield className="h-5 w-5 text-orange-600" />
                            ) : (
                                <UserPlus className="h-5 w-5 text-blue-600" />
                            )}
                            {currentStep === 'verify-otp' ? 'Success!' :
                                currentStep === 'otp-sent' ? 'Verify OTP' : 'Add Family Member'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-inherit-600">
                            {currentStep === 'verify-otp' ?
                                'Family member has been added successfully!' :
                                currentStep === 'otp-sent' ?
                                    'Enter the 6-digit OTP sent to verify and add the family member.' :
                                    'Enter the Family Client ID and PAN to send OTP for verification.'}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6">
                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                                </Alert>
                            )}

                            {currentStep === 'details' && (
                                <form onSubmit={handleGetOtp} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Family Client ID Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="familyClientId" className="text-sm font-medium">
                                                Family Client ID <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="familyClientId"
                                                placeholder="Enter family client ID"
                                                value={formData.familyClientId}
                                                onChange={(e) => updateFormData("familyClientId", e.target.value)}
                                                required
                                                className={error && !formData.familyClientId.trim() ? "border-red-300 focus:border-red-500" : ""}
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-inherit-500">The unique client ID of the family member</p>
                                        </div>

                                        {/* PAN Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="pan" className="text-sm font-medium">
                                                Family Client PAN <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="pan"
                                                placeholder="Enter PAN (e.g., ABCDE1234F)"
                                                value={formData.pan}
                                                onChange={(e) => updateFormData("pan", e.target.value.toUpperCase())}
                                                required
                                                maxLength={10}
                                                className={error && (!formData.pan.trim() || !validatePAN(formData.pan)) ? "border-red-300 focus:border-red-500" : ""}
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-inherit-500">Enter the 10-digit PAN number</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleOpenChange(false)}
                                            className="w-full sm:w-auto"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="w-full sm:w-auto gap-2"
                                            disabled={loading || !canProceedToOtp}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="h-4 w-4" />
                                                    Send OTP
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {currentStep === 'otp-sent' && (
                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* OTP Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-sm font-medium">
                                                Enter OTP <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="otp"
                                                placeholder="Enter 6-digit OTP"
                                                value={formData.otp}
                                                onChange={(e) => updateFormData("otp", e.target.value.replace(/\D/g, ''))}
                                                required
                                                maxLength={6}
                                                className={error && (!formData.otp.trim() || formData.otp.length !== 6) ? "border-red-300 focus:border-red-500" : ""}
                                                disabled={loading}
                                                autoFocus
                                            />
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-inherit-500">Enter the 6-digit OTP sent to your registered mobile</p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="h-auto p-0 text-xs text-blue-600"
                                                    onClick={handleResendOtp}
                                                    disabled={loading}
                                                >
                                                    Resend OTP
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep('details')}
                                            className="w-full sm:w-auto"
                                            disabled={loading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="w-full sm:w-auto gap-2"
                                            disabled={loading || !canVerifyOtp}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4" />
                                                    Verify & Add
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {currentStep === 'verify-otp' && (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">Family Member Added!</h3>
                                    <p className="text-sm text-inherit-600">
                                        The family member has been successfully added to your account.
                                    </p>
                                </div>
                            )}

                            {/* Help Text */}
                            {currentStep === 'details' && (
                                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-200">
                                    <p className="font-medium mb-1">💡 Pro Tip:</p>
                                    <p>Ensure the Family Client ID and PAN belong to a valid user in the system.</p>
                                </div>
                            )}

                            {currentStep === 'otp-sent' && (
                                <div className="bg-orange-50 rounded-lg p-4 text-sm text-orange-800 border border-orange-200">
                                    <p className="font-medium mb-1">🔐 Security Note:</p>
                                    <p>OTP is valid for 10 minutes. Don't share it with anyone.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {showSessionExpired && <SessionExpiredModal />}
        </>
    )
}