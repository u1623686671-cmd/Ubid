
'use client';

import { NewListingFlow } from "@/components/retailer/NewListingFlow";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/firebase";
import { LoadingGavel } from "@/components/ui/loading-gavel";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewListingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const [isAllowed, setIsAllowed] = useState(false);

    const fromHome = searchParams.get('from') === 'home';
    const backLink = fromHome ? '/home' : '/retailer/dashboard';

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    if (!isAllowed) {
        return <LoadingGavel />;
    }

    const handleSuccess = () => {
        router.push('/retailer/dashboard');
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href={backLink}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">
                        Create a New Listing
                    </CardTitle>
                    <CardDescription className="text-lg pt-1">
                        Select a category and provide the details for your new auction item.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NewListingFlow onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </div>
    );
}
