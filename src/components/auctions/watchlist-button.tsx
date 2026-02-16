
'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type WatchlistButtonProps = {
  itemId: string;
  category: string;
  title: string;
  imageUrl: string;
  auctionStartDate: string;
  auctionEndDate: string;
  className?: string;
  // New props
  isWatched: boolean;
  isWatchlistLoading: boolean;
};

export function WatchlistButton({
  itemId,
  category,
  title,
  imageUrl,
  auctionStartDate,
  auctionEndDate,
  className,
  isWatched,
  isWatchlistLoading,
}: WatchlistButtonProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isInWatchlist = isWatched;

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if the button is inside a Link
    e.stopPropagation();

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You must be logged in to manage your watchlist.',
      });
      return;
    }

    const watchlistRef = doc(firestore, `users/${user.uid}/watchlist`, itemId);

    if (isInWatchlist) {
      // Remove from watchlist
      try {
        await deleteDoc(watchlistRef);
        toast({
          title: 'Removed from Watchlist',
          description: `${title} has been removed from your watchlist.`,
        });
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not remove item from your watchlist.',
        });
      }
    } else {
      // Add to watchlist
      try {
        await setDoc(watchlistRef, {
          itemId,
          category,
          title,
          imageUrl,
          auctionStartDate,
          auctionEndDate,
          addedAt: serverTimestamp(),
        });
        toast({
          variant: 'success',
          title: 'Added to Watchlist!',
          description: `${title} is now being watched.`,
        });
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not add item to your watchlist.',
        });
      }
    }
  };

  if (isWatchlistLoading || !user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white', className)}
        disabled
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleWatchlist}
      className={cn(
        'rounded-full bg-black/30 text-white/80 transition-all duration-300 hover:bg-black/50 hover:text-white',
        isInWatchlist && 'text-red-500 bg-black/50',
        className
      )}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Heart className={cn('h-5 w-5', isInWatchlist && 'fill-current')} />
    </Button>
  );
}
