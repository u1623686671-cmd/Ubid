
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc, runTransaction } from "firebase/firestore";
import { Loader2, ArrowLeft, CreditCard, Shield, BadgeCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StoredCardData = {
  cardholderName: string;
  cardNumberLast4: string;
  expiryDate: string;
};

const planDetails = {
    plus: {
        name: "Ubid Plus",
        monthlyPrice: 4.99,
        yearlyPrice: 49.99,
    },
    ultimate: {
        name: "Ubid Ultimate",
        monthlyPrice: 9.99,
        yearlyPrice: 99.99,
    }
};

type ProratedInfo = {
    credit: number;
    newPrice: number;
    finalPrice: number;
};


export default function BillingPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [isClient, setIsClient] = useState(false);
    const [isAllowed, setIsAllowed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardData, setCardData] = useState<StoredCardData | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const [proratedInfo, setProratedInfo] = useState<ProratedInfo | null>(null);
    const [isUpgrade, setIsUpgrade] = useState(false);
    const [isScheduledChange, setIsScheduledChange] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(userProfileRef);

    const plan = searchParams.get('plan') as 'plus' | 'ultimate' | null;
    
    const isMonthlyDisabled = 
        (plan === 'plus' && userProfile?.isPlusUser && userProfile?.subscriptionBillingCycle === 'monthly') ||
        (plan === 'ultimate' && userProfile?.isUltimateUser && userProfile?.subscriptionBillingCycle === 'monthly');

    useEffect(() => {
        if (isMonthlyDisabled) {
            setBillingCycle('yearly');
        }
    }, [isMonthlyDisabled]);

    useEffect(() => {
        setIsClient(true);
        if (isUserLoading || isUserProfileLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }
        if (!plan || !['plus', 'ultimate'].includes(plan)) {
            router.replace('/profile/subscription');
            return;
        }
        
        setIsAllowed(true);
        try {
            const savedCard = localStorage.getItem('userPaymentMethod');
            if (savedCard) {
                setCardData(JSON.parse(savedCard));
            }
        } catch (error) {
            console.error("Could not read from localStorage", error);
            setCardData(null);
        }
    }, [isUserLoading, isUserProfileLoading, user, router, plan]);

    useEffect(() => {
        if (!userProfile || !plan) return;

        const currentPlanIsPlus = userProfile.isPlusUser;
        const currentPlanIsUltimate = userProfile.isUltimateUser;
        const currentBillingCycle = userProfile.subscriptionBillingCycle;
        const currentRenewalDate = userProfile.subscriptionRenewalDate;

        const wantsUltimate = plan === 'ultimate';
        const wantsPlus = plan === 'plus';
        
        // A tier upgrade is always immediate, regardless of cycle change
        const isTierUpgrade = currentPlanIsPlus && wantsUltimate;

        // A cycle upgrade is only immediate if it's on the same tier
        const isCycleUpgrade = (
            (currentPlanIsPlus && wantsPlus && currentBillingCycle === 'monthly' && billingCycle === 'yearly') ||
            (currentPlanIsUltimate && wantsUltimate && currentBillingCycle === 'monthly' && billingCycle === 'yearly')
        );
        
        const isImmediateUpgrade = isTierUpgrade || isCycleUpgrade;
        setIsUpgrade(isImmediateUpgrade);
        
        // A scheduled change is a downgrade in tier or cycle (on the same tier)
        const isScheduledDowngrade = !isTierUpgrade && ( // Don't schedule if it's a tier upgrade
            (currentPlanIsUltimate && wantsPlus) || // Tier downgrade
            (currentPlanIsPlus && wantsPlus && currentBillingCycle === 'yearly' && billingCycle === 'monthly') || // Cycle downgrade (Yearly -> Monthly)
            (currentPlanIsUltimate && wantsUltimate && currentBillingCycle === 'yearly' && billingCycle === 'monthly')
        );
        setIsScheduledChange(isScheduledDowngrade);

        if (isImmediateUpgrade && currentRenewalDate && currentBillingCycle) {
            const renewalDate = new Date(currentRenewalDate);
            const today = new Date();
            
            const previousRenewal = new Date(renewalDate);
            if (currentBillingCycle === 'monthly') {
                previousRenewal.setMonth(previousRenewal.getMonth() - 1);
            } else {
                previousRenewal.setFullYear(previousRenewal.getFullYear() - 1);
            }

            const totalCycleMillis = renewalDate.getTime() - previousRenewal.getTime();
            const remainingMillis = renewalDate.getTime() - today.getTime();

            if (totalCycleMillis > 0 && remainingMillis > 0) {
                const fractionRemaining = remainingMillis / totalCycleMillis;
                
                let currentPrice = 0;
                if (userProfile.isPlusUser) {
                    currentPrice = currentBillingCycle === 'monthly' ? planDetails.plus.monthlyPrice : planDetails.plus.yearlyPrice;
                } else if (userProfile.isUltimateUser) {
                    currentPrice = currentBillingCycle === 'monthly' ? planDetails.ultimate.monthlyPrice : planDetails.ultimate.yearlyPrice;
                }
                
                const credit = fractionRemaining * currentPrice;
                const newPlanDetails = planDetails[plan];
                const newPrice = billingCycle === 'monthly' ? newPlanDetails.monthlyPrice : newPlanDetails.yearlyPrice;
                const finalPrice = newPrice - credit; // Allow negative for refunds

                setProratedInfo({ credit, newPrice, finalPrice });
            } else {
                setProratedInfo(null);
            }
        } else {
            setProratedInfo(null); // Not an immediate upgrade, no proration
        }

    }, [userProfile, plan, billingCycle]);


    const handlePurchase = async () => {
        if (!user || !firestore || !plan) return;
        setIsProcessing(true);

        const userRef = doc(firestore, 'users', user.uid);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment processing

            if (isScheduledChange) {
                await updateDoc(userRef, {
                    pendingSubscriptionPlan: plan,
                    pendingSubscriptionBillingCycle: billingCycle,
                    pendingSubscriptionEffectiveDate: userProfile?.subscriptionRenewalDate,
                });
                toast({
                    variant: 'success',
                    title: 'Subscription Change Scheduled',
                    description: `Your plan will switch to ${planDetails[plan].name} (${billingCycle}) at the end of your current period.`,
                });
            } else {
                await runTransaction(firestore, async (transaction) => {
                    const userDoc = await transaction.get(userRef);
                    if (!userDoc.exists()) throw "User document not found.";
                    
                    const updateData: any = {
                        pendingSubscriptionPlan: null,
                        pendingSubscriptionBillingCycle: null,
                        pendingSubscriptionEffectiveDate: null,
                    };
    
                    if (plan === 'plus') {
                        updateData.isPlusUser = true;
                        updateData.isUltimateUser = false;
                    } else if (plan === 'ultimate') {
                        updateData.isPlusUser = false;
                        updateData.isUltimateUser = true;
                        const currentPromoTokens = userDoc.data().promotionTokens || 0;
                        const currentExtendTokens = userDoc.data().extendTokens || 0;

                        if (billingCycle === 'monthly') {
                            updateData.promotionTokens = currentPromoTokens + 5;
                            updateData.extendTokens = currentExtendTokens + 2;
                        } else { // yearly
                            updateData.promotionTokens = currentPromoTokens + 60; // 5 * 12
                            updateData.extendTokens = currentExtendTokens + 24; // 2 * 12
                        }
                    }
    
                    updateData.subscriptionBillingCycle = billingCycle;
                    const renewalDate = new Date();
                    if (billingCycle === 'monthly') {
                        renewalDate.setMonth(renewalDate.getMonth() + 1);
                    } else {
                        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
                    }
                    updateData.subscriptionRenewalDate = renewalDate.toISOString();
    
                    transaction.update(userRef, updateData);
                });
                
                toast({
                    variant: 'success',
                    title: isUpgrade ? 'Subscription Upgraded!' : 'Subscription Successful!',
                    description: `You are now subscribed to ${planDetails[plan].name}.`,
                });
            }
            router.push('/profile/subscription');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Purchase Failed',
                description: error.message || 'Could not complete your purchase.',
            });
             setIsProcessing(false);
        }
    };
    
    if (!isClient || !isAllowed || !plan || isUserProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const details = planDetails[plan];
    const totalPrice = proratedInfo ? proratedInfo.finalPrice : (billingCycle === 'monthly' ? details.monthlyPrice : details.yearlyPrice);
    
    return (
        <div className="container mx-auto max-w-2xl px-4 py-12 md:py-16">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href="/profile/subscription">
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <BadgeCheck className="h-7 w-7 text-primary"/>
                        <span>Complete Your Purchase</span>
                    </CardTitle>
                    <CardDescription>You are subscribing to the <strong>{details.name}</strong> plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-semibold">Select Billing Cycle</Label>
                        <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" disabled={isMonthlyDisabled} />
                                <Label htmlFor="monthly" className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                    isMonthlyDisabled && "cursor-not-allowed opacity-50 hover:bg-popover hover:text-popover-foreground"
                                )}>
                                    <p className="font-semibold">Monthly</p>
                                    <p className="text-xl font-bold">${details.monthlyPrice.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">per month</p>
                                </Label>
                            </div>
                             <div>
                                <RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
                                <Label htmlFor="yearly" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <p className="font-semibold">Yearly</p>
                                    <p className="text-xl font-bold">${details.yearlyPrice.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">per year</p>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div>
                        <Label className="font-semibold">Payment Method</Label>
                         {cardData ? (
                            <div className="mt-2 flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-sm">{cardData.cardholderName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Ending in {cardData.cardNumberLast4} &bull; Expires {cardData.expiryDate}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="link" size="sm" className="text-xs">
                                    <Link href={`/profile/settings?redirect=/profile/billing&plan=${plan}`}>Change</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center justify-center text-center flex-col gap-4 rounded-md border border-dashed p-6">
                                <p className="text-sm text-muted-foreground">No payment method on file.</p>
                                <Button asChild size="sm">
                                    <Link href={`/profile/settings?redirect=/profile/billing&plan=${plan}`}>Add Payment Method</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                     <Separator />
                      {proratedInfo && (
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">New Plan ({billingCycle})</span>
                                <span>${proratedInfo.newPrice.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-green-600">
                                <span className="text-muted-foreground">Credit for remaining time</span>
                                <span>-${proratedInfo.credit.toFixed(2)}</span>
                            </div>
                        </div>
                     )}
                    {isScheduledChange && userProfile?.subscriptionRenewalDate && (
                        <div className="p-3 rounded-lg bg-info text-info-foreground flex items-start gap-3">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <p className="text-sm">
                                Your current plan is active until {new Date(userProfile.subscriptionRenewalDate).toLocaleDateString()}. Your new {billingCycle} plan will start automatically on that date.
                            </p>
                        </div>
                    )}
                     {proratedInfo && proratedInfo.finalPrice < 0 && (
                        <div className="p-3 rounded-lg bg-info text-info-foreground flex items-start gap-3">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <p className="text-sm">
                                You will be refunded for the remaining time on your yearly plan. The refund will be processed to your original payment method.
                            </p>
                        </div>
                    )}
                     <div className="w-full flex justify-between items-center text-lg font-bold">
                        <span>{totalPrice < 0 ? 'Amount to be Refunded:' : 'Total Due Today:'}</span>
                        <span className={totalPrice < 0 ? "text-green-600" : ""}>
                            {totalPrice < 0 ? `-$${(-totalPrice).toFixed(2)}` : `$${totalPrice.toFixed(2)}`}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center !mt-2">
                         {billingCycle === 'yearly'
                            ? "Your plan will automatically renew yearly. Yearly subscriptions are non-refundable, but can be cancelled to prevent auto-renewal."
                            : "Your plan will automatically renew monthly. You can cancel anytime."
                        }
                    </p>

                </CardContent>
                <CardFooter>
                    <Button onClick={handlePurchase} disabled={isProcessing || !cardData} className="w-full">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isProcessing
                        ? 'Processing...'
                        : proratedInfo && proratedInfo.finalPrice < 0
                        ? 'Confirm Upgrade & Refund'
                        : isScheduledChange
                        ? 'Schedule Change'
                        : isUpgrade
                        ? 'Upgrade Now'
                        : 'Confirm Purchase'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
