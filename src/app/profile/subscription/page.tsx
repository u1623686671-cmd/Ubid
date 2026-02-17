
'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isCancelling, setIsCancelling] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(userProfileRef);

  const handleCancellation = async () => {
    if (!user || !firestore || !userProfile?.subscriptionRenewalDate) return;
    setIsCancelling(true);
    const userRef = doc(firestore, 'users', user.uid);
    try {
        await updateDoc(userRef, {
            pendingSubscriptionPlan: 'free',
            pendingSubscriptionBillingCycle: null,
            pendingSubscriptionEffectiveDate: userProfile.subscriptionRenewalDate,
        });
        toast({
            title: "Subscription Cancellation Scheduled",
            description: `Your subscription will remain active until ${format(new Date(userProfile.subscriptionRenewalDate), 'PP')}.`,
            variant: 'success'
        });
    } catch (error: any) {
        toast({
            title: "Cancellation Failed",
            description: error.message || "An error occurred while scheduling your subscription cancellation.",
            variant: "destructive"
        });
    } finally {
        setIsCancelling(false);
    }
  };

  const freeFeatures = [
    "Unlimited Bids",
    "1 Listing per 14 days",
  ];
  
  const plusFeatures = [
    "Unlimited Auction Listings",
    "1 Promoted Listing per Month",
  ];

  const ultimateFeatures = [
    "Everything in Plus",
    "5 Promoted Listings per Month",
    "10 Extend Tokens per Month",
    "Priority Support",
  ];

  if (isUserLoading || isUserProfileLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const isPlusUser = userProfile?.isPlusUser || false;
  const isUltimateUser = userProfile?.isUltimateUser || false;
  const isSubscribed = isPlusUser || isUltimateUser;

  const billingCycle = userProfile?.subscriptionBillingCycle;
  const renewalDate = userProfile?.subscriptionRenewalDate ? new Date(userProfile.subscriptionRenewalDate) : null;

  const isPlusDisabled = isUltimateUser || (isPlusUser && billingCycle === 'yearly');
  let plusButtonText = "Upgrade to Plus";
  if (isUltimateUser) {
    plusButtonText = "Included in Ultimate";
  } else if (isPlusUser && billingCycle === 'yearly') {
    plusButtonText = "Currently Active";
  } else if (isPlusUser && billingCycle === 'monthly') {
    plusButtonText = "Manage Plan";
  }
  
  const isUltimateDisabled = isUltimateUser && billingCycle === 'yearly';
  let ultimateButtonText = "Upgrade to Ultimate";
  if (isUltimateUser && billingCycle === 'yearly') {
      ultimateButtonText = "Currently Active";
  } else if (isUltimateUser && billingCycle === 'monthly') {
      ultimateButtonText = "Manage Plan";
  }
  
  const pendingPlan = userProfile?.pendingSubscriptionPlan;
  const pendingCycle = userProfile?.pendingSubscriptionBillingCycle;
  const pendingDate = userProfile?.pendingSubscriptionEffectiveDate ? new Date(userProfile.pendingSubscriptionEffectiveDate) : null;
  const isCancellationPending = pendingPlan === 'free';


  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6">
            <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                <Link href="/profile">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
        </div>
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Subscription Plans</h1>
            <p className="text-lg text-muted-foreground mt-2">Choose the plan that's right for you.</p>
        </header>
      
        {isSubscribed && (
          <Card className={cn("mb-12", 
            isUltimateUser ? "bg-purple-500/10 border-purple-500/20" : 
            isPlusUser ? "bg-sky-500/10 border-sky-500/20" : 
            "bg-secondary"
          )}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <CardTitle className="text-lg mb-2">Current Subscription</CardTitle>
                    <div className="flex items-center gap-3">
                        {isUltimateUser ? (
                            <Badge className="bg-purple-500 text-white hover:bg-purple-500 text-base">ULTIMATE</Badge>
                        ) : isPlusUser ? (
                            <Badge className="bg-sky-500 text-white hover:bg-sky-500 text-base">PLUS</Badge>
                        ) : null}
                        <p className="text-sm text-muted-foreground">
                        {renewalDate ? `Your plan is active and will automatically renew on ${format(renewalDate, 'PP')}.` : 'Your plan is active.'}
                        </p>
                    </div>
                     {pendingPlan && pendingDate && !isCancellationPending && (
                      <div className="text-sm text-muted-foreground border-t border-muted-foreground/20 pt-2">
                        <p><strong>Pending Change:</strong> You will be switched to the <strong>{pendingPlan} ({pendingCycle})</strong> plan on {format(pendingDate, 'PP')}.</p>
                      </div>
                    )}
                    {isCancellationPending && pendingDate && (
                      <div className="text-sm text-muted-foreground border-t border-muted-foreground/20 pt-2">
                        <p><strong>Cancellation Scheduled:</strong> Your subscription will end on {format(pendingDate, 'PP')}.</p>
                      </div>
                    )}
                </div>
                <Button variant="outline" onClick={handleCancellation} disabled={isCancelling || isCancellationPending} className="w-full sm:w-auto shrink-0">
                    {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCancellationPending ? 'Cancellation Scheduled' : 'Cancel Subscription'}
                </Button>
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>
              For casual sellers getting started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
             <div className="text-4xl font-bold font-headline">$0<span className="text-base font-normal text-muted-foreground">/month</span></div>
             <ul className="space-y-2 text-muted-foreground">
                {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start"><CheckCircle className="w-5 h-5 mr-2 text-primary shrink-0 mt-1"/><span>{feature}</span></li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
             <Button variant="outline" className="w-full" disabled={!isSubscribed}>
                Currently Active
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-2 border-sky-500 flex flex-col">
          <CardHeader>
            <CardTitle>Ubid Plus</CardTitle>
            <CardDescription>
              For serious sellers who want more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="text-4xl font-bold font-headline">
              $4.99
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">or $49.99/year (save 17%)</p>
            <ul className="space-y-2 text-foreground">
              {plusFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-sky-500 shrink-0 mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
           <CardFooter>
                <Button asChild={!isPlusDisabled} className="w-full bg-sky-500 text-white hover:bg-sky-500/90" disabled={isPlusDisabled}>
                    {isPlusDisabled ? (
                        <span>{plusButtonText}</span>
                    ) : (
                        <Link href="/profile/billing?plan=plus">
                           {plusButtonText}
                        </Link>
                    )}
                </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-purple-500 flex flex-col relative">
          <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
            <Badge className="bg-purple-500 text-white hover:bg-purple-500">Ultimate</Badge>
          </div>
          <CardHeader>
            <CardTitle>Ultimate</CardTitle>
            <CardDescription>For power users who want every advantage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
             <div className="text-4xl font-bold font-headline">
                $9.99
                <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">or $99.99/year (save 17%)</p>
             <ul className="space-y-2 text-foreground">
              {ultimateFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-purple-500 shrink-0 mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col">
            <Button asChild={!isUltimateDisabled} className="w-full bg-purple-500 text-white hover:bg-purple-500/90" disabled={isUltimateDisabled}>
                {isUltimateDisabled ? (
                    <span>{ultimateButtonText}</span>
                ) : (
                    <Link href="/profile/billing?plan=ultimate">
                        {ultimateButtonText}
                    </Link>
                )}
            </Button>
            {isPlusUser && !isUltimateUser && (
                <p className="text-xs text-muted-foreground mt-2">You will be refunded for the unused time on your current plan.</p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
