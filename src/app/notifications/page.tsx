
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Bell, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Loading from "./loading";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    link: string;
    isRead: boolean;
    timestamp: any;
};

const TimeAgo = ({ timestamp }: { timestamp: any }) => {
    const [time, setTime] = useState('');
    useEffect(() => {
        let date;
        if (timestamp?.toDate) {
            date = timestamp.toDate();
        } else if (timestamp) {
            date = new Date(timestamp);
        }

        if (date) {
            setTime(formatDistanceToNow(date, { addSuffix: true }));
        }
    }, [timestamp]);

    if (!time) return <Skeleton className="h-3 w-20 inline-block" />;
    return <>{time}</>;
}


export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isAllowed, setIsAllowed] = useState(false);

    const fromHome = searchParams.get('from') === 'home';
    const backLink = fromHome ? '/home' : '/profile';

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        setIsAllowed(true);
    }, [isUserLoading, user, router]);

    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading: areNotificationsLoading } = useCollection<Notification>(notificationsQuery);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user || !firestore) return;
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
        await updateDoc(notifRef, { isRead: true });
    };

    if (!isAllowed || areNotificationsLoading || isUserLoading) {
        return <Loading />;
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-12 md:py-16">
            <div className="mb-6">
                <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                    <Link href={backLink}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
            <header className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">
                    Notifications
                </h1>
                <p className="text-lg text-muted-foreground">
                    Your recent updates and alerts will appear here.
                </p>
            </header>

            {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <Link href={notification.link} key={notification.id} onClick={() => handleMarkAsRead(notification.id)} className="block">
                             <Card className={cn(
                                "p-4 transition-all hover:shadow-md border-0 shadow-sm",
                                !notification.isRead && "bg-secondary"
                             )}>
                                <div className="flex items-start gap-4">
                                     {!notification.isRead && <span className="flex h-2.5 w-2.5 translate-y-1.5 rounded-full bg-primary" />}
                                     <div className="grid gap-1 flex-1">
                                        <p className="font-semibold leading-none">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.body}
                                        </p>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <TimeAgo timestamp={notification.timestamp} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-muted-foreground flex flex-col items-center gap-6 max-w-md mx-auto py-16">
                    <Bell className="w-24 h-24 text-primary/10" />
                    <h2 className="text-2xl font-bold font-headline text-foreground">All Caught Up!</h2>
                    <p>
                       You don't have any notifications right now.
                    </p>
                </div>
            )}

        </div>
    )
}
