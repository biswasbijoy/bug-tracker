import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-mono text-sm text-fg-subtle">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link href="/dashboard" className="mt-6 inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover">
        Back to home
      </Link>
    </div>
  );
}
