
'use client';

import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';

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


export function NotificationBell() {
    const { user } = useUser();
    const firestore = useFirestore();
    const unreadCount = useUnreadNotificationsCount();
    const pathname = usePathname();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const handleOpenChange = async (open: boolean) => {
        if (open && notifications && firestore && user) {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            if (unreadNotifications.length === 0) return;

            const batch = writeBatch(firestore);
            unreadNotifications.forEach(notification => {
                const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
                batch.update(notifRef, { isRead: true });
            });
            await batch.commit().catch(console.error);
        }
    };

    const fromQuery = pathname === '/home' ? '?from=home' : '';

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10 bg-card hover:bg-muted">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                         <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="font-medium leading-none">Notifications</h4>
                        <Button asChild variant="link" className="text-xs h-auto p-0">
                            <Link href={`/notifications${fromQuery}`}>View all</Link>
                        </Button>
                    </div>
                    {isLoading && (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                        </div>
                    )}
                    {!isLoading && (!notifications || notifications.length === 0) && (
                        <div className="text-center text-sm text-muted-foreground p-6">
                            <p>You have no notifications yet.</p>
                        </div>
                    )}
                     {!isLoading && notifications && notifications.length > 0 && (
                        <ScrollArea className="h-80">
                             <div className="space-y-2 p-2">
                            {notifications.map((notification) => (
                                <Link href={notification.link} key={notification.id} className="block rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="p-2">
                                        <div className="flex items-start gap-3">
                                            {!notification.isRead && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-primary" />}
                                            <div className="grid gap-1 flex-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notification.body}
                                                </p>
                                                <div className="text-xs text-muted-foreground">
                                                    <TimeAgo timestamp={notification.timestamp} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        </ScrollArea>
                     )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
