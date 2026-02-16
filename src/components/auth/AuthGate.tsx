'use client';
import { useUser, useFirestore } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingGavel } from '@/components/ui/loading-gavel';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckComplete, setIsCheckComplete] = useState(false);

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until the auth state is known
        }

        const isAuthPage = pathname === '/login' || pathname === '/signup';
        const isPublicPage = pathname === '/'; // The root is our only truly public page for unauthenticated users

        if (!user) {
            // User is not authenticated
            if (isAuthPage || isPublicPage) {
                setIsCheckComplete(true); // Allow access to login, signup, and root
            } else {
                router.replace('/login'); // Redirect any other page to login
            }
            return;
        }

        // User IS authenticated, now check for their Firestore profile
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef)
            .then(docSnap => {
                const profileExists = docSnap.exists();
                
                if (profileExists) {
                    // Profile exists, user is fully onboarded.
                    // If they are trying to visit login/signup, redirect them to home.
                    if (isAuthPage) {
                        router.replace('/home');
                    } else {
                        setIsCheckComplete(true);
                    }
                } else {
                    // This is a critical state: logged in, but no profile.
                    // This can happen if they close the browser during signup.
                    // Force them to the signup page to complete their profile.
                    if (pathname !== '/signup') {
                        router.replace('/signup');
                    } else {
                        setIsCheckComplete(true);
                    }
                }
            })
            .catch(error => {
                console.error("AuthGate: Error fetching user profile:", error);
                // If we can't even check for a profile, something is wrong.
                // Log the user out to be safe and prevent loops.
                signOut(auth);
                // No need to setIsCheckComplete(true) here, as signOut will trigger a re-render
                // and the !user logic will take over, redirecting to /login.
            });

    }, [isUserLoading, user, pathname, router, firestore, auth]);

    if (!isCheckComplete) {
        return <LoadingGavel />;
    }
    
    return <>{children}</>;
}
