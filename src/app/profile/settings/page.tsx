'use client';

import { useUser } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, CreditCard, User, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const paymentSchema = z.object({
  cardholderName: z.string().min(2, "Name is too short"),
  cardNumber: z.string().regex(/^\d{16}$/, "Invalid card number (must be 16 digits)"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid format (MM/YY)"),
  cvc: z.string().regex(/^\d{3,4}$/, "Invalid CVC (must be 3 or 4 digits)"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type StoredCardData = {
  cardholderName: string;
  cardNumberLast4: string;
  expiryDate: string;
};

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [cardData, setCardData] = useState<StoredCardData | null>(null);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            cardholderName: "",
            cardNumber: "",
            expiryDate: "",
            cvc: "",
        },
    });
    
    useEffect(() => {
        setIsClient(true);
        try {
            const savedCard = localStorage.getItem('userPaymentMethod');
            if (savedCard) {
                setCardData(JSON.parse(savedCard));
            }
        } catch (error) {
            console.error("Could not read from localStorage", error);
            setCardData(null);
        }
    }, []);

    useEffect(() => {
        if (isUserLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }
        
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    const onSubmit = async (values: PaymentFormValues) => {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newCardData = {
            cardholderName: values.cardholderName,
            cardNumberLast4: values.cardNumber.slice(-4),
            expiryDate: values.expiryDate,
        };

        try {
            localStorage.setItem('userPaymentMethod', JSON.stringify(newCardData));
            setCardData(newCardData);
            form.reset();
            toast({
                variant: 'success',
                title: "Payment Information Saved",
                description: "Your card details have been securely stored.",
            });

            const redirect = searchParams.get('redirect');
            const plan = searchParams.get('plan');
            if (redirect) {
                toast({
                    title: "Redirecting...",
                    description: "Now redirecting you back to complete your subscription.",
                });
                const redirectUrl = plan ? `${redirect}?subscribe=${plan}` : redirect;
                // Add a small delay to let the user read the toast
                setTimeout(() => router.push(redirectUrl), 1000);
            }

        } catch (error) {
            console.error("Could not write to localStorage", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save payment method.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveCard = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            localStorage.removeItem('userPaymentMethod');
            setCardData(null);
            toast({
                title: "Card Removed",
                description: "Your payment information has been removed.",
            });
        } catch (error) {
            console.error("Could not remove from localStorage", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not remove payment method.",
            });
        }
    }

    if (!isAllowed || !user || !isClient) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto max-w-2xl px-4 py-12 md:py-16 space-y-8">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href="/profile">
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Payment Options</CardTitle>
                    <CardDescription>Manage your payment method for auctions.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {cardData ? (
                                <div className="space-y-4">
                                     <div className="grid gap-2">
                                        <Label>Card on File</Label>
                                        <div className="relative flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{cardData.cardholderName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Ending in {cardData.cardNumberLast4} &bull; Expires {cardData.expiryDate}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">To update your payment method, please remove the current card and add a new one.</p>
                                </div>
                            ) : (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="cardholderName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cardholder Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Jane Doe" {...field} className="pl-9" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cardNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Card Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="0000 0000 0000 0000" {...field} className="pl-9" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="expiryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expiry Date</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="MM/YY" {...field} className="pl-9" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cvc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CVC</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="123" {...field} className="pl-9" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-6">
                            {cardData ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="destructive">Remove Card</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently remove your payment information.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemoveCard} className="bg-destructive hover:bg-destructive/90">
                                            Yes, Remove Card
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? "Saving..." : "Save Card"}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
