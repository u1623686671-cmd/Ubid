'use client';

import { useUser } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { NewListingFlow } from "@/components/retailer/NewListingFlow";

export default function NewListingPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isAllowed, setIsAllowed] = useState(false);

    const from = searchParams.get('from');
    const tab = searchParams.get('tab');
    const category = searchParams.get('category') || undefined;

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    const backLink = useMemo(() => {
        if (from === 'home') {
            if (tab === 'categories') {
                return '/home?tab=categories';
            }
            return '/home';
        }
        return '/retailer/dashboard';
    }, [from, tab]);

    if (!isAllowed) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href={backLink}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Listing</CardTitle>
                    <CardDescription>First, select the category of the item you want to sell.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NewListingFlow
                        initialCategory={category}
                        onSuccess={() => router.push('/retailer/dashboard')}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
