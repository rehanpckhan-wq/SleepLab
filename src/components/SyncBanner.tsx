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
      setStatusMsg(`Successfully migrated ${res.entriesMigrated} entries and ${res.metricsMigrated} custom metrics to your Supabase account!`);
      setTimeout(() => {
        onMigrationComplete();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to migrate local data to Supabase.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="bg-academic-navy text-white p-4 rounded border border-academic-slate shadow-md my-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <CloudUpload className="w-4 h-4" /> Local Data Found ({localEntriesCount} entries)
        </div>
        <p className="text-paper-200 font-sans text-xs">
          You have local sleep entries recorded on this device. Migrate them to your Supabase account to sync across all your devices.
        </p>
        {statusMsg && <div className="text-emerald-300 font-mono font-bold flex items-center gap-1.5 pt-1"><CheckCircle2 className="w-4 h-4" /> {statusMsg}</div>}
        {errorMsg && <div className="text-rose-300 font-mono flex items-center gap-1.5 pt-1"><AlertCircle className="w-4 h-4" /> {errorMsg}</div>}
      </div>

      <button
        onClick={handleMigrate}
        disabled={migrating}
        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-paper-900 font-mono font-bold rounded transition-colors whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-1.5"
      >
        {migrating ? 'Migrating Data...' : 'Migrate Data to Supabase'}
      </button>
    </div>
  );
};
