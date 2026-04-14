'use client';

import dynamic from 'next/dynamic';

const LocationMap = dynamic(
  () => import('./MapComponent').then((mod) => mod.CustomStyleExample),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-slate-100 px-6">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Location
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Preparing the map and nearby places...
          </p>
        </div>
      </div>
    ),
  },
);

export default function LocationMapShell() {
  return (
    <div className="relative z-10">
      <LocationMap />
    </div>
  );
}
