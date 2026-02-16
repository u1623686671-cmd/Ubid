
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Trophy, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUnreadChatsCount } from '@/hooks/useUnreadChatsCount';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const loggedInNavItems = [
  { href: '/home', icon: Home, label: 'Auctions' },
  { href: '/watchlist', icon: Heart, label: 'Watchlist' },
  { href: '/hall-of-fame', icon: Trophy, label: 'Leaderboards' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const loggedOutNavItems = [
    { href: '/home', icon: Home, label: 'Auctions' },
    { href: '/login', icon: User, label: 'Login' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const unreadChatsCount = useUnreadChatsCount();

  if (isUserLoading) {
      return (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
              <Skeleton className="w-full h-14" />
          </div>
      )
  }

  const navItems = user ? loggedInNavItems : loggedOutNavItems;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card transition-none md:hidden"
    >
        <div className="flex h-14 items-center justify-around font-medium">
            {navItems.map((item) => {
                const href = item.href;
                const isActive = (pathname === href) || (href !== '/home' && pathname.startsWith(href));
                const isMessages = item.href === '/messages';
                
                return (
                    <Link
                        key={item.href}
                        href={href}
                        className={cn(
                            "flex-1 inline-flex flex-col items-center justify-center h-full px-1 group transition-colors",
                            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <div className="relative">
                            <item.icon className="mb-0.5 h-[22px] w-[22px]" />
                            {isMessages && user && unreadChatsCount > 0 && (
                                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                    {unreadChatsCount}
                                </span>
                            )}
                        </div>
                        <span className={cn(
                            "text-[11px]",
                            isActive && ""
                        )}>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    </div>
  );
}
