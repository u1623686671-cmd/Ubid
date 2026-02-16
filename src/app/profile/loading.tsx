import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-2xl py-8 animate-pulse">
        <div className="space-y-8 px-4">
            <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Skeleton className="w-24 h-24 mb-4 rounded-full" />
                    <div className="flex flex-col items-center gap-2 w-full">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </CardFooter>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <Skeleton className="w-8 h-8 mb-2 rounded-md"/>
                    <Skeleton className="h-5 w-20" />
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <Skeleton className="w-8 h-8 mb-2 rounded-md"/>
                    <Skeleton className="h-5 w-24" />
                </Card>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 mt-8"><Skeleton className="h-7 w-40" /></h3>
                <div>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-5 h-5 rounded" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="w-5 h-5 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 mt-8"><Skeleton className="h-7 w-20" /></h3>
                 <div>
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-5 h-5 rounded" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="w-5 h-5 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
