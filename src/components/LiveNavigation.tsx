"use client";
import dynamic from 'next/dynamic';

// Dynamically import the inner Leaflet map with no SSR
const LiveNavigationInner = dynamic(() => import('./LiveNavigationInner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#0f172a" }}>
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-full" style={{ border: "4px solid rgba(59,130,246,0.2)", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }} />
        <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>Loading Live Tracker...</p>
      </div>
    </div>
  )
});

interface LiveNavigationProps {
  jobId: number;
  destLat: number;
  destLng: number;
  destAddress?: string;
  onArrived: () => void;
  onClose: () => void;
}

export default function LiveNavigation(props: LiveNavigationProps) {
  return <LiveNavigationInner {...props} />;
}
