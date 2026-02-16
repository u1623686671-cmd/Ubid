
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

type Notification = {
  isRead: boolean;
}

export function useUnreadNotificationsCount() {
    const { user } = useUser();
    const firestore = useFirestore();

    const unreadQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, 'users', user.uid, 'notifications'),
          where('isRead', '==', false)
        );
    }, [firestore, user]);

    const { data: unreadNotifications } = useCollection<Notification>(unreadQuery);

    return unreadNotifications?.length || 0;
}
