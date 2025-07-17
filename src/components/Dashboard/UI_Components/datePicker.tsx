import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Control, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { z } from 'zod';

interface DatePickerFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: React.ReactNode;
    placeholder?: string;
    description?: string;
    minDate?: Date; // For CalendarComponent props (e.g., specific earliest date allowed)
    maxDate?: Date; // For CalendarComponent props (e.g., specific latest date allowed)
    defaultDate?: Date; // For a default selected date
    startYear?: number; // Override calculated start year for dropdowns
    endYear?: number;   // Override calculated end year for dropdowns
    yearRange?: number; // Override calculated year range for dropdowns
    required?: boolean;
    minAge?: number; // Used for initial view and potentially dropdown year range
    maxAge?: number; // Used for initial view and potentially dropdown year range
    className?: string;
    labelClassName?: string;
    buttonClassName?: string;
    closeOnSelect?: boolean;
    showIcon?: boolean;
    dateFormat?: string;
    onDateSelect?: (date: Date | undefined, form: Control<T>) => void;
    initialViewDate?: Date; // Explicitly set the initial month/year displayed
}

export const DatePickerField = forwardRef<
    HTMLDivElement,
    DatePickerFieldProps<any> // Or keep generic if needed
>(function DatePickerFieldInner(
    {
        control,
        name,
        label,
        placeholder = "Select a date",
        description,
        minDate,
        maxDate,
        defaultDate,
        startYear: propStartYear,
        endYear: propEndYear,
        yearRange,
        required = false,
        minAge,
        maxAge,
        className,
        labelClassName,
        buttonClassName,
        closeOnSelect = true,
        showIcon = true,
        dateFormat = "PPP",
        onDateSelect,
        initialViewDate,
    },
    ref
) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const fieldValue = useWatch({ control, name });

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const actualMinDate = useMemo(() => {
        if (maxAge !== undefined) {
            const maxAgeLimit = new Date(today);
            maxAgeLimit.setFullYear(today.getFullYear() - maxAge);
            return minDate ? new Date(Math.max(minDate.getTime(), maxAgeLimit.getTime())) : maxAgeLimit;
        }
        return minDate ?? null;
    }, [maxAge, minDate, today]);

    const actualMaxDate = useMemo(() => {
        if (minAge !== undefined) {
            const minAgeLimit = new Date(today);
            minAgeLimit.setFullYear(today.getFullYear() - minAge);
            return maxDate ? new Date(Math.min(maxDate.getTime(), minAgeLimit.getTime())) : minAgeLimit;
        }
        return maxDate ?? null;
    }, [minAge, maxDate, today]);

    const initialView = useMemo(() => {
        let view: Date | null = null;

        if (fieldValue) {
            view = new Date(fieldValue);
        } else if (defaultDate) {
            view = new Date(defaultDate);
        } else if (initialViewDate) {
            view = new Date(initialViewDate);
        } else if (minAge !== undefined) {
            view = new Date(today);
            view.setFullYear(today.getFullYear() - minAge);
        } else {
            view = new Date(today);
        }

        // Clamp to actualMinDate / actualMaxDate
        if (actualMinDate && view < actualMinDate) view = new Date(actualMinDate);
        if (actualMaxDate && view > actualMaxDate) view = new Date(actualMaxDate);

        // Clamp to startYear if provided
        if (propStartYear && view.getFullYear() < propStartYear) {
            view.setFullYear(propStartYear);
            view.setMonth(0); // reset to Jan
            view.setDate(1);  // reset to 1st
        }

        return view;
    }, [
        fieldValue,
        defaultDate,
        initialViewDate,
        minAge,
        today,
        actualMinDate,
        actualMaxDate,
        propStartYear,
    ]);

    const [currentView, setCurrentView] = useState<Date>(initialView);

    useEffect(() => {
        setCurrentView(initialView);
    }, [initialView]);

    const { yearOptions } = useMemo(() => {
        const currentYear = today.getFullYear();
        let start = propStartYear ?? 1940;
        let end = propEndYear ?? (yearRange ? start + yearRange : currentYear + 10);

        if (actualMinDate) start = Math.max(start, actualMinDate.getFullYear());
        if (actualMaxDate) end = Math.min(end, actualMaxDate.getFullYear());
        if (start > end) end = start;

        const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return { yearOptions: years };
    }, [actualMinDate, actualMaxDate, propStartYear, propEndYear, yearRange, today]);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                return (
                    <FormItem className={cn("flex flex-col", className)} ref={ref}>
                        <FormLabel className={cn("text-sm font-medium text-gray-700", showIcon && "flex items-center gap-2", labelClassName)}>
                            {showIcon && <CalendarIcon className="w-4 h-4" />}
                            {label}
                            {required && <span className="text-red-500 font-bold text-lg ml-1">*</span>}
                        </FormLabel>
                        <FormControl>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal h-10 border-2 focus:border-blue-500 transition-colors bg-transparent", !field.value && "text-muted-foreground", buttonClassName)}
                                        onClick={() => setCurrentView(field.value || initialView)}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field?.value ? format(field?.value, dateFormat) : placeholder}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-3">
                                        <div className="flex gap-2 mb-2">
                                            <select
                                                aria-label="Select month"
                                                value={currentView.getMonth()}
                                                onChange={(e) => {
                                                    const newDate = new Date(currentView);
                                                    newDate.setMonth(+e.target.value);
                                                    setCurrentView(newDate);
                                                }}
                                                className="p-1 border rounded text-xs flex-1"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                aria-label="Select year"
                                                value={currentView.getFullYear()}
                                                onChange={(e) => {
                                                    const newDate = new Date(currentView);
                                                    newDate.setFullYear(+e.target.value);
                                                    setCurrentView(newDate);
                                                }}
                                                className="p-1 border rounded text-xs flex-1"
                                            >
                                                {yearOptions.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            if (!date) return;
                                            const isTooEarly = actualMinDate && date < actualMinDate;
                                            const isTooLate = actualMaxDate && date > actualMaxDate;

                                            if (isTooEarly || isTooLate) {
                                                console.warn(`Selected date must be between ${format(actualMinDate!, "PPP")} and ${format(actualMaxDate!, "PPP")}`);
                                                return;
                                            }

                                            field.onChange(date);
                                            if (closeOnSelect) setCalendarOpen(false);
                                            if (onDateSelect) onDateSelect(date, control);
                                        }}
                                        month={currentView}
                                        onMonthChange={setCurrentView}
                                        fromDate={actualMinDate ?? undefined}
                                        toDate={actualMaxDate ?? undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </FormControl>
                        {description && <FormDescription className="text-xs text-gray-500">{description}</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )
            }}
        />
    );
})
