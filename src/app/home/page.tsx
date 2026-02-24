
'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Home, LayoutGrid, Plus, User, LogOut, Gavel } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { doc } from "firebase/firestore";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AuctionDetailView } from "@/components/auctions/AuctionDetailView";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { NewListingFlow } from "@/components/retailer/NewListingFlow";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { HomeTab } from "@/components/home/HomeTab";
import { CategoriesTab } from "@/components/home/CategoriesTab";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  
  const [selectedItem, setSelectedItem] = useState<{ id: string, category: string } | null>(null);
  const [isListingDialogOpen, setIsListingDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(userProfileRef);

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
    toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
    })
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Handle opening item details in a dialog on mobile
  const handleItemSelect = useCallback((item: {id: string, category: string}) => {
    if (isMobile) {
      setSelectedItem(item);
    } else {
      router.push(`/${item.category}/${item.id}`);
    }
  }, [isMobile, router]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);
  
  // Restore correct theme when navigating away from alcohol category
  useEffect(() => {
    const htmlElement = document.documentElement;
    // Ensure dark theme is removed if not on the alcohol category tab
    if (activeTab !== 'categories' || searchParams.get('categoryFilter') !== 'alcohol') {
        htmlElement.classList.remove('dark');
    }

    return () => {
        htmlElement.classList.remove('dark');
    };
  }, [activeTab, searchParams]);

  if (isUserLoading || isUserProfileLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-full">
       <Dialog open={!!selectedItem && isMobile} onOpenChange={(isOpen) => { if (!isOpen) setSelectedItem(null); }}>
        <DialogContent className="p-0">
          <DialogHeader className="sr-only"><DialogTitle>Auction Details</DialogTitle><DialogDescription>Viewing details for the selected item.</DialogDescription></DialogHeader>
          <ScrollArea className="h-full w-full">
            <div className="p-4 pt-8 sm:p-6 sm:pt-6">
              {selectedItem && <AuctionDetailView itemId={selectedItem.id} category={selectedItem.category} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={isListingDialogOpen} onOpenChange={setIsListingDialogOpen}>
        <DialogContent className="p-0 flex flex-col h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl">
            <DialogHeader className="p-6 pb-0 shrink-0">
                <DialogTitle className="text-2xl font-bold">Create a New Listing</DialogTitle>
                <DialogDescription>Select a category and fill in the details for your auction.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 px-6">
                <ScrollArea className="h-full w-full pr-6 -mr-6">
                    <NewListingFlow onSuccess={() => setIsListingDialogOpen(false)} />
                </ScrollArea>
            </div>
        </DialogContent>
      </Dialog>

       <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-0 z-30 w-full border-b bg-card">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/home" className="flex items-center space-x-2 mr-6">
                    <span className="font-extrabold tracking-tight font-headline text-2xl text-primary">Ubid</span>
                </Link>
                <div className="hidden md:block">
                    <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                        <TabsTrigger value="home">Home</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2">
                    <div className="flex items-center gap-2 md:hidden">
                        <NotificationBell />
                        <Button size="sm" variant="outline" className="text-primary border-primary font-bold hover:text-primary hover:bg-primary/10 gap-1 px-2" onClick={() => setIsListingDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Add item
                        </Button>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="text-primary border-primary font-bold hover:text-primary hover:bg-primary/10 gap-1 px-2">
                            <Link href="/retailer/new-listing?from=home">
                                <Plus className="h-4 w-4" />
                                Add item
                            </Link>
                        </Button>
                        <NotificationBell />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        {(userProfile?.photoURL || user.photoURL) && <AvatarImage src={userProfile?.photoURL || user.photoURL!} />}
                                        <AvatarFallback>{user.displayName ? getInitials(user.displayName) : 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" /><span>Profile</span></Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/my-bids"><Gavel className="mr-2 h-4 w-4" /><span>My Bids</span></Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/retailer/dashboard"><LayoutGrid className="mr-2 h-4 w-4" /><span>My Listings</span></Link></DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <div className="md:hidden">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                    <TabsTrigger value="home">Home</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>
            </div>
        </div>
        
        <TabsContent value="home" forceMount={activeTab === 'home'}>
            {activeTab === 'home' && <HomeTab handleItemSelect={handleItemSelect} />}
        </TabsContent>

        <TabsContent value="categories" forceMount={activeTab === 'categories'}>
            {activeTab === 'categories' && <CategoriesTab handleItemSelect={handleItemSelect} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
