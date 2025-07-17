"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command"
import { FormControl } from "@/components/ui/form"
import type { JSX } from "react"

interface FlatOption {
    value: string
    text: string
}

interface GroupedOptions {
    label: string
    options: FlatOption[]
}

type Option = string | FlatOption

type SearchableSelectProps = {
    field: {
        value: string | number
        onChange: (value: string) => void
    }
    options: (Option | GroupedOptions)[]
    placeholder?: string
    disabled?: boolean
}

// Fuzzy search function
const fuzzySearch = (searchTerm: string, targetString: string): boolean => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    const target = targetString.toLowerCase()

    // Direct substring match (highest priority)
    if (target.includes(search)) return true

    // Fuzzy match - check if all characters of search term exist in order
    let searchIndex = 0
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
        if (target[i] === search[searchIndex]) {
            searchIndex++
        }
    }

    return searchIndex === search.length
}

// Function to highlight matching text
const highlightText = (text: string, searchTerm: string): JSX.Element => {
    if (!searchTerm) return <span>{text}</span>

    const search = searchTerm.toLowerCase()
    const target = text.toLowerCase()

    // Find direct substring matches for highlighting
    const index = target.indexOf(search)
    if (index !== -1) {
        const before = text.substring(0, index)
        const match = text.substring(index, index + search.length)
        const after = text.substring(index + search.length)

        return (
            <span>
                {before}
                <span className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{match}</span>
                {after}
            </span>
        )
    }

    // For fuzzy matches, highlight individual characters
    const result: JSX.Element[] = []
    let searchIndex = 0
    const searchLower = search.toLowerCase()

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const isMatch = searchIndex < searchLower.length && char.toLowerCase() === searchLower[searchIndex]

        if (isMatch) {
            result.push(
                <span key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
                    {char}
                </span>,
            )
            searchIndex++
        } else {
            result.push(<span key={i}>{char}</span>)
        }
    }

    return <span>{result}</span>
}

export const SearchableSelect = ({
    field,
    options,
    placeholder = "Select an option",
    disabled = false,
}: SearchableSelectProps) => {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const isGrouped = (option: any): option is GroupedOptions => {
        return typeof option === "object" && "label" in option && Array.isArray(option.options)
    }

    const isFlatOption = (opt: any): opt is FlatOption => {
        return typeof opt === "object" && "value" in opt && "text" in opt
    }

    const normalizeFlatOption = (opt: Option): FlatOption => {
        return typeof opt === "string" ? { value: opt, text: opt } : opt
    }

    // Enhanced filtering with fuzzy search
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options

        return options
            .map((opt) => {
                if (isGrouped(opt)) {
                    const filteredGroupOptions = opt.options.filter((option) => {
                        const searchableText = `${option.value} ${option.text} ${opt.label}`
                        return fuzzySearch(searchTerm, searchableText)
                    })

                    // Only return the group if it has matching options or the group label matches
                    if (filteredGroupOptions.length > 0 || fuzzySearch(searchTerm, opt.label)) {
                        return {
                            ...opt,
                            options: filteredGroupOptions.length > 0 ? filteredGroupOptions : opt.options,
                        }
                    }
                    return null
                } else {
                    const normalized = normalizeFlatOption(opt as Option)
                    const searchableText = `${normalized.value} ${normalized.text}`
                    return fuzzySearch(searchTerm, searchableText) ? opt : null
                }
            })
            .filter(Boolean) as (Option | GroupedOptions)[]
    }, [options, searchTerm])

    const getSelectedOption = () => {
        for (const opt of options) {
            if (isGrouped(opt)) {
                const match = opt.options.find((o) => o.value === field.value)
                if (match) return { ...match, groupLabel: opt.label }
            } else {
                const normalized = normalizeFlatOption(opt as Option)
                if (normalized.value === field.value) return { ...normalized, groupLabel: null }
            }
        }
        return null
    }

    const selectedOption = getSelectedOption()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full max-w-full truncate text-left justify-between"
                        disabled={disabled}
                    >
                        {selectedOption ? (
                            <div
                                className="flex flex-row items-center justify-start w-full gap-2 truncate"
                                title={`${selectedOption.groupLabel ? `${selectedOption.groupLabel} - ` : ""}${selectedOption.text}`}
                            >
                                {selectedOption.groupLabel && (
                                    <span className="text-muted-foreground text-xs font-medium truncate">
                                        {selectedOption.groupLabel}
                                    </span>
                                )}
                                <span className="font-bold text-sm truncate max-w-[40%]">{selectedOption.value}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[55%]">{selectedOption.text}</span>
                            </div>
                        ) : (
                            <span className="truncate">{placeholder}</span>
                        )}
                    </Button>
                </FormControl>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="p-0 w-full max-w-[100%] sm:max-w-md"
                style={{ width: "var(--radix-popover-trigger-width)" }}
            >
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search..." className="h-9" value={searchTerm} onValueChange={setSearchTerm} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        {filteredOptions.map((opt, index) => {
                            if (isGrouped(opt)) {
                                return (
                                    <CommandGroup key={opt.label} heading={highlightText(opt.label, searchTerm)}>
                                        {opt.options.map((option) => {
                                            const isSelected = option.value === field.value
                                            return (
                                                <CommandItem
                                                    key={option.value}
                                                    value={`${option.value}-${index}`}
                                                    onSelect={() => {
                                                        field.onChange(option.value)
                                                        setOpen(false)
                                                        setSearchTerm("")
                                                    }}
                                                    aria-selected={isSelected}
                                                    className={isSelected ? "bg-muted text-primary" : ""}
                                                >
                                                    <div className="flex flex-row items-center justify-start gap-2 text-left w-full truncate">
                                                        <span className="font-bold text-sm truncate max-w-[40%]">
                                                            {highlightText(option.value, searchTerm)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                                                            {highlightText(option.text, searchTerm)}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                )
                            }

                            const option = normalizeFlatOption(opt as Option)
                            const isSelected = option.value === field.value
                            return (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.value}-${index}`}
                                    onSelect={() => {
                                        field.onChange(option.value)
                                        setOpen(false)
                                        setSearchTerm("")
                                    }}
                                    aria-selected={isSelected}
                                    className={isSelected ? "bg-muted text-primary" : ""}
                                >
                                    <div className="flex flex-row items-center justify-start gap-2 text-left w-full truncate">
                                        <span className="font-bold text-sm truncate max-w-[40%]">
                                            {highlightText(option.value, searchTerm)}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                                            {highlightText(option.text, searchTerm)}
                                        </span>
                                    </div>
                                </CommandItem>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
