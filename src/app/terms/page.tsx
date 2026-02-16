
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {

  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <div className="mb-8">
            <Button asChild variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                <Link href="/profile">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
        </div>
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            TERMS AND CONDITIONS
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: 16/02/2026
          </p>
        </header>

        <div className="space-y-8 text-muted-foreground">
           <p>
            These Terms and Conditions (“Terms”) govern your access to and use of UBID (the “Platform”, “Service”, “we”, “us”, or “our”). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.
          </p>
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">1. Nature of the Platform</h2>
            <p>
              UBID is an online marketplace that enables users to list items for auction and submit bids. We do not sell, purchase, own, inspect, store, or deliver items listed on the Platform. We only provide a venue for users to connect. Transactions, communications, and agreements between buyers and sellers occur entirely at their own risk and responsibility.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">2. No Payment Processing for Transactions</h2>
            <p>
              The Platform does not process, manage, or facilitate payments between buyers and sellers for auctioned items. Any payment arrangement between users is conducted independently outside the Platform. We are not a party to any transaction and assume no responsibility for payment disputes, refunds, delivery, or performance. The only payments processed by the Platform relate to subscription fees for access to certain features or services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">3. No Guarantee of User Conduct or Intent</h2>
            <p>
              We do not verify or guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li>the identity of any user</li>
                <li>that buyers are serious or financially capable</li>
                <li>that sellers actually own listed items</li>
                <li>the accuracy of listings</li>
                <li>the authenticity, legality, safety, or quality of items</li>
                <li>that a transaction will be completed</li>
                <li>that bids are genuine or binding</li>
            </ul>
            <p>
                The Platform is intended as a tool for connecting users and may also be used for entertainment or casual participation. Users assume full responsibility for evaluating other users and proceeding with any transaction.
            </p>
          </section>
          
           <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">4. User Responsibilities</h2>
            <p>
              By using the Platform, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li>provide accurate information</li>
                <li>comply with all applicable laws and regulations</li>
                <li>list only items you have the right to sell</li>
                <li>not engage in fraud, misrepresentation, or deceptive practices</li>
                <li>not manipulate bidding or interfere with auctions</li>
                <li>resolve disputes directly with other users</li>
            </ul>
            <p>
                You are solely responsible for your listings, bids, communications, and agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">5. Subscriptions</h2>
            <p>
              Some features may require a paid subscription. By purchasing a subscription, you agree that:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>fees are charged as described at the time of purchase</li>
                <li>subscriptions may renew automatically unless cancelled</li>
                <li>fees are non-refundable except where required by law</li>
            </ul>
             <p>
                We may modify subscription pricing or features at any time with reasonable notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">6. Platform Availability</h2>
            <p>
             We do not guarantee uninterrupted or error-free operation of the Platform. We may modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">7. Disputes Between Users</h2>
            <p>
              We are not responsible for disputes between buyers and sellers. We are not obligated to:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>mediate disputes</li>
                <li>enforce transactions</li>
                <li>recover payments</li>
                <li>verify claims</li>
                <li>provide compensation</li>
            </ul>
            <p>Any dispute must be resolved directly between the parties involved.</p>
          </section>

           <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">8. Prohibited Items and Activities</h2>
            <p>
             Users must not list or trade items that are illegal, counterfeit, stolen, unsafe, or otherwise prohibited by applicable law. We reserve the right to remove listings or suspend accounts at our sole discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, UBID and its operators shall not be liable for:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>failed transactions</li>
                <li>fraudulent users</li>
                <li>inaccurate listings</li>
                <li>losses resulting from buyer or seller conduct</li>
                <li>damages arising from use of the Platform</li>
                <li>indirect, incidental, or consequential damages</li>
            </ul>
             <p>
                Use of the Platform is at your own risk.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">10. No Warranty</h2>
            <p>
                The Platform is provided “as is” and “as available”. We make no warranties regarding:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>reliability</li>
                <li>accuracy</li>
                <li>user behavior</li>
                <li>transaction success</li>
                <li>suitability for any purpose</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">11. Account Suspension or Termination</h2>
            <p>
              We may suspend or terminate accounts at our discretion, including for:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>violation of these Terms</li>
                <li>suspected fraud</li>
                <li>misuse of the Platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">12. Changes to These Terms</h2>
            <p>
             We may update these Terms at any time. Continued use of the Platform after changes means you accept the revised Terms.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">14. Acknowledgment</h2>
            <p>
              By using the Platform, you acknowledge that:
            </p>
             <ul className="list-disc list-inside space-y-2">
                <li>the Platform is only a connection service</li>
                <li>transactions are entirely your responsibility</li>
                <li>users may not be verified or serious</li>
                <li>the Platform does not guarantee outcomes</li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  );
}
