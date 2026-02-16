'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { MessageSquarePlus, Search, LifeBuoy, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import Loading from './loading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ParticipantInfo = {
  displayName: string;
  photoURL: string;
};

type LastMessage = {
  text: string;
  timestamp: any;
  senderId: string;
};

type Chat = {
  id: string;
  participants: string[];
  participantInfo: { [uid: string]: ParticipantInfo };
  lastMessage?: LastMessage;
  itemTitle?: string;
  type: 'item' | 'support';
  readBy?: string[];
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
        } else {
            setTime('just now');
        }
    }, [timestamp]);

    if (!time) return <Skeleton className="h-4 w-20" />;

    return <>{time}</>;
}


export default function MessagesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAllowed, setIsAllowed] = useState(false);

  const { data: supportUser, isLoading: isSupportLoading } = useDoc(useMemoFirebase(() => user ? doc(firestore, 'support', user.uid) : null, [firestore, user]));
  const { data: adminUser, isLoading: isAdminLoading } = useDoc(useMemoFirebase(() => user ? doc(firestore, 'admins', user.uid) : null, [firestore, user]));
  const isAgent = !!(supportUser || adminUser);
  const isRoleLoading = isSupportLoading || isAdminLoading;
  
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    setIsAllowed(true);
  }, [isUserLoading, user, router]);


  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: chats, isLoading: areChatsLoading } = useCollection<Chat>(chatsQuery);

  const { marketplaceChats, supportChats } = useMemo(() => {
    if (!chats) return { marketplaceChats: [], supportChats: [] };

    const marketplace: Chat[] = [];
    const support: Chat[] = [];

    chats.forEach(chat => {
      if (chat.type === 'support') {
        support.push(chat);
      } else {
        marketplace.push(chat);
      }
    });

    const sortFn = (a: Chat, b: Chat) => {
      // Treat chats without a lastMessage as the oldest
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;

      const timeA = a.lastMessage.timestamp;
      const timeB = b.lastMessage.timestamp;

      // Treat chats with a null timestamp (pending server write) as the newest
      if (timeA === null && timeB === null) return 0;
      if (timeA === null) return -1; // a is newer
      if (timeB === null) return 1;  // b is newer

      // Treat chats with a non-null but non-timestamp object (e.g., pending write object) as newer
      if (!timeA?.seconds) return -1;
      if (!timeB?.seconds) return 1;

      // Both have valid timestamps, sort descending.
      return timeB.seconds - timeA.seconds;
    };

    return { 
      marketplaceChats: marketplace.sort(sortFn),
      supportChats: support.sort(sortFn)
    };
  }, [chats]);
  
  const filteredMarketplaceChats = useMemo(() => {
    if (!searchTerm) {
      return marketplaceChats;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return marketplaceChats.filter(chat => {
      const otherParticipantId = chat.participants.find(p => p !== user?.uid);
      if (!otherParticipantId) return false;

      const otherParticipantInfo = chat.participantInfo[otherParticipantId];
      const nameMatch = otherParticipantInfo?.displayName?.toLowerCase().includes(lowercasedFilter);
      const lastMessageMatch = chat.lastMessage?.text?.toLowerCase().includes(lowercasedFilter);
      const itemTitleMatch = chat.itemTitle?.toLowerCase().includes(lowercasedFilter);

      return nameMatch || lastMessageMatch || itemTitleMatch;
    });
  }, [marketplaceChats, searchTerm, user]);

  const filteredSupportChats = useMemo(() => {
    if (!searchTerm) {
      return supportChats;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return supportChats.filter(chat => {
      const otherParticipantId = chat.participants.find(p => p !== user?.uid);
      if (!otherParticipantId) return false;

      const otherParticipantInfo = chat.participantInfo[otherParticipantId];
      const nameMatch = otherParticipantInfo?.displayName?.toLowerCase().includes(lowercasedFilter);
      const lastMessageMatch = chat.lastMessage?.text?.toLowerCase().includes(lowercasedFilter);

      return nameMatch || lastMessageMatch;
    });
  }, [supportChats, searchTerm, user]);


  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    if (name === 'Support Agent') return 'SA';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  if (!isAllowed) {
    return <Loading />;
  }
  
  if (!user) {
      return <Loading />; // router.replace will handle it
  }

  const renderChatList = (chatList: Chat[], isSupport: boolean) => {
    if (areChatsLoading || isRoleLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (chatList.length > 0) {
      return (
        <div className="space-y-4">
          {chatList.map((chat) => {
            const otherParticipantId = chat.participants.find((p) => p !== user?.uid);
            if (!otherParticipantId) return null;

            const otherParticipantInfo = chat.participantInfo[otherParticipantId];
            const isUnread = !!(chat.lastMessage && chat.lastMessage.senderId !== user?.uid && !chat.readBy?.includes(user!.uid));
            
            let displayName = otherParticipantInfo?.displayName || 'User';
            let displayPhotoURL = otherParticipantInfo?.photoURL;

            if (isSupport && !isAgent) {
                displayName = "Support Agent";
                displayPhotoURL = ""; // will use fallback
            }

            return (
              <Link href={`/messages/${chat.id}`} key={chat.id} className="block">
                <Card className={`shadow-lg border-0 hover:bg-muted/50 transition-colors ${isUnread ? 'bg-secondary' : ''}`}>
                  <div className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={displayPhotoURL} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold truncate ${isUnread ? 'text-primary' : ''}`}>
                          {displayName}
                        </h3>
                        {chat.lastMessage?.timestamp && <div className="text-xs text-muted-foreground shrink-0 ml-2"><TimeAgo timestamp={chat.lastMessage.timestamp} /></div>}
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {chat.lastMessage?.text || `Chat about ${chat.itemTitle}`}
                      </p>
                    </div>
                    {isUnread && <div className="w-2.5 h-2.5 rounded-full bg-primary self-center shrink-0"></div>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      );
    }

    if (isSupport) {
      return (
        <div className="text-center text-muted-foreground flex flex-col items-center gap-6 max-w-md mx-auto py-16">
          <LifeBuoy className="w-24 h-24 text-primary/10" />
          <h2 className="text-2xl font-bold font-headline text-foreground">No Active Support Chats</h2>
          <p>
            When a user requests help, the conversation will appear here.
          </p>
        </div>
      );
    }
    
    return (
        <div className="flex-grow flex items-center justify-center">
            <div className="text-center text-muted-foreground flex flex-col items-center gap-6 max-w-md mx-auto py-16 px-4">
                <MessageSquarePlus className="w-24 h-24 text-primary/10" />
                <h2 className="text-2xl font-bold font-headline text-foreground">
                    {searchTerm ? 'No results found' : 'No Conversations Yet'}
                </h2>
                <p>
                    {searchTerm
                     ? `Your search for "${searchTerm}" did not match any conversations.`
                     : "When you win an auction or sell an item, your marketplace conversations will appear here."}
                </p>
                {marketplaceChats.length === 0 && !isSupport && (
                    <Button asChild>
                        <Link href="/home">Explore Auctions</Link>
                    </Button>
                )}
            </div>
        </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl flex-grow flex flex-col">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">
          Messages
        </h1>
        <p className="text-lg text-muted-foreground">Your conversations will appear here.</p>
      </header>
      
      <div className="relative w-full sm:max-w-xs mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full bg-background shadow-sm pl-10"
          />
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="mt-6">
              {renderChatList(filteredMarketplaceChats, false)}
            </TabsContent>
            
            <TabsContent value="support" className="mt-6">
              {renderChatList(filteredSupportChats, true)}
            </TabsContent>
        </Tabs>
    </div>
  );
}
