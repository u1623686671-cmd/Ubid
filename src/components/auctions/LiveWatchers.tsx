'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, Timestamp } from 'firebase/firestore';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';


type Watcher = {
  id: string;
  displayName: string;
  timestamp: Timestamp;
};

type LiveWatchersProps = {
  itemId: string;
  category: string;
};

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export function LiveWatchers({ itemId, category }: LiveWatchersProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [latestJoiner, setLatestJoiner] = useState<string | null>(null);
  // Use a Set in the ref for efficient 'has' checks.
  const previousWatcherIdsRef = useRef<Set<string>>(new Set());
  // Use a ref for the timer to avoid issues with stale closures in setTimeout.
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const watchersColRef = useMemoFirebase(() => {
    if (!firestore || !itemId || !category) return null;
    return collection(firestore, category, itemId, 'watchers');
  }, [firestore, itemId, category]);
  
  const { data: allWatchers } = useCollection<Watcher>(watchersColRef);

  // Filter out stale watchers. A watcher is stale if their timestamp is older than the threshold.
  const watchers = useMemo(() => {
    return allWatchers?.filter(w => {
        if (!w.timestamp?.toMillis) return false; // Filter out entries during creation lag
        const watcherTime = w.timestamp.toMillis();
        return (Date.now() - watcherTime) < STALE_THRESHOLD_MS;
    }) || [];
  }, [allWatchers]);


  // Effect for joining and leaving the auction room
  useEffect(() => {
    if (!user || !firestore || !itemId || !category) return;

    const watcherDocRef = doc(firestore, category, itemId, 'watchers', user.uid);

    // Set or update the user's presence with a server timestamp.
    setDoc(watcherDocRef, {
      displayName: user.displayName || 'Someone',
      timestamp: serverTimestamp(),
    });

    // When the component unmounts (user leaves the page), delete their watcher document.
    return () => {
      deleteDoc(watcherDocRef);
    };
  }, [user, firestore, itemId, category]);

  // Effect for showing "just joined" notifications
  useEffect(() => {
    if (!user) return;
    
    const currentWatcherIds = new Set(watchers.map(w => w.id));
    const previousWatcherIds = previousWatcherIdsRef.current;
    
    // Find new watchers by comparing the current Set with the previous Set from the ref.
    const newWatcherIds = [...currentWatcherIds].filter(id => !previousWatcherIds.has(id));

    if (newWatcherIds.length > 0) {
      // We only care about *other* users joining, not ourselves.
      const newOtherWatcherId = newWatcherIds.find(id => id !== user.uid);

      if (newOtherWatcherId) {
        const newWatcher = watchers.find(w => w.id === newOtherWatcherId);
        if (newWatcher?.displayName) {
          // Get the first name for the notification.
          const firstName = newWatcher.displayName.split(' ')[0];

          // Set the name to be displayed and clear any existing timer.
          setLatestJoiner(firstName);
          if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
          }
          
          // Set a new timer to clear the notification after 4 seconds.
          notificationTimerRef.current = setTimeout(() => {
            setLatestJoiner(null);
            notificationTimerRef.current = null;
          }, 4000);
        }
      }
    }
    
    // Update the ref with the current set of IDs for the next render's comparison.
    previousWatcherIdsRef.current = currentWatcherIds;

  }, [watchers, user]); // This effect depends on the filtered 'watchers' and the current 'user'.


  if (watchers.length === 0) {
    return <div className="h-6" />; // Return placeholder to prevent layout shift
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground h-6 justify-start">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="font-semibold">{watchers.length} watching</span>
        </div>

        {latestJoiner && (
            <div className="text-xs animate-in fade-in slide-in-from-bottom-2">
                {latestJoiner} just joined
            </div>
        )}
    </div>
  );
}
