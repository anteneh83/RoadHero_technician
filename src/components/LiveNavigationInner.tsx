"use client";
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, CheckCircle, Navigation2, Loader2 } from 'lucide-react';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom technician car icon
const techIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom destination (driver) icon
const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto-fitter for bounds
function MapFitter({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [bounds, map]);
  return null;
}

interface LiveNavigationInnerProps {
  jobId: number;
  destLat: number;
  destLng: number;
  destAddress?: string;
  onArrived: () => void;
  onClose: () => void;
}

export default function LiveNavigationInner({ jobId, destLat, destLng, destAddress, onArrived, onClose }: LiveNavigationInnerProps) {
  const [techPos, setTechPos] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string>("");
  const [eta, setEta] = useState<string>("");
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const destPos: [number, number] = [destLat, destLng];
  const watchIdRef = useRef<number | null>(null);

  // 1. Start Geolocation Watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null);
        setTechPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error("Geo error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please allow GPS access.");
        } else {
          setGeoError("Waiting for GPS signal...");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 2. Fetch OSRM Route when TechPos changes
  useEffect(() => {
    if (!techPos) return;

    const fetchRoute = async () => {
      try {
        // OSRM expects: longitude,latitude
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${techPos[1]},${techPos[0]};${destLng},${destLat}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          // GeoJSON returns [lng, lat], Leaflet polyline expects [lat, lng]
          const coords = r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRoute(coords);
          
          // Format distance and ETA
          const distKm = (r.distance / 1000).toFixed(1);
          const durMin = Math.ceil(r.duration / 60);
          setDistance(`${distKm} km`);
          setEta(`${durMin} min`);
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    };

    fetchRoute();
    // Re-fetch route every 30 seconds to adjust for traffic/wrong turns
    const interval = setInterval(fetchRoute, 30_000);
    return () => clearInterval(interval);
  }, [techPos, destLat, destLng]);

  // Determine map bounds
  const bounds = techPos 
    ? L.latLngBounds([techPos, destPos]) 
    : L.latLngBounds([destPos, destPos]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-slide-up">
      
      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 flex items-start justify-between pointer-events-none">
        {/* Info card */}
        <div className="pointer-events-auto rounded-2xl p-4 shadow-2xl w-full max-w-sm"
             style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-white flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-blue-500" /> Live Navigation
            </h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {geoError ? (
            <p className="text-xs text-red-400 font-medium">{geoError}</p>
          ) : !techPos ? (
            <p className="text-xs text-blue-400 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating you...
            </p>
          ) : (
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">ETA</p>
                <p className="text-2xl font-black text-blue-400">{eta || "—"}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Distance</p>
                <p className="text-xl font-bold text-slate-200">{distance || "—"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer center={destPos} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fitter */}
          <MapFitter bounds={bounds} />

          {/* Destination Pin */}
          <Marker position={destPos} icon={destIcon}>
            <Popup><strong>Job Location</strong><br/>{destAddress}</Popup>
          </Marker>

          {/* Tech Pin */}
          {techPos && (
            <Marker position={techPos} icon={techIcon}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}

          {/* Route Line */}
          {route.length > 0 && (
            <Polyline positions={route} color="#3b82f6" weight={5} opacity={0.8} />
          )}
        </MapContainer>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] p-5 pointer-events-none pb-8"
           style={{ background: "linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)" }}>
        <button 
          onClick={onArrived}
          className="pointer-events-auto w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
          <CheckCircle className="w-6 h-6" /> I've Arrived at Location
        </button>
      </div>

    </div>
  );
}
