
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingGavel } from '@/components/ui/loading-gavel';

export default function WelcomeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return <LoadingGavel />;
}
