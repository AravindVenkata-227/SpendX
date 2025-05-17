
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import ClientOnlyToaster from '@/components/layout/client-only-toaster';

export const metadata: Metadata = {
  title: 'FinTrack AI',
  description: 'Smart Budgeting and Expense Tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
        <ClientOnlyToaster />
      </body>
    </html>
  );
}
