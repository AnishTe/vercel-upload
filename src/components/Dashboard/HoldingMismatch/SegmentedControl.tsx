import { cn } from "@/lib/utils"

interface SegmentedControlProps {
    options: {
        color: any; value: string; label: string
    }[]
    value: string
    onChange: (value: string) => void
    name: string
}

export function SegmentedControl({ options, value, onChange, name }: SegmentedControlProps) {
    return (
        <div className="flex rounded-md shadow-sm">
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        "flex items-center justify-center px-3 py-1 text-sm font-medium border cursor-pointer",
                        "first:rounded-l-md last:rounded-r-md",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                        value === option.value
                            ? `${option.color} text-primary-foreground`
                            : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
                    )}
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        className="sr-only"
                    />
                    {option.label}
                </label>
            ))}
        </div>
    )
}

