"use client"
import React, { useMemo, useRef, useState } from "react"
import { User, Trash2, Plus, ExternalLink, Eye, Loader2, BadgeIcon as IdCard, Phone, Mail, IdCardIcon, Redo2, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface FamilyMember {
    clientId: string
    clientName: string
    pan?: string
    mobile?: string
    email?: string
    relationship?: string
    status?: string
    [key: string]: any
}

interface FamilyMembersListProps {
    familyMembers: FamilyMember[]
    loading: boolean
    refreshing?: boolean
    onRemove: (familyClientId: string) => Promise<boolean>
    onAddClick: () => void
    onMemberClick?: (member: FamilyMember) => void
}

const orderedKeys = ["clientId", "clientName", "email", "pan", "mobile", "birthDate", "branchCode"]

export function FamilyMembersList({
    familyMembers,
    loading,
    refreshing = false,
    onRemove,
    onAddClick,
    onMemberClick,
}: FamilyMembersListProps) {
    const [confirmRemoveId, setConfirmRemoveId] = React.useState<string | null>(null)
    const [selectedMember, setSelectedMember] = React.useState<FamilyMember | null>(null)
    const [removing, setRemoving] = React.useState(false)
    const [searchText, setSearchText] = useState("");
    const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);

    // Store refs to each member's card
    const memberRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


    const handleConfirmRemove = async () => {
        if (!confirmRemoveId) return

        setRemoving(true)
        const success = await onRemove(confirmRemoveId)
        setRemoving(false)

        if (success) {
            setConfirmRemoveId(null)
        }
    }

    const handleMemberClick = (member: FamilyMember, e: React.MouseEvent) => {
        // Prevent click if clicking on action buttons
        if ((e.target as HTMLElement).closest("button")) {
            return
        }

        if (onMemberClick) {
            onMemberClick(member)
        }
    }

    const handleViewDetails = (member: FamilyMember, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedMember(member)
    }

    // Enhanced Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    // Enhanced Empty state component
    const EmptyState = () => (
        <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No family members found</h3>
            <p className="text-gray-600 mb-8 text-sm sm:text-base max-w-md mx-auto">
                No family member mappings found. You can add members to view holdings, ledger, and reports .
            </p>
            <Button onClick={onAddClick} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Family Member
            </Button>
        </div>
    )

    // Get status color for badges
    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 border-green-200"
            case "inactive":
                return "bg-red-100 text-red-800 border-red-200"
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    // Refreshing overlay
    const RefreshingOverlay = () => (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Refreshing...</span>
            </div>
        </div>
    )

    const formatKey = (key: string) => {
        return key
            .split(/(?=[A-Z])|_/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
    }

    const filteredSuggestions = useMemo(() => {
        if (!searchText.trim()) return [];
        return familyMembers.filter((m) =>
            m.clientName.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, familyMembers]);


    const handleSuggestionClick = (clientId: string) => {
        const element = memberRefs.current[clientId];

        if (element) {
            // 👇 Ensure it's visible even deep inside scrollable area
            element.scrollIntoView({ behavior: "smooth", block: "center" });

            // Apply highlight effect
            setHighlightedClientId(clientId);

            // Remove highlight after 1.5s
            setTimeout(() => setHighlightedClientId(null), 1500);
        }

        // Optional: clear search
        setSearchText("");
    };

    return (
        <>
            <div className="relative">
                {refreshing && <RefreshingOverlay />}

                {loading ? (
                    <LoadingSkeleton />
                ) : familyMembers.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="p-2 sm:p-4">
                        {/* Results header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            {/* Search Input */}
                            <div className="w-full sm:w-1/2 relative">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Search className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search family member..."
                                        className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </div>

                                {/* Suggestions Dropdown */}
                                {filteredSuggestions.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                                        {filteredSuggestions.map((member) => (
                                            <div
                                                key={member.clientId}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleSuggestionClick(member.clientId)}
                                            >
                                                <User className="h-4 w-4 text-blue-500" />
                                                {member.clientName}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Results count */}
                            <div className="text-sm text-gray-600 flex items-center gap-1 pl-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                Showing {familyMembers.length} family member{familyMembers.length !== 1 ? "s" : ""}
                            </div>
                        </div>


                        {/* Members grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                            {familyMembers.map((member) => (
                                <Card
                                    key={member.clientId}
                                    ref={(el) => { memberRefs.current[member.clientId] = el; }}
                                    className={cn(
                                        "group relative hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer hover:scale-[1.02] mt-3",
                                        highlightedClientId === member.clientId && "ring-2 ring-blue-500 ring-offset-2"
                                    )}
                                    onClick={onMemberClick ? (e) => handleMemberClick(member, e) : undefined}
                                >

                                    {/* Click indicator */}
                                    {onMemberClick && (
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                        </div>
                                    )}

                                    <CardContent className="p-6 pb-2">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 truncate text-md sm:text-base">
                                                        {member.clientName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate">Client ID: {member.clientId.toUpperCase()}</p>
                                                </div>
                                            </div>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setConfirmRemoveId(member.clientId)
                                                            }}
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 opacity-100 transition-all duration-200 flex-shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Remove family member</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Member details */}
                                        <div className="space-y-3">
                                            {member.pan && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                                                    <IdCardIcon className="h-4 w-4 flex-shrink-0" />
                                                    {member.pan}
                                                </div>
                                            )}

                                            {/* {member.mobile && (
                                                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 truncate">
                                                    <Phone className="h-4 w-4 flex-shrink-0" />
                                                    {member.mobile}
                                                </div>
                                            )}

                                            {member.email && (
                                                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 truncate">
                                                    <Mail className="h-4 w-4 flex-shrink-0" />
                                                    {member.email}
                                                </div>
                                            )}

                                            {member.status && (
                                                <div className="flex justify-start">
                                                    <Badge variant="outline" className={`text-xs ${getStatusColor(member.status)}`}>
                                                        {member.status}
                                                    </Badge>
                                                </div>
                                            )} */}

                                            {/* View Details Button */}
                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2"
                                                    onClick={(e) => handleViewDetails(member, e)}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View Details
                                                </Button>

                                                <Separator orientation="vertical" className="mr-4 h-6" />

                                                <span
                                                    className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 flex items-center hover:m-2 mx-2"
                                                >
                                                    <Redo2 className="h-3 w-3" />
                                                    Go to Dashboard
                                                </span>

                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Details Dialog - Single dialog outside the loop */}
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto pt-0">
                    <DialogHeader className="space-y-3 sticky top-0 bg-white pb-4 border-b pt-4">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <User className="h-5 w-5 text-blue-600" />
                            {selectedMember?.clientName} - Details
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                            Complete information for this family member
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMember && Object.keys(selectedMember).length > 0 ? (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                                {/* Ordered keys excluding segment */}
                                {orderedKeys
                                    ?.filter((key) => key !== "segment" && selectedMember[key])
                                    .map((key) => (
                                        <div key={key} className="p-4 bg-gray-50 rounded-lg border">
                                            <span className="font-semibold text-gray-900 block mb-2">{formatKey(key)}</span>
                                            <span className="text-sm text-gray-700 break-words">{String(selectedMember[key])}</span>
                                        </div>
                                    ))}

                                {/* Unordered keys except segment */}
                                {Object.entries(selectedMember)
                                    .filter(([key]) => !orderedKeys?.includes(key) && key !== "segment")
                                    .map(([key, value]) => (
                                        <div key={key} className="p-4 bg-gray-50 rounded-lg border">
                                            <span className="font-semibold text-gray-900 block mb-2">{formatKey(key)}</span>
                                            <span className="text-sm text-gray-700 break-words">{String(value)}</span>
                                        </div>
                                    ))}
                            </div>

                            {/* Segment - full width */}
                            {"segment" in selectedMember && selectedMember.segment && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <span className="font-semibold text-blue-900 block mb-2 text-lg">Segment</span>
                                    <span className="text-sm text-blue-800 break-words">{String(selectedMember.segment)}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center p-8 italic">No details available for this member.</div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Enhanced Confirmation Dialog */}
            <AlertDialog open={!!confirmRemoveId} onOpenChange={(open) => !open && setConfirmRemoveId(null)}>
                <AlertDialogContent className="w-[95vw] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Remove Family Member
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Are you sure you want to remove this family member? This action cannot be undone and will:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                <li>Remove their access to family-related information</li>
                                <li>Disconnect them from your family network</li>
                                <li>Remove any shared permissions or access</li>
                            </ul>
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
                                    Removing...
                                </>
                            ) : (
                                "Remove Member"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
