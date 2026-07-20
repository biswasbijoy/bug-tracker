'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-[var(--color-primary-light)] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-[var(--color-primary)]">404</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Page Not Found</h1>
        <p className="text-xs text-[var(--color-text-secondary)] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
