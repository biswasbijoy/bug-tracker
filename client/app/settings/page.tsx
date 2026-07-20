'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { useTheme } from '@/lib/theme-provider';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts' },
  ];

  const shortcuts = [
    { key: 'Ctrl + K', action: 'Open search' },
    { key: 'N', action: 'New ticket' },
    { key: 'P', action: 'New project' },
    { key: '/', action: 'Focus search' },
    { key: 'Esc', action: 'Close dialog' },
    { key: 'Ctrl + S', action: 'Save form' },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage your account preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Profile Information</h3>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" disabled />
            <div className="flex justify-end pt-2">
              <Button loading={saving}>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 space-y-6">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Appearance</h3>
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      theme === t
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${
                      t === 'light' ? 'bg-white border border-gray-200' :
                      t === 'dark' ? 'bg-gray-800 border border-gray-700' :
                      'bg-gradient-to-br from-white to-gray-800 border border-gray-300'
                    }`} />
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Overdue Ticket Alerts</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Get notified when tickets are past due</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Daily Summary</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Receive a daily summary of your work</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Production Reminders</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Reminders for production deployments</p>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Browser Notifications</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Enable desktop browser notifications</p>
                </div>
                <Switch checked={false} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h3>
            <div className="space-y-3">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">{s.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] bg-[var(--color-border-light)] rounded border border-[var(--color-border)]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
