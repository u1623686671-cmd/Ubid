
'use client';

import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function PasswordPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    useEffect(() => {
        if (isUserLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        setIsAllowed(true);
    }, [isUserLoading, user, router]);
    
    const handlePasswordReset = async () => {
        if (!user?.email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No email address found for this account.'
            });
            return;
        }
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                variant: 'success',
                title: 'Password Reset Email Sent',
                description: `An email has been sent to ${user.email} with instructions to reset your password.`,
            });
        } catch (error: any) {
            console.error("Password reset error:", error);
            toast({
                variant: 'destructive',
                title: 'Failed to Send Email',
                description: error.message || 'Could not send password reset email.',
            });
        } finally {
            setIsSendingReset(false);
        }
    };

    if (!isAllowed) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
         <div className="container mx-auto max-w-2xl px-4 py-12 md:py-16">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card>
                 <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>Manage your account security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label>Password Reset</Label>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md border p-4">
                        <p className="text-sm text-muted-foreground">For security, you can reset your password via email.</p>
                        <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingReset} className="w-full sm:w-auto">
                            {isSendingReset ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <KeyRound className="mr-2 h-4 w-4" />
                            )}
                            {isSendingReset ? 'Sending...' : 'Send Reset Email'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
