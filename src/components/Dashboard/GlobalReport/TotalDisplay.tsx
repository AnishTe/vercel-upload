import DecryptedText from '@/components/ui/DecryptedText'
import { Skeleton } from '@/components/ui/skeleton'

interface TotalDisplayProps {
    label: string
    value: number
    loading: boolean
}

export function TotalDisplay({ label, value, loading }: TotalDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center p-2 rounded-lg sm:flex-row sm:gap-4">
            <h3 className="text-md font-medium text-secondary-foreground mb-2 sm:mb-0">{label}</h3>
            {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
            ) : (
                <p className="text-sm font-semibold">
                    <DecryptedText
                        animateOn="view"
                        revealDirection="center"
                        characters="12345678"
                        text={new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                        }).format(value)}
                    />
                </p>
            )}
        </div>
    )
}
