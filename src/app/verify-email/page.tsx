'use client';

import { notFound } from 'next/navigation';

export default function VerifyEmailPage() {
  // This page is no longer used in the simplified signup flow.
  // Calling notFound() will render the nearest not-found page.
  notFound();
}
