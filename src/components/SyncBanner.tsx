import React, { useState } from 'react';
import { migrateLocalStorageToSupabaseAsync, getLocalEntries } from '@/lib/storage';
import { CloudUpload, CheckCircle2, AlertCircle } from 'lucide-react';

interface SyncBannerProps {
  userId: string;
  onMigrationComplete: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ userId, onMigrationComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const localEntriesCount = getLocalEntries().length;

  if (localEntriesCount === 0) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await migrateLocalStorageToSupabaseAsync(userId);
      setStatusMsg(`Successfully migrated ${res.entriesMigrated} entries and ${res.metricsMigrated} custom metrics to your account.`);
      setTimeout(() => {
        onMigrationComplete();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to migrate local data to account.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="bg-[var(--warning-soft)] text-[var(--text-primary)] p-4 rounded-lg border border-[var(--warning)]/30 my-4 font-sans text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-[var(--warning)] text-sm">
          <CloudUpload className="w-4 h-4" /> Unsynced Local Data Found ({localEntriesCount} entries)
        </div>
        <p className="text-[var(--text-secondary)]">
          You have local sleep entries recorded on this device. Migrate them to your account to sync across all your devices.
        </p>
        {statusMsg && <div className="text-[var(--success)] font-medium flex items-center gap-1.5 pt-1"><CheckCircle2 className="w-4 h-4" /> {statusMsg}</div>}
        {errorMsg && <div className="text-[var(--danger)] font-medium flex items-center gap-1.5 pt-1"><AlertCircle className="w-4 h-4" /> {errorMsg}</div>}
      </div>

      <button
        onClick={handleMigrate}
        disabled={migrating}
        className="px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-md transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
      >
        {migrating ? 'Migrating...' : 'Migrate to Account'}
      </button>
    </div>
  );
};
