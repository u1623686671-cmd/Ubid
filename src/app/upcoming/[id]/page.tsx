'use client';

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { AuctionDetailView } from "@/components/auctions/AuctionDetailView";
import { useUser } from "@/firebase";
import { useEffect, useState } from "react";
import { LoadingGavel } from "@/components/ui/loading-gavel";

export default function UpcomingAuctionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = params.id as string;
  const category = searchParams.get('category');
  const { user, isUserLoading } = useUser();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!category) {
        // Or redirect to a 404 page
        router.replace('/home');
        return;
    }
    setIsAllowed(true);
  }, [isUserLoading, user, router, category]);

  if (!isAllowed || !category) {
      return <LoadingGavel />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <Button onClick={() => router.back()} variant="ghost" className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </Button>
      </div>
      <AuctionDetailView itemId={itemId} category={category} />
    </div>
  );
}
