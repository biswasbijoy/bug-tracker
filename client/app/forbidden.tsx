'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-[var(--color-warning-light)] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Access Denied</h1>
        <p className="text-xs text-[var(--color-text-secondary)] mb-6">
          You do not have permission to access this page.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
