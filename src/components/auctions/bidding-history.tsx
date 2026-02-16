'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";

type Bid = {
  id?: string;
  amount: number;
  bidderName: string;
  timestamp: any; // Can be Firestore Timestamp
};


type BiddingHistoryProps = {
  history: Bid[];
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

    if (!time) return <Skeleton className="h-4 w-20 inline-block" />;

    return <>{time}</>;
}

export function BiddingHistory({ history }: BiddingHistoryProps) {
  if (history.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History />
                    <span>Bidding History</span>
                </CardTitle>
                <CardDescription>No bids have been placed yet.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History />
          <span>Bidding History</span>
        </CardTitle>
        <CardDescription>See the latest bidding activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-4">
            {history
                .sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                .map((bid, index) => {
                    return (
                        <div key={index} className="flex justify-between items-center gap-4">
                            <div>
                            <p className="font-semibold">${bid.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">by {bid.bidderName}</p>
                            </div>
                            <div className="text-sm text-muted-foreground text-right shrink-0">
                                <TimeAgo timestamp={bid.timestamp} />
                            </div>
                        </div>
                    )
                })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
