
'use client'

import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Header } from "@/components/layout/header";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/auth/AuthGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  const noHeaderPaths = [
    '/', 
    '/login', 
    '/signup',
    '/home'
  ];

  const noBottomNavPaths = [
     '/', 
    '/login', 
    '/signup',
    '/my-bids',
    '/retailer/dashboard',
    '/help',
    '/about',
    '/privacy',
    '/terms',
    '/notifications',
  ];
  
  const isProfileSubPage = pathname.startsWith('/profile/') && pathname !== '/profile';

  const showHeader = !noHeaderPaths.includes(pathname);
  const showBottomNav = !noBottomNavPaths.includes(pathname) && !isProfileSubPage;
  
  const segments = pathname.split('/').filter(Boolean);
  const isChatPage = segments[0] === 'messages' && segments.length > 1;

  return (
    <html lang="en">
      <head>
        <title>AuctionPrime - The Premier Auction Platform</title>
        <meta name="description" content="A bidding platform for special and rare items." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "font-body antialiased min-h-screen flex flex-col",
        showBottomNav && "pb-16 md:pb-0" // Add padding only when the bottom nav is visible
      )}>
        <FirebaseClientProvider>
          <AuthGate>
            {showHeader && <Header />}
            <main className={cn("flex-grow flex flex-col")}>{children}</main>
            {showBottomNav && <BottomNav />}
          </AuthGate>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

    