'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Panel } from '@/components/ui/Misc';
import { errorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

function ProfilePanel() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const trimmed = name.trim();
  const dirty = trimmed !== (user?.name || '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || !dirty) return;
    setSaving(true);
    try {
      await updateProfile(trimmed);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update your profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Profile">
      <form onSubmit={submit} className="max-w-md space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
          required
          error={name.length > 0 && !trimmed ? 'Name can’t be blank' : undefined}
        />
        <Input label="Email" value={user?.email || ''} disabled readOnly hint="Your email is your sign-in and can’t be changed." />
        <Field label="Role">
          <Badge tone="accent" className="capitalize">
            {user?.role || 'user'}
          </Badge>
        </Field>
        <div className="pt-1">
          <Button type="submit" variant="primary" loading={saving} disabled={!dirty || !trimmed}>
            Save changes
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function PasswordPanel() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    current: !current ? 'Enter your current password' : undefined,
    next: next.length < 6 ? 'Use at least 6 characters' : next === current ? 'Choose a different password' : undefined,
    confirm: confirm !== next ? 'Passwords don’t match' : undefined,
  };
  const show = (k: keyof typeof errors, touched: boolean) => (submitted || touched ? errors[k] : undefined);
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });
  const touch = (k: keyof typeof touched) => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.current || errors.next || errors.confirm) return;
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: current, newPassword: next });
      toast.success('Password updated');
      setCurrent('');
      setNext('');
      setConfirm('');
      setSubmitted(false);
      setTouched({ current: false, next: false, confirm: false });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change your password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Change password">
      <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={() => touch('current')}
          error={show('current', touched.current)}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          onBlur={() => touch('next')}
          hint="At least 6 characters."
          error={show('next', touched.next)}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => touch('confirm')}
          error={show('confirm', touched.confirm)}
        />
        <div className="pt-1">
          <Button type="submit" variant="primary" loading={saving} disabled={!current && !next && !confirm}>
            Update password
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function ProfileSettings() {
  return (
    <div className="space-y-5">
      <ProfilePanel />
      <PasswordPanel />
    </div>
  );
}
