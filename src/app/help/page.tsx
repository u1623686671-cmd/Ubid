
'use client';

import { useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, serverTimestamp, doc, writeBatch, getDocs, query, limit, getDoc, addDoc } from "firebase/firestore";
import { Loader2, ArrowLeft, Send, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject is too long."),
  message: z.string().min(20, "Message must be at least 20 characters long.").max(2000, "Message is too long."),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function HelpPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
        defaultValues: { subject: "", message: "" },
    });

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    const onSubmit = async (values: TicketFormValues) => {
        if (!user || !firestore) return;
        setIsSubmitting(true);

        try {
            // 1. Find a support agent to assign the chat to.
            const supportAgentsQuery = query(collection(firestore, 'support'), limit(1));
            const supportAgentsSnapshot = await getDocs(supportAgentsQuery);

            if (supportAgentsSnapshot.empty) {
                throw new Error("No support agents are currently available. Please try again later.");
            }
            
            const supportAgentId = supportAgentsSnapshot.docs[0].id;
            const supportAgentProfileSnap = await getDoc(doc(firestore, 'users', supportAgentId));
            if (!supportAgentProfileSnap.exists()) {
                 throw new Error("Could not find profile for available support agent.");
            }
            const supportAgentInfo = supportAgentProfileSnap.data();

            // 2. Get the current user's profile. It's guaranteed to exist by the FirebaseProvider.
            const userProfileRef = doc(firestore, 'users', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (!userProfileSnap.exists()) {
                throw new Error("Could not find your user profile. Please log out and back in.");
            }
            const userInfo = userProfileSnap.data();

            // 3. Create references for the new documents to get their IDs
            const newChatRef = doc(collection(firestore, 'chats'));
            const newChatId = newChatRef.id;
            const rootTicketRef = doc(collection(firestore, 'supportTickets'));
            const newTicketId = rootTicketRef.id;

            // Define timestamp once
            const initialTimestamp = serverTimestamp();

            // 4. Create the chat document
            const newChatData = {
                type: 'support',
                participants: [supportAgentId, user.uid],
                participantInfo: {
                [supportAgentId]: {
                    displayName: 'Support Agent', // Consistent name for support
                    photoURL: supportAgentInfo?.photoURL || null,
                },
                [user.uid]: {
                    displayName: userInfo?.displayName || 'User',
                    photoURL: userInfo?.photoURL || null,
                },
                },
                itemTitle: values.subject, // The ticket subject is the chat title
                itemId: newTicketId,
                itemCategory: 'support',
                lastMessage: {
                    text: values.message,
                    timestamp: initialTimestamp,
                    senderId: user.uid,
                },
                readBy: [user.uid], // User created it, so they've "read" their own message.
            };
            
            // 6. Create the root support ticket document for logging
            const ticketData = {
                userId: user.uid,
                userName: userInfo.displayName || 'Anonymous User',
                userEmail: userInfo.email,
                subject: values.subject,
                message: values.message,
                status: 'open', // 'open' is now informational; the real status is the chat
                createdAt: initialTimestamp,
                chatId: newChatId, // Link ticket to chat
            };
            
            // 7. Commit chat and ticket first
            const initialBatch = writeBatch(firestore);
            initialBatch.set(newChatRef, newChatData);
            initialBatch.set(rootTicketRef, ticketData);
            await initialBatch.commit();
            
            // 8. Create first message in subcollection AFTER chat exists
            const firstMessageData = {
                senderId: user.uid,
                text: values.message,
                timestamp: serverTimestamp()
            };
            await addDoc(collection(firestore, 'chats', newChatId, 'messages'), firstMessageData);
            
            toast({
                variant: 'success',
                title: 'Support Chat Started',
                description: "We've received your request. An agent will respond in your messages shortly.",
            });
            form.reset();
            router.push('/messages'); // Redirect to messages page

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error.message || 'Could not submit your support request.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAllowed || isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-12 md:py-16 space-y-12">
             <div className="mb-0 -mt-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <Card className="border-0 shadow-xl !mt-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <LifeBuoy className="w-8 h-8" />
                        <span>Contact Support</span>
                    </CardTitle>
                    <CardDescription>Have a question or need help? Fill out the form below and a support agent will start a chat with you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Issue with a listing" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How can we help?</FormLabel>
                                        <FormControl>
                                            <Textarea rows={5} placeholder="Please describe your issue in detail..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
