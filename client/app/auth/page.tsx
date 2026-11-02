'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ViewColumnsIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Segmented } from '@/components/ui/Tabs';
import { Logo } from '@/components/layout/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

type Mode = 'login' | 'register';

const POINTS = [
  { icon: ViewColumnsIcon, title: 'See the whole pipeline', text: 'From to-do through QA to release, on one board.' },
  { icon: BoltIcon, title: 'Fast by default', text: 'Press C to create, Ctrl K to jump anywhere.' },
  { icon: CheckCircleIcon, title: 'Your data stays yours', text: 'Everything is stored in your local MongoDB.' },
];

export default function AuthPage() {
  useDocumentTitle('Sign in');
  const router = useRouter();
  const { user, isLoading, loadUser, login, register } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [isLoading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      router.replace('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in'));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-accent-fg lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.2 4.2L19 7.5" />
            </svg>
          </span>
          Tracker
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Ship with confidence. Track every ticket to done.</h2>
          <ul className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <p.icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="block text-[13px] text-white/75">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Runs entirely on your machine.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-lg font-semibold text-fg">Tracker</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            {mode === 'login' ? 'Sign in to continue to your workspace.' : 'It only takes a moment.'}
          </p>

          <Segmented<Mode>
            className="mt-6 w-full [&>button]:flex-1 [&>button]:justify-center"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError('');
            }}
            options={[
              { value: 'login', label: 'Sign in' },
              { value: 'register', label: 'Create account' },
            ]}
          />

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'register' && (
              <Input label="Name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              hint={mode === 'register' ? 'At least 6 characters.' : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {error && (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
