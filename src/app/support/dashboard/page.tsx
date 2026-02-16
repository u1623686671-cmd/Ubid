
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { SupportTicketsPanel, type SupportTicketForAdmin } from "@/components/support/SupportTicketsPanel";

function SupportDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const openSupportTicketsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'supportTickets'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: openSupportTickets, isLoading: areOpenSupportTicketsLoading } = useCollection<SupportTicketForAdmin>(openSupportTicketsQuery);

  const closedSupportTicketsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'supportTickets'), where('status', '==', 'closed'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: closedSupportTickets, isLoading: areClosedSupportTicketsLoading } = useCollection<SupportTicketForAdmin>(closedSupportTicketsQuery);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 space-y-8">
      <header>
          <h1 className="text-3xl md:text-4xl font-bold font-headline">Support Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-1">Review and handle user support tickets.</p>
      </header>
      <SupportTicketsPanel 
          openTickets={openSupportTickets} 
          closedTickets={closedSupportTickets} 
          isLoading={areOpenSupportTicketsLoading || areClosedSupportTicketsLoading}
      />
    </div>
  );
}

// This parent component acts as a strict authorization gate.
export default function SupportDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    // Auth checks
    const adminRef = useMemoFirebase(() => user ? doc(firestore, 'admins', user.uid) : null, [firestore, user]);
    const { data: admin, isLoading: isAdminLoading } = useDoc(adminRef);

    const supportRef = useMemoFirebase(() => user ? doc(firestore, 'support', user.uid) : null, [firestore, user]);
    const { data: supportUser, isLoading: isSupportLoading } = useDoc(supportRef);
    
    const isAuthorizationCheckLoading = isUserLoading || isAdminLoading || isSupportLoading;

    useEffect(() => {
        if (isAuthorizationCheckLoading) return;
        
        if (!user) {
            router.replace('/login');
            return;
        }

        const hasPermission = !!(admin || supportUser);
        if (hasPermission) {
            setIsAuthorized(true);
        } else {
            router.replace('/profile');
        }
    }, [user, admin, supportUser, isAuthorizationCheckLoading, router]);

    // Show a loader while we determine authorization status.
    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If we reach here, we are authorized. Render the dashboard.
    return <SupportDashboard />;
}
