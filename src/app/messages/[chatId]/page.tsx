'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { ArrowLeft, Send, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

type ParticipantInfo = {
  displayName: string;
  photoURL: string;
};

type Chat = {
  id: string;
  participants: string[];
  participantInfo: { [uid: string]: ParticipantInfo };
  itemTitle: string;
  itemImageUrl: string;
  itemId: string;
  itemCategory: string;
  readBy?: string[];
  type: 'item' | 'support';
};

type Message = {
  id:string;
  senderId: string;
  text: string;
  timestamp: any;
};

// --- Sub-components to avoid duplication ---

function ChatHeader({ chat, otherParticipant }: { chat: Chat, otherParticipant: ParticipantInfo }) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    if (name === 'Support Agent') return 'SA';
    const names = name.split(' ');
    return names.length > 1 && names[0] && names[names.length - 1] ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center gap-3 border-b px-4 h-[60px] shrink-0">
       <Button asChild variant="ghost" className="-ml-2 px-2">
        <Link href="/messages" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline font-medium">Back</span>
        </Link>
      </Button>
      <Avatar className="h-9 w-9">
        <AvatarImage src={otherParticipant?.photoURL} />
        <AvatarFallback>{getInitials(otherParticipant?.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow overflow-hidden">
        <h2 className="font-semibold truncate">{otherParticipant?.displayName || 'User'}</h2>
        <p className="text-xs text-muted-foreground truncate">
          Regarding: {chat.type === 'item' ? <Link href={`/${chat.itemCategory}/${chat.itemId}`} className="hover:underline">{chat.itemTitle}</Link> : <span>{chat.itemTitle}</span>}
        </p>
      </div>
    </header>
  );
}

function ChatMessages({ messages, otherParticipant, currentUserId }: { messages: Message[] | null, otherParticipant: ParticipantInfo, currentUserId: string }) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    if (name === 'Support Agent') return 'SA';
    const names = name.split(' ');
    return names.length > 1 && names[0] && names[names.length - 1] ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {!messages && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {messages?.map((message, index) => {
        const isSender = message.senderId === currentUserId;
        const isContinuous = index > 0 && messages[index - 1].senderId === message.senderId;

        return (
          <div
            key={message.id}
            className={cn(
              "flex w-full items-start gap-3",
              isSender ? "justify-end" : "justify-start",
              isContinuous ? "mt-2" : "mt-6"
            )}
          >
            {!isSender && (
              <div className="w-9 shrink-0 self-start">
                {!isContinuous && (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={otherParticipant?.photoURL} />
                    <AvatarFallback>{getInitials(otherParticipant?.displayName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                isSender
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="break-words">{message.text}</p>
            </div>
             {isSender && (
                <div className="w-9 shrink-0 self-start">
                    {/* Intentionally empty for alignment */}
                </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function ChatInput({ onSendMessage }: { onSendMessage: (text: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    await onSendMessage(text);
    setText('');
    setIsSending(false);
  };
  
  return (
    <footer className="bg-background/95 backdrop-blur-sm border-t p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={!text.trim() || isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
        </form>
    </footer>
  );
}


// --- Main Page Component ---

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { chatId } = params as { chatId: string };
  const messagesContainerRef = useRef<HTMLDivElement>(null);


  const chatRef = useMemoFirebase(() => {
    if (!firestore || !user || typeof chatId !== 'string') return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, user, chatId]);

  const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

  const otherParticipantId = useMemo(() => {
    if (!chat || !user) return null;
    return chat.participants.find((p) => p !== user.uid);
  }, [chat, user]);

  const otherParticipantIsSupportRef = useMemoFirebase(() => {
    if (!firestore || !otherParticipantId) return null;
    return doc(firestore, 'support', otherParticipantId);
  }, [firestore, otherParticipantId]);

  const { data: otherParticipantIsSupport, isLoading: isOtherParticipantSupportLoading } = useDoc(otherParticipantIsSupportRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!chatRef) return null;
    return query(collection(chatRef, 'messages'), orderBy('timestamp', 'asc'));
  }, [chatRef]);

  const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);
  
  // This effect marks the chat as read by the current user when they open it.
  useEffect(() => {
    if (chat && user && chatRef) {
        if (!chat.readBy?.includes(user.uid)) {
            updateDoc(chatRef, {
                readBy: arrayUnion(user.uid)
            }).catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: chatRef.path,
                    operation: 'update',
                    requestResourceData: { 'readBy (arrayUnion)': user.uid }
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
    }
  }, [chat, user, chatRef]);

  // This effect handles scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!user || !chatRef || !firestore || !chat || !otherParticipantId || !text.trim()) return;

    const messageData = {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp(),
    };
    const messagesColRef = collection(chatRef, 'messages');
    
    addDoc(messagesColRef, messageData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messagesColRef.path,
            operation: 'create',
            requestResourceData: messageData,
        }));
    });

    const chatUpdateData = {
        lastMessage: messageData,
        readBy: [user.uid],
    };
    updateDoc(chatRef, chatUpdateData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: chatRef.path,
            operation: 'update',
            requestResourceData: chatUpdateData,
        }));
    });

    const notificationData = {
        type: 'new_message',
        title: `New message from ${user.displayName || 'a user'}`,
        body: text,
        link: `/messages/${chatId}`,
        isRead: false,
        timestamp: serverTimestamp(),
    };
    const notificationsColRef = collection(firestore, 'users', otherParticipantId, 'notifications');
    addDoc(notificationsColRef, notificationData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: notificationsColRef.path,
            operation: 'create',
            requestResourceData: notificationData
        }));
    });
    
    return Promise.resolve();
  };

  if (isUserLoading || isChatLoading || isOtherParticipantSupportLoading) {
    return (
        <div className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-3xl h-[75vh] flex flex-col bg-background rounded-lg border overflow-hidden shadow-lg">
                <header className="flex items-center gap-3 border-b px-4 h-[60px] shrink-0">
                    <Skeleton className="h-9 w-20 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </header>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-10 w-3/4 rounded-lg" />
                    <div className="flex justify-end w-full"><Skeleton className="h-10 w-1/2 rounded-lg self-end" /></div>
                    <Skeleton className="h-12 w-2/3 rounded-lg" />
                </div>
                <footer className="bg-background border-t p-3">
                    <Skeleton className="h-10 w-full" />
                </footer>
            </div>
        </div>
    );
  }

  if (!chat) {
    return (
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Chat not found</AlertTitle>
                <AlertDescription>This conversation does not exist or you do not have permission to view it.</AlertDescription>
            </Alert>
             <Button asChild variant="link" className="mt-4">
                <Link href="/messages">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Messages
                </Link>
            </Button>
        </div>
    );
  }
  
  if (!otherParticipantId || !chat.participantInfo[otherParticipantId] || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const otherParticipantRealInfo = chat.participantInfo[otherParticipantId];
  let displayParticipantInfo = otherParticipantRealInfo;

  // If this is a support chat and the OTHER person is a support agent.
  if (chat.type === 'support' && otherParticipantIsSupport) {
    displayParticipantInfo = {
      displayName: 'Support Agent',
      photoURL: '' // This will trigger the fallback avatar
    };
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-3xl h-[75vh] flex flex-col bg-background rounded-lg border overflow-hidden shadow-lg relative">
          <ChatHeader chat={chat} otherParticipant={displayParticipantInfo} />
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
              <ChatMessages messages={areMessagesLoading ? null : messages} otherParticipant={displayParticipantInfo} currentUserId={user.uid} />
          </div>
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
    </div>
  );
}
