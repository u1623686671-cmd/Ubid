
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {

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
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last Updated: October 26, 2024
          </p>
        </header>

        <div className="space-y-8 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, list an item, or place a bid. This includes your name, email address, and any other information you choose to provide. We also collect information automatically when you use our Platform, such as your IP address and browsing activity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to operate, maintain, and improve our Platform. This includes facilitating transactions between buyers and sellers, personalizing your experience, and communicating with you about your account and our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">3. How We Share Your Information</h2>
            <p>
              We may share your information with other users as necessary to facilitate a transaction (e.g., sharing a seller's contact information with a winning bidder). We do not sell your personal information to third parties. We may also share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">4. Data Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>
          
           <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">5. Your Choices</h2>
            <p>
              You may update, correct, or delete information about you at any time by logging into your account. If you wish to delete your account, please contact us at support@auctionprime.com, but note that we may retain certain information as required by law or for legitimate business purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">6. Children's Privacy</h2>
            <p>
             Our Platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">7. Changes to This Policy</h2>
            <p>
             We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline text-foreground">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@auctionprime.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

    