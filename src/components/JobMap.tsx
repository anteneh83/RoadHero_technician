"use client";
import dynamic from 'next/dynamic';

const JobMapInner = dynamic(() => import('./JobMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full rounded-xl mt-3 mb-2 flex items-center justify-center animate-pulse" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.12)" }}>
      <p className="text-xs text-slate-400">Loading map...</p>
    </div>
  )
});

export default function JobMap({ lat, lng, address }: { lat: number; lng: number; address?: string }) {
  return <JobMapInner lat={lat} lng={lng} address={address} />;
}
