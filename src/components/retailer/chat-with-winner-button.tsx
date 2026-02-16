
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, where, addDoc, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Props = {
  itemId: string;
  itemCategory: string;
};

async function getOrCreateChat(
  firestore: any,
  currentUser: any, // The full auth user object from useUser()
  partnerId: string,
  itemId: string,
  itemCategory: string
): Promise<string> {
  const currentUserId = currentUser.uid;

  // 1. Query for existing chats involving the current user (the seller)
  const chatQuery = query(
    collection(firestore, 'chats'),
    where('participants', 'array-contains', currentUserId)
  );

  const querySnapshot = await getDocs(chatQuery);
  let existingChatId: string | null = null;

  // 2. Filter client-side to find the specific chat for this item and winner
  querySnapshot.forEach((doc) => {
    const chat = doc.data();
    // Check if the chat includes the winner (partnerId) and is for the correct item
    if (chat.participants.includes(partnerId) && chat.itemId === itemId) {
      existingChatId = doc.id;
    }
  });

  if (existingChatId) {
    return existingChatId;
  }

  // 3. Chat doesn't exist, so create it.
  const currentUserDocRef = doc(firestore, 'users', currentUserId);
  const currentUserSnap = await getDoc(currentUserDocRef);
  if (!currentUserSnap.exists()) {
    throw new Error("Could not find your user profile. Please log out and back in.");
  }
  const currentUserInfo = currentUserSnap.data();

  // 4. Fetch winner's info (they will be in the 'users' collection)
  const partnerUserDoc = await getDoc(doc(firestore, 'users', partnerId));
  if (!partnerUserDoc.exists()) {
    throw new Error("Could not find the winner's profile information to start the chat.");
  }
  const partnerUserInfo = partnerUserDoc.data();

  // 5. Fetch item info
  const itemDoc = await getDoc(doc(firestore, itemCategory, itemId));
  if (!itemDoc.exists()) {
      throw new Error("Could not find the item information to start the chat.");
  }
  const itemInfo = itemDoc.data();

  // 6. Construct participant info
  const newChatData = {
    participants: [currentUserId, partnerId],
    participantInfo: {
      [currentUserId]: {
        displayName: currentUserInfo.displayName || 'You',
        photoURL: currentUserInfo.photoURL || null,
      },
      [partnerId]: {
        displayName: partnerUserInfo.displayName || 'Winner',
        photoURL: partnerUserInfo.photoURL || null,
      },
    },
    itemId: itemId,
    itemCategory: itemCategory,
    itemTitle:
      itemInfo.name ||
      itemInfo.itemName ||
      itemInfo.title ||
      'Item',
    itemImageUrl: (itemInfo.imageUrls && itemInfo.imageUrls[0]) || null,
    lastMessage: {
      text: 'Auction ended. The seller has started a chat.',
      timestamp: serverTimestamp(),
      senderId: currentUserId,
    },
    readBy: [currentUserId],
    type: 'item'
  };

  // 7. Create the chat document
  const chatDocRef = await addDoc(collection(firestore, 'chats'), newChatData);
  return chatDocRef.id;
}


export function ChatWithWinnerButton({ itemId, itemCategory }: Props) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = async () => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      // 1. Find the winner
      const bidsQuery = query(
        collection(firestore, itemCategory, itemId, 'bids'),
        orderBy('amount', 'desc'),
        limit(1)
      );
      const bidsSnapshot = await getDocs(bidsQuery);

      if (bidsSnapshot.empty) {
        throw new Error('No bids found for this item.');
      }
      const winnerId = bidsSnapshot.docs[0].data().userId;

      if (!winnerId) {
        throw new Error('Could not identify the winner.');
      }
      
      if (winnerId === user.uid) {
        toast({
            variant: 'default',
            title: 'This is you!',
            description: "You can't chat with yourself, even if you are the winner."
        });
        return;
      }

      // 2. Get or create chat
      const chatId = await getOrCreateChat(firestore, user, winnerId, itemId, itemCategory);

      // 3. Navigate to chat
      router.push(`/messages/${chatId}`);
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not start chat. ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleChat} disabled={isLoading} size="sm" className="w-full md:w-auto">
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <MessageSquare />
      )}
      <span className="hidden md:inline">{isLoading ? 'Starting...' : 'Chat with Winner'}</span>
    </Button>
  );
}
