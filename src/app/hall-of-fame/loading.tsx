
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trophy, Crown, Award, TrendingUp } from "lucide-react";

const SkeletonList = ({ icon: Icon, title, description, rows = 5 }: { icon: React.ElementType, title: string, description: string, rows?: number }) => (
    <Card className="shadow-lg border-0">
        <CardHeader>
            <div className="flex items-center gap-2">
                <Icon className="w-6 h-6 text-muted-foreground/20"/>
                <Skeleton className="h-7 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                </div>
            ))}
            </div>
        </CardContent>
    </Card>
)

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16 space-y-12 animate-pulse">
        <header className="text-center !mt-0">
            <Skeleton className="h-12 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        </header>

        <SkeletonList icon={Trophy} title="Top 10 Auction Experts" description="Users with the highest scores." rows={10} />

        <Card className="shadow-lg border-0">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-muted-foreground/20"/>
                    <Skeleton className="h-7 w-40" />
                </div>
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-md" />
                            <Skeleton className="h-12 w-12 rounded-md" />
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <div className="text-right">
                             <Skeleton className="h-6 w-16" />
                             <Skeleton className="h-3 w-8 mt-1 ml-auto" />
                        </div>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>

        <SkeletonList icon={Award} title="Top 5 Sellers" description="Sellers with the most bids." rows={5} />
        <SkeletonList icon={TrendingUp} title="Top 5 Bidders" description="Users with the most bids placed." rows={5} />

    </div>
  )
}
