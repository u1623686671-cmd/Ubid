'use client';

import { Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingGavel({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[70vh]", className)}>
        <div className="relative -ml-4">
            <Gavel className="relative w-20 h-20 text-primary origin-bottom-left animate-gavel-swing" />
        </div>
    </div>
  );
}
