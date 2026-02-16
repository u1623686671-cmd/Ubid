
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDoc, doc, setDoc, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SupportTicket = {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    message: string;
    chatId?: string;
    createdAt: any;
};

type HandleTicketButtonProps = {
    ticket: SupportTicket;
};

async function getOrCreateSupportChat(
  firestore: any,
  supportAgentUser: any,
  ticket: SupportTicket
): Promise<string> {
  // If a chat already exists and is valid, return its ID
  if (ticket.chatId) {
    const chatSnap = await getDoc(doc(firestore, 'chats', ticket.chatId));
    if (chatSnap.exists()) {
      return ticket.chatId;
    }
  }
  
  const supportAgentId = supportAgentUser.uid;
  const endUserId = ticket.userId;

  // Ensure support agent has a user profile for chat info.
  const supportAgentProfileSnap = await getDoc(doc(firestore, 'users', supportAgentId));
  if (!supportAgentProfileSnap.exists()) {
    throw new Error("Could not find your support agent profile. Please log out and back in.");
  }

  // Fetch the end user's profile
  const userProfileSnap = await getDoc(doc(firestore, 'users', endUserId));
  if (!userProfileSnap.exists()) {
    throw new Error("Could not find the user's profile to start the chat.");
  }
  
  const userInfo = userProfileSnap.data();
  const endUserDisplayName = userInfo?.displayName || 'User';
  const endUserPhotoURL = userInfo?.photoURL || null;

  const supportAgentInfo = supportAgentProfileSnap.data();
  
  // Create a reference for the new chat to get its ID in advance
  const newChatRef = doc(collection(firestore, 'chats'));
  const newChatId = newChatRef.id;

  const newChatData = {
    type: 'support',
    participants: [supportAgentId, endUserId],
    participantInfo: {
      [supportAgentId]: {
        displayName: 'Support Agent', // Use a consistent name for agents
        photoURL: supportAgentInfo?.photoURL || null,
      },
      [endUserId]: {
        displayName: endUserDisplayName,
        photoURL: endUserPhotoURL,
      },
    },
    itemTitle: ticket.subject,
    itemId: ticket.id,
    itemCategory: 'supportTickets',
    itemImageUrl: null, 
    lastMessage: { // The user's original message provides the initial context
      text: ticket.message,
      timestamp: ticket.createdAt,
      senderId: ticket.userId,
    },
    readBy: [supportAgentId], // The agent is creating it, so they've "read" it
  };

  // Create chat and update ticket atomically
  const initialBatch = writeBatch(firestore);
  initialBatch.set(newChatRef, newChatData);
  const rootTicketRef = doc(firestore, 'supportTickets', ticket.id);
  initialBatch.update(rootTicketRef, { chatId: newChatId, status: 'closed' });
  await initialBatch.commit();
  
  // Now that chat is created, add the first message to its subcollection
  const firstMessageData = {
      senderId: ticket.userId,
      text: ticket.message,
      timestamp: ticket.createdAt
  };
  await addDoc(collection(firestore, 'chats', newChatId, 'messages'), firstMessageData);

  return newChatId;
}

export function HandleTicketButton({ ticket }: HandleTicketButtonProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = async () => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      const chatId = await getOrCreateSupportChat(firestore, user, ticket);
      router.push(`/messages/${chatId}`);
    } catch (error: any) {
      console.error('Failed to handle ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not handle ticket. ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleChat} disabled={isLoading} size="sm" variant="outline">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquarePlus className="mr-2 h-4 w-4" />
      )}
      <span>{isLoading ? 'Starting Chat...' : 'Handle Ticket'}</span>
    </Button>
  );
}
