import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BuybackSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Buyback OrderBook</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-[400px] w-full" />
            </CardContent>
        </Card>
    )
}

