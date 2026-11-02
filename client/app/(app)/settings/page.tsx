'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Misc';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import DataSettings from '@/components/settings/DataSettings';
import LabelsSettings from '@/components/settings/LabelsSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import ShortcutsSettings from '@/components/settings/ShortcutsSettings';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const TABS: TabItem[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'labels', label: 'Labels' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'data', label: 'Data' },
];

function SettingsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.some((t) => t.id === requested) ? (requested as string) : 'profile';

  const change = (id: string) => {
    router.replace(id === 'profile' ? pathname : `${pathname}?tab=${id}`, { scroll: false });
  };

  return (
    <>
      <Tabs tabs={TABS} value={tab} onChange={change} className="mb-5" />
      <div role="tabpanel" className="max-w-4xl">
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'appearance' && <AppearanceSettings />}
        {tab === 'labels' && <LabelsSettings />}
        {tab === 'shortcuts' && <ShortcutsSettings />}
        {tab === 'data' && <DataSettings />}
      </div>
    </>
  );
}

export default function SettingsPage() {
  useDocumentTitle('Settings');
  return (
    <>
      <PageHeader title="Settings" description="Your profile, appearance, labels and data." />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <SettingsTabs />
      </Suspense>
    </>
  );
}
