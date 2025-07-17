"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, User, RefreshCw, Users, Loader2, AlertCircle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FamilyHead {
    client_id: string
    client_name: string
    phone?: string
    email?: string
    family_size?: number
    joined_date?: string
    [key: string]: any
}

interface FamilyHeadsListProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    familyHeads: FamilyHead[]
    loading: boolean
    error: string | null
    onRefresh: () => void
    onRemove: (familyHeadClientId: string) => Promise<boolean>
}

export function FamilyHeadsList({
    open,
    onOpenChange,
    familyHeads,
    loading,
    error,
    onRefresh,
    onRemove,
}: FamilyHeadsListProps) {
    const [confirmRemoveId, setConfirmRemoveId] = React.useState<string | null>(null)
    const [removing, setRemoving] = React.useState(false)

    const handleConfirmRemove = async () => {
        if (!confirmRemoveId) return

        setRemoving(true)
        const success = await onRemove(confirmRemoveId)
        setRemoving(false)

        if (success) {
            setConfirmRemoveId(null)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return null
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch {
            return dateString
        }
    }

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    )

    const EmptyState = () => (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Family Memberships Found</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
                You are not currently a member of any family. When someone adds you as a family member, those connections will
                appear here.
            </p>
        </div>
    )

    const ErrorState = () => (
        <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-red-600 font-medium mb-2">Failed to Load</div>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </div>
    )

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] flex flex-col">
                    <DialogHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <DialogTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Mapped As Member
                                </DialogTitle>
                                <DialogDescription className="mt-2">
                                    You have been added as a family member under a primary client. Your reports may be accessible to them for viewing individually, based on the permissions configured
                                </DialogDescription>
                            </div>

                            <div className="flex items-center  gap-2 mr-4">
                                {(familyHeads.length > 0 && !error) && (
                                    <Badge variant="secondary" className="text-xs">
                                        {familyHeads.length} families
                                    </Badge>
                                )}
                                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2">
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                    <span className="inline">Refresh</span>
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator />

                    <ScrollArea className="flex-1 pr-2">
                        {loading ? (
                            <LoadingSkeleton />
                        ) : error ? (
                            <ErrorState />
                        ) : familyHeads.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-4">
                                {familyHeads.map((head, index) => (
                                    <div
                                        key={head.client_id}
                                        className="group relative bg-inherit border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="h-6 w-6 text-emerald-600" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-inherit-900 truncate">{head.client_name}</h4>
                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 w-fit">
                                                            Family Head
                                                        </Badge>
                                                    </div>

                                                    <p className="text-xs text-inherit-500 truncate mb-2">Client ID: {head.client_id.toUpperCase()}</p>

                                                    <div className="space-y-1">
                                                        {head.phone && (
                                                            <p className="text-xs text-inherit-600 flex items-center gap-1">
                                                                📞 <span className="truncate">{head.phone}</span>
                                                            </p>
                                                        )}

                                                        {head.email && (
                                                            <p className="text-xs text-inherit-600 flex items-center gap-1 min-w-0">
                                                                ✉️ <span className="truncate">{head.email}</span>
                                                            </p>
                                                        )}

                                                        {head.family_size && (
                                                            <p className="text-xs text-inherit-600 flex items-center gap-1">
                                                                👥 {head.family_size} members
                                                            </p>
                                                        )}

                                                        {head.joined_date && (
                                                            <p className="text-xs text-inherit-500">Joined: {formatDate(head.joined_date)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfirmRemoveId(head.client_id)}
                                                className="text-red-600 hover:bg-red-500 transition-all duration-200 flex-shrink-0"
                                                title="Leave this family"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Member index indicator */}
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer with summary */}
                    {familyHeads.length > 0 && !error && (
                        <>
                            <Separator />
                            <div className="text-xs text-gray-500 text-center py-2">
                                You are a member of {familyHeads.length} famil{familyHeads.length === 1 ? "y" : "ies"}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Enhanced Confirmation Dialog */}
            <AlertDialog open={!!confirmRemoveId} onOpenChange={(open) => !open && setConfirmRemoveId(null)}>
                <AlertDialogContent className="w-[95vw] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Leave Family
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Are you sure you want to remove yourself from this family? This action will:
                            <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                                <li>Remove your access to this family's information</li>
                                <li>Disconnect you from their family network</li>
                                <li>Remove any shared permissions or benefits</li>
                                <li>Require re-invitation to rejoin</li>
                            </ul>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-sm text-amber-800">
                                    <strong>Note:</strong> You cannot undo this action. You'll need to be re-invited by the family head to
                                    rejoin.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel disabled={removing} className="w-full sm:w-auto">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRemove}
                            disabled={removing}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 w-full sm:w-auto"
                        >
                            {removing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Leaving...
                                </>
                            ) : (
                                "Leave Family"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
