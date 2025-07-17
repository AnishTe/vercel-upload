"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Dispatch, type SetStateAction, useEffect } from "react"

interface SegmentSelectorProps {
    availableSegments: string[] | undefined
    selectedSegment: string
    setSelectedSegment: Dispatch<SetStateAction<string>>
}

export function SegmentSelector({ availableSegments, selectedSegment, setSelectedSegment }: SegmentSelectorProps) {
    // Auto-select the first segment if available
    useEffect(() => {
        if (availableSegments && availableSegments.length > 0 && !selectedSegment) {
            setSelectedSegment(availableSegments[0])
        }
    }, [availableSegments, selectedSegment, setSelectedSegment])

    return (
        <div className="w-full md:w-auto">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                    {availableSegments?.map((segment: string) => (
                        <SelectItem key={segment} value={segment}>
                            {segment}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
