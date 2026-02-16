'use client';

import { useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, ArrowLeft, User, Phone, NotebookText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  bio: z.string().max(160, "Bio cannot be longer than 160 characters.").optional(),
  phoneNumber: z.string().min(1, "Phone number is required."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AccountDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            bio: '',
            phoneNumber: ''
        }
    });

    useEffect(() => {
        if (isUserLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        setIsAllowed(true);
        
        // Fetch Firestore data to get bio and phone
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserProfile(data);
                form.reset({
                    bio: data.bio || '',
                    phoneNumber: data.phoneNumber || ''
                });
            }
        });

    }, [isUserLoading, user, router, firestore, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        if (!user || !firestore) return;

        setIsSubmitting(true);
        try {
            // Update Firestore document
            const userDocRef = doc(firestore, "users", user.uid);
            await updateDoc(userDocRef, {
                bio: values.bio,
                phoneNumber: values.phoneNumber,
            });

            toast({ variant: 'success', title: 'Profile Updated', description: 'Your changes have been saved.' });
            router.push('/profile');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not save your changes.',
            });
        } finally {
            setIsSubmitting(false);
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
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Manage your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input id="fullname" value={user.displayName || 'Not provided'} readOnly className="bg-muted/50" />
                        <p className="text-xs text-muted-foreground">Full name cannot be changed.</p>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user.email || 'Not provided'} readOnly className="bg-muted/50" />
                    </div>
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="e.g., +1 555-123-4567" {...field} className="pl-9" />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Tell us a little bit about yourself..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                 <CardFooter className="border-t pt-6">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
            </form>
            </Form>
        </div>
    );
}
