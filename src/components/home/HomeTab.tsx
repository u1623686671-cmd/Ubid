
'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { DollarSign, Calendar, Loader2, Gavel, Hand, Search, Wine, Gem, Palette, CreditCard, Phone, Home, LayoutGrid, Plus, ChevronRight, Shirt, Zap, User, LogOut, X, LogIn, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { WatchlistButton } from "@/components/auctions/watchlist-button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LebanesePlateDisplay } from "@/components/auctions/lebanese-plate-display";
import { PhoneNumberDisplay } from "@/components/auctions/phone-number-display";
import { AuctionTimerBar } from "@/components/auctions/AuctionTimerBar";
import { isPast } from "date-fns";

type BaseAuctionDoc = {
  id: string;
  userId: string;
  description: string;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  auctionStartDate: string;
  auctionEndDate: string;
  imageUrls: string[];
  status: "upcoming" | "live" | "completed";
  minimumBidIncrement: number;
  isFlashAuction?: boolean;
  isPromoted?: boolean;
  viewCount?: number;
};
type AlcoholDoc = BaseAuctionDoc & { name: string; subcategory: string; age: number; };
type OtherDoc = BaseAuctionDoc & { itemName: string; category: string; };
type IconicDoc = BaseAuctionDoc & { itemName: string; category: string; }
type ArtDoc = BaseAuctionDoc & { itemName: string; category: string; }
type PlateDoc = BaseAuctionDoc & { itemName: string; category: string; };
type PhoneNumberDoc = BaseAuctionDoc & { itemName: string; category: string; };
type ApparelDoc = BaseAuctionDoc & { itemName: string; category: string; };

interface HomeTabProps {
    handleItemSelect: (item: {id: string, category: string}) => void;
}

