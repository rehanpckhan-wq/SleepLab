'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/Dashboard').then((mod) => mod.Dashboard), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center font-mono text-xs text-academic-slate">
      Initializing SleepLab Workspace...
    </div>
  ),
});

export default function Home() {
  return <Dashboard />;
}
