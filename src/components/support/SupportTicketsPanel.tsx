'use client';

import { Loader2, ShieldAlert, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { HandleTicketButton } from '@/components/support/HandleTicketButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

export type SupportTicketForAdmin = {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    message: string;
    createdAt: any;
    chatId?: string;
};

type SupportTicketsPanelProps = {
    openTickets: SupportTicketForAdmin[] | null;
    closedTickets: SupportTicketForAdmin[] | null;
    isLoading: boolean;
}

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

    if (!time) return <Skeleton className="h-4 w-20 inline-block" />;

    return <>{time}</>;
}


export function SupportTicketsPanel({ openTickets, closedTickets, isLoading }: SupportTicketsPanelProps) {
    
    const renderTicketList = (tickets: SupportTicketForAdmin[] | null, isOpen: boolean) => {
        if (isLoading) {
            return <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
        }
        if (!tickets || tickets.length === 0) {
            return <p className="text-center text-muted-foreground py-8">No {isOpen ? 'open' : 'closed'} support tickets.</p>
        }
        return (
            <div className="space-y-3">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between rounded-md border bg-background/50 p-3">
                        <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            <div className="text-sm text-muted-foreground">From: {ticket.userName} &bull; <TimeAgo timestamp={ticket.createdAt} /></div>
                        </div>
                        {isOpen ? (
                            <HandleTicketButton ticket={ticket} />
                        ) : (
                            ticket.chatId && (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/messages/${ticket.chatId}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        View Chat
                                    </Link>
                                </Button>
                            )
                        )}
                    </div>
                ))}
            </div>
        )
    }

    return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-3"><ShieldAlert className="w-6 h-6 text-primary"/>Support Requests</CardTitle>
            <CardDescription>Handle open tickets or review chats from closed tickets.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="open">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="mt-4">
                    {renderTicketList(openTickets, true)}
                </TabsContent>
                <TabsContent value="closed" className="mt-4">
                    {renderTicketList(closedTickets, false)}
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