export function HomeTab({ handleItemSelect }: HomeTabProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);

  const watchlistQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/watchlist`);
    }, [firestore, user]);
  const { data: watchlistItems, isLoading: isWatchlistLoading } = useCollection<{id: string}>(watchlistQuery);

  const createLimitedQuery = (collectionName: string, lim: number) => {
      return useMemoFirebase(() => firestore ? query(collection(firestore, collectionName), limit(lim)) : null, [firestore, collectionName, lim]);
  }
  
  const { data: allAlcohol, isLoading: isLoadingAlcohol } = useCollection<AlcoholDoc>(createLimitedQuery('alcohol', 15));
  const { data: allOthers, isLoading: isLoadingOthers } = useCollection<OtherDoc>(createLimitedQuery('others', 15));
  const { data: allIconics, isLoading: isLoadingIconics } = useCollection<IconicDoc>(createLimitedQuery('iconics', 15));
  const { data: allArt, isLoading: isLoadingArt } = useCollection<ArtDoc>(createLimitedQuery('art', 15));
  const { data: allPlates, isLoading: isLoadingPlates } = useCollection<PlateDoc>(createLimitedQuery('plates', 15));
  const { data: allPhoneNumbers, isLoading: isLoadingPhoneNumbers } = useCollection<PhoneNumberDoc>(createLimitedQuery('phoneNumbers', 15));
  const { data: allApparels, isLoading: isLoadingApparels } = useCollection<ApparelDoc>(createLimitedQuery('apparels', 15));

  const areAllListingsLoading = isLoadingAlcohol || isLoadingOthers || isLoadingIconics || isLoadingArt || isLoadingPlates || isLoadingPhoneNumbers || isLoadingApparels;
  
  const auctionCategories = useMemo(() => [
    { data: allAlcohol, type: 'alcohol' }, { data: allArt, type: 'art' }, { data: allApparels, type: 'apparels' },
    { data: allIconics, type: 'iconics' }, { data: allOthers, type: 'others' }, { data: allPlates, type: 'plates' },
    { data: allPhoneNumbers, type: 'phoneNumbers' },
  ], [allAlcohol, allArt, allApparels, allIconics, allOthers, allPlates, allPhoneNumbers]);

  const allItems = useMemo(() => {
    if (areAllListingsLoading) return [];
    const items: any[] = [];
    const now = new Date();
    auctionCategories.forEach(cat => {
        cat.data?.forEach(item => items.push({ ...item, category: cat.type }));
    });
    return items.sort((a, b) => {
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;
        const aIsLive = new Date(a.auctionStartDate).getTime() <= now.getTime();
        const bIsLive = new Date(b.auctionStartDate).getTime() <= now.getTime();
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        if (aIsLive && bIsLive) return new Date(a.auctionEndDate).getTime() - new Date(b.auctionEndDate).getTime();
        return new Date(a.auctionStartDate).getTime() - new Date(b.auctionStartDate).getTime();
    });
  }, [areAllListingsLoading, auctionCategories]);
  
  const allLiveItems = useMemo(() => allItems.filter(item => new Date(item.auctionStartDate) <= new Date() && new Date(item.auctionEndDate) > new Date()), [allItems]);
  const promotedItems = useMemo(() => allLiveItems.filter(item => item.isPromoted), [allLiveItems]);
  const topPicks = useMemo(() => [...allLiveItems].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)), [allLiveItems]);
  const upcomingItems = useMemo(() => allItems.filter(item => new Date(item.auctionStartDate) > new Date()), [allItems]);
  const flashAuctionItems = useMemo(() => allLiveItems.filter(item => item.isFlashAuction).sort((a, b) => (a.isPromoted && !b.isPromoted) ? -1 : (!a.isPromoted && b.isPromoted) ? 1 : (b.bidCount || 0) - (a.bidCount || 0)), [allLiveItems]);

  const getItemTitleSubtitle = useCallback((item: any, type: string) => {
    let title, subtitle;
    switch (type) {
        case 'alcohol': title = item.name; subtitle = item.subcategory; break;
        case 'others': title = item.itemName; subtitle = "Other"; break;
        case 'iconics': title = item.itemName; subtitle = `From ${item.category}`; break;
        case 'art': title = item.itemName; subtitle = item.category; break;
        case 'plates': title = item.itemName; subtitle = item.category; break;
        case 'phoneNumbers': title = item.itemName; subtitle = item.category; break;
        case 'apparels': title = item.itemName; subtitle = item.category; break;
        default: title = 'Untitled'; subtitle = '';
    }
    return { title, subtitle };
  }, []);
  
  const watchlistSet = useMemo(() => {
      if (!watchlistItems) return new Set();
      return new Set(watchlistItems.map(item => item.id));
  }, [watchlistItems]);

  useEffect(() => {
    if (areAllListingsLoading || !allItems.length || !user) return;
    try {
      const viewedCategories: string[] = JSON.parse(localStorage.getItem('viewedCategories') || '[]');
      const viewedItemIds: string[] = JSON.parse(localStorage.getItem('viewedItemIds') || '[]');
      if (viewedCategories.length === 0) { setSuggestedItems([]); return; }
      const categoryCounts = viewedCategories.reduce((acc, category) => ({...acc, [category]: (acc[category] || 0) + 1}), {} as Record<string, number>);
      const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]).slice(0, 3);
      const suggestions = allItems
        .filter(item => topCategories.includes(item.category) && !viewedItemIds.includes(item.id) && item.userId !== user.uid && new Date(item.auctionStartDate) <= new Date() && new Date(item.auctionEndDate) > new Date())
        .sort(() => 0.5 - Math.random()).slice(0, 10);
      setSuggestedItems(suggestions);
    } catch (e) {
      console.error("Could not generate suggestions from localStorage:", e);
      setSuggestedItems([]);
    }
  }, [allItems, areAllListingsLoading, user]);

  const renderAuctionRow = (items: any[], isLoading: boolean, viewAllLink?: string) => {
    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="w-[45vw] sm:w-48 shrink-0 overflow-hidden"><CardContent className="p-0"><Skeleton className="w-full h-auto aspect-square rounded-none"/></CardContent><div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-16" /><div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2"><div><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-16 mt-1" /></div><div><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-16 mt-1" /></div></div></div><CardFooter className="p-3 pt-0"><Skeleton className="h-9 w-full" /></CardFooter></Card>
                ))}
            </div>
        );
    }
    if (items.length === 0) return <div className="flex items-center justify-center text-center py-16 bg-muted rounded-lg w-full"><p className="text-muted-foreground">No items in this section yet.</p></div>;
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {items.slice(0, 12).map((item) => {
                const { title, subtitle } = getItemTitleSubtitle(item, item.category);
                const isPlate = item.category === 'plates';
                const isPhoneNumber = item.category === 'phoneNumbers';
                const imageUrl = !isPlate && !isPhoneNumber ? ((item.imageUrls && item.imageUrls[0]) || `https://picsum.photos/seed/${item.id}/600/800`) : '';
                const status = isPast(new Date(item.auctionEndDate)) ? 'completed' : isPast(new Date(item.auctionStartDate)) ? 'live' : 'upcoming';

                return (
                    <Card key={item.id} onClick={() => handleItemSelect({ id: item.id, category: item.category })} className={cn("w-[45vw] sm:w-48 shrink-0 flex flex-col cursor-pointer group h-full shadow-lg transition-colors", !item.isPromoted && "overflow-hidden")}>
                        <CardContent className="p-0">
                           <div className={cn("relative group/image flex items-center justify-center aspect-square", isPlate || isPhoneNumber ? '' : 'bg-muted', !item.isPromoted && "overflow-hidden")}>
                                {isPlate ? <div className="w-full h-full flex items-center justify-center"><LebanesePlateDisplay plateNumber={item.itemName} /></div> : isPhoneNumber ? <div className="w-full h-full flex items-center justify-center"><PhoneNumberDisplay phoneNumber={item.itemName} /></div> : <Image src={imageUrl} alt={title || 'Auction item'} data-ai-hint={item.category} fill className="object-cover" />}
                                {item.isPromoted && <Badge className="absolute bottom-2 left-2 z-10 flex items-center gap-1 border-transparent bg-accent text-accent-foreground text-xs hover:bg-accent/80"><Star className="h-3 w-3" />Sponsored</Badge>}
                                <Badge variant="outline" className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black/50 text-white backdrop-blur-sm border-none text-xs"><Gavel className="h-3 w-3" />{item.bidCount || 0}</Badge>
                                {item.isFlashAuction && <Badge className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-accent text-accent-foreground border border-accent-darker"><Zap className="h-3 w-3" />FLASH</Badge>}
                                <WatchlistButton itemId={item.id} category={item.category} title={title || ''} imageUrl={imageUrl} auctionStartDate={item.auctionStartDate} auctionEndDate={item.auctionEndDate} className="absolute top-2 right-2 z-10" isWatched={watchlistSet.has(item.id)} isWatchlistLoading={isWatchlistLoading || isUserLoading}/>
                            </div>
                        </CardContent>
                        <div className="flex-1 flex flex-col p-3 space-y-2">
                            <div><h3 className="font-headline text-base font-bold mb-1 leading-tight truncate group-hover:underline">{title}</h3><p className="text-xs text-muted-foreground truncate">{subtitle}</p></div>
                            <div className="flex-grow" />
                            <div className="space-y-3"><AuctionTimerBar startDate={item.auctionStartDate} endDate={item.auctionEndDate} isCard /><div className="grid grid-cols-2 gap-2 pt-2 border-t text-left"><div><p className="text-xs text-muted-foreground">Starting Bid</p><p className="text-sm font-semibold">${(item.startingBid ?? 0).toLocaleString()}</p></div><div><p className="text-xs text-muted-foreground">Current Bid</p><p className="text-sm font-semibold">${(item.currentBid ?? 0).toLocaleString()}</p></div></div></div>
                        </div>
                        <CardFooter className="p-3 pt-0">
                             <Button onClick={(e) => { e.stopPropagation(); handleItemSelect({ id: item.id, category: item.category })}} size="sm" variant="outline" className="w-full" disabled={status === 'completed'}>
                                {status === 'live' ? <Gavel className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}<span>{status === 'live' ? 'Bid Now' : status === 'upcoming' ? 'View Item' : 'Auction Ended'}</span>
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
            {items.length > 12 && viewAllLink && (
                <div key="view-all" className="w-[45vw] sm:w-48 shrink-0">
                    <Link href={viewAllLink} className="h-full flex flex-col group items-center justify-center p-3">
                        <div className="relative w-full aspect-square flex items-center justify-center">
                            {items.slice(0, 3).reverse().map((item, index) => {
                                const isPlate = item.category === 'plates';
                                const isPhoneNumber = item.category === 'phoneNumbers';
                                let imageUrl = !isPlate && !isPhoneNumber ? ((item.imageUrls && item.imageUrls[0]) || `https://picsum.photos/seed/${item.id}/200/200`) : '';
                                return (
                                    <div key={item.id} className="absolute w-2/3 aspect-square rounded-md overflow-hidden bg-muted border transition-transform duration-300 ease-in-out group-hover:rotate-0" style={{ transform: `rotate(${index * 8 - 8}deg)`, zIndex: 3 - index, }}>
                                        {isPlate ? <div className="flex items-center justify-center h-full"><LebanesePlateDisplay plateNumber={item.itemName} /></div> : isPhoneNumber ? <div className="flex items-center justify-center h-full"><PhoneNumberDisplay phoneNumber={item.itemName} size="small" /></div> : <Image src={imageUrl} alt="" fill className="object-cover" />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4"><h3 className="font-headline text-base font-bold leading-tight truncate group-hover:underline flex items-center gap-1">See More<ChevronRight className="h-5 w-5 text-muted-foreground" /></h3></div>
                    </Link>
                </div>
            )}
        </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="space-y-12">
            <section><Link href="/top-picks" className="flex justify-between items-center mb-6 group"><h2 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Top Picks For Today</h2><ChevronRight className="w-5 h-5 text-foreground transition-colors group-hover:text-primary" /></Link>{renderAuctionRow(topPicks, areAllListingsLoading, "/top-picks")}</section>
            <section><Link href="/promoted" className="flex justify-between items-center mb-6 group"><h2 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Promoted Listings</h2><ChevronRight className="w-5 h-5 text-foreground transition-colors group-hover:text-primary" /></Link>{renderAuctionRow(promotedItems, areAllListingsLoading, "/promoted")}</section>
            <section><Link href="/upcoming-auctions" className="flex justify-between items-center mb-6 group"><h2 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Upcoming Auctions</h2><ChevronRight className="w-5 h-5 text-foreground transition-colors group-hover:text-primary" /></Link>{renderAuctionRow(upcomingItems, areAllListingsLoading, "/upcoming-auctions")}</section>
            <section><Link href="/flash-auctions" className="flex justify-between items-center mb-6 group"><h2 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Flash Auctions</h2><ChevronRight className="w-5 h-5 text-foreground transition-colors group-hover:text-primary" /></Link>{renderAuctionRow(flashAuctionItems, areAllListingsLoading, "/flash-auctions")}</section>
            <section>
                <Link href="/suggested" className="flex justify-between items-center mb-6 group"><h2 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Suggested For You</h2><ChevronRight className="w-5 h-5 text-foreground transition-colors group-hover:text-primary" /></Link>
                {suggestedItems.length > 0 ? renderAuctionRow(suggestedItems, areAllListingsLoading, "/suggested") : !areAllListingsLoading && <div className="flex overflow-x-auto pb-4 -mx-4 px-4"><div className="flex-shrink-0 w-full text-center py-16 bg-muted rounded-lg"><p className="text-muted-foreground">View some items to get personalized suggestions!</p></div></div>}
                {areAllListingsLoading && suggestedItems.length === 0 && <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">{Array.from({ length: 4 }).map((_, index) => (<div key={index} className="w-[45vw] sm:w-48 shrink-0 flex flex-col cursor-pointer group h-full"><div className="p-0"><Skeleton className="w-full h-auto aspect-square rounded-lg"/></div><div className="p-3 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>))}</div>}
            </section>
        </div>
    </div>
  );
}
