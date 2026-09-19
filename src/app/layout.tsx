import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SleepLab — 30-Day Personal Sleep & Recovery Experiment',
  description: 'A personal 30-day N=1 longitudinal sleep and recovery tracking application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-academic-navy selection:text-white">
        {children}
      </body>
    </html>
  );
}
