
import Link from "next/link";

export function Footer() {

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link href="/home" className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="font-extrabold tracking-tight font-headline text-2xl text-primary">AuctionPrime</span>
          </Link>
          <div className="flex space-x-6 text-sm text-foreground/60">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </div>
           <p className="text-sm text-foreground/60 mt-4 md:mt-0">
            © 2024 AuctionPrime. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

    