
"use client";

import dynamic from 'next/dynamic';

const DynamicToaster = dynamic(
  () => import('@/components/ui/toaster').then((mod) => mod.Toaster),
  { ssr: false }
);

export default function ClientOnlyToaster() {
  return <DynamicToaster />;
}
