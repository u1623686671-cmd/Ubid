'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { doc, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';


const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  ageConfirmation: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18 or older to sign up." }),
  }),
});

const completeProfileSchema = signupSchema.omit({ password: true, email: true });


export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isCompletingProfile ? completeProfileSchema : signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
      ageConfirmation: false,
    },
  });

  useEffect(() => {
    if (user && !isUserLoading) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (!docSnap.exists()) {
                setIsCompletingProfile(true);
                
                if (user.displayName) {
                    const names = user.displayName.split(' ');
                    form.setValue('firstName', names[0] || '');
                    form.setValue('lastName', names.slice(1).join(' ') || '');
                }
            } else {
                 router.replace('/home');
            }
        });
    }
  }, [user, isUserLoading, firestore, form, router]);
  
  const processUserCreation = async (userToProcess: User, values: z.infer<typeof signupSchema>) => {
      await userToProcess.getIdToken(true); // Force refresh token
      
      const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`;
      
      if (userToProcess.displayName !== displayName) {
          await updateProfile(userToProcess, { displayName });
      }

      const userDocRef = doc(firestore, 'users', userToProcess.uid);
      
      await setDoc(userDocRef, {
        uid: userToProcess.uid,
        displayName: displayName,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: userToProcess.email,
        photoURL: userToProcess.photoURL,
        bio: '',
        phoneNumber: values.phoneNumber.trim(),
        isPlusUser: false,
        isUltimateUser: false,
        extendTokens: 0,
        promotionTokens: 0,
      });
  }

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);

    try {
      if (isCompletingProfile && user) {
          await processUserCreation(user, values);
      } else {
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          await processUserCreation(userCredential.user, values);
      }

      toast({ variant: 'success', title: 'Sign Up Successful!', description: 'Welcome to Ubid.' });
      router.replace('/home');

    } catch (error: any) {
      let title = 'Sign-up Failed';
      let description = error.message || 'Could not create your account.';
      if (error.code === 'auth/email-already-in-use') {
        title = 'Email in use';
        description = 'An account with this email already exists. Please login instead.';
      }
      toast({ variant: 'destructive', title, description });
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The AuthGate will handle the rest, including redirecting to this page if profile is incomplete.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Google sign-up failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignup)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="John" {...field} disabled={isCompletingProfile && !!field.value} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} disabled={isCompletingProfile && !!field.value} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
            <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input type="tel" placeholder="+1 234 567 890" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        {!isCompletingProfile && (
            <>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </>
        )}

        <FormField control={form.control} name="ageConfirmation" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>
                        I am 18 years of age or older.
                    </FormLabel>
                     <FormMessage />
                </div>
            </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCompletingProfile ? "Complete Profile" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="mx-auto max-w-sm w-full border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline">
            {isCompletingProfile ? "Complete Your Profile" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {isCompletingProfile ? "Please provide your phone number to continue." : "Enter your information to join the auctions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderForm()}
          {!isCompletingProfile && (
            <>
                <div className="my-4 flex items-center gap-2">
                    <div className="flex-grow border-t border-muted"></div>
                    <span className="text-sm text-muted-foreground">OR</span>
                    <div className="flex-grow border-t border-muted"></div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={googleLoading || loading}>
                    {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" className="w-4 h-4 mr-2" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 56.6l-66.2 65.9c-21.6-20.5-52.2-32.9-88.3-32.9-68.9 0-125.3 56.3-125.3 125.8s56.3 125.8 125.3 125.8c76.3 0 110.7-53.1 114.3-81.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>}
                    Sign up with Google
                </Button>
            </>
          )}
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
