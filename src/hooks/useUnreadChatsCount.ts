
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';

type ChatWithReadBy = {
  readBy?: string[];
  lastMessage?: {
      senderId: string;
  }
}

export function useUnreadChatsCount() {
    const { user } = useUser();
    const firestore = useFirestore();

    const chatsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
        collection(firestore, 'chats'),
        where('participants', 'array-contains', user.uid)
        );
    }, [firestore, user]);

    const { data: chats } = useCollection<ChatWithReadBy>(chatsQuery);

    const unreadCount = useMemo(() => {
        if (!chats || !user) return 0;
        
        return chats.filter(chat => {
            // To be unread for the current user, two conditions MUST be met:
            // 1. The last message must have been sent by someone else.
            // 2. The current user's ID must NOT be in the `readBy` array.
            if (!chat.lastMessage || chat.lastMessage.senderId === user.uid) {
                return false;
            }
            return !chat.readBy?.includes(user.uid);
        }).length;
    }, [chats, user]);

    return unreadCount;
}
