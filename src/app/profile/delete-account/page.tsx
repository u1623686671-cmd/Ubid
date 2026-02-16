'use client';

import { useUser, useAuth, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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

export default function DeleteAccountPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const firestore = useFirestore();
    const auth = useAuth();
    
    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    // This function now creates a support ticket instead of deleting data.
    const handleDeletionRequest = async () => {
        if (!user || !firestore) return;

        setIsRequesting(true);

        try {
            const ticketData = {
                userId: user.uid,
                userName: user.displayName || 'Unknown User',
                userEmail: user.email,
                subject: 'Account Deletion Request',
                message: `User ${user.displayName} (${user.email}, UID: ${user.uid}) has requested to have their account and all associated data permanently deleted.`,
                status: 'open',
                createdAt: serverTimestamp(),
                chatId: null, // No chat needed for this type of request
            };
            
            // Use a batch to write to both collections for consistency
            const batch = writeBatch(firestore);

            // 1. Create the root support ticket for admins/support to see
            const rootTicketRef = doc(collection(firestore, 'supportTickets'));
            batch.set(rootTicketRef, ticketData);

            // 2. Create a private copy for the user's records (optional but good practice)
            const userTicketRef = doc(collection(firestore, 'users', user.uid, 'supportTickets'));
            batch.set(userTicketRef, ticketData);

            await batch.commit();

            toast({ 
                title: "Deletion Request Submitted", 
                description: "Your request has been received. An admin will process it shortly. You will now be logged out.",
                variant: "success",
            });
            
            setTimeout(() => {
                signOut(auth);
                router.push('/login');
            }, 3000);

        } catch (error: any) {
            console.error("Account deletion request error:", error);
            toast({
                variant: "destructive",
                title: "Request Failed",
                description: error.message || "An error occurred while submitting your deletion request.",
            });
            setIsRequesting(false);
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
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/>Request Account Deletion</CardTitle>
                    <CardDescription>Request the permanent deletion of your account and all associated data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        By submitting this request, an administrator will be notified to permanently delete your account, including your profile, bids, watchlist, and other personal data. This action cannot be undone. You will be logged out upon submission.
                    </p>
                </CardContent>
                <CardFooter className="border-t pt-6">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive">Request Account Deletion</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to request deletion?</AlertDialogTitle>
                            <AlertDialogDescription>
                                An admin will be notified to permanently delete your account. This action cannot be undone. You will be logged out.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletionRequest} disabled={isRequesting} className="bg-destructive hover:bg-destructive/90">
                                {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                I understand, submit request
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
