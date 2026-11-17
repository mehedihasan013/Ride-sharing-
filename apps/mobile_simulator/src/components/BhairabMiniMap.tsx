import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BhairabLandmark, VehicleType } from '../types';

interface BhairabMiniMapProps {
  pickup: BhairabLandmark;
  dropoff: BhairabLandmark;
  driverLat: number;
  driverLng: number;
  driverName: string;
  vehicleType: VehicleType;
  rideStatus: 'IDLE' | 'SEARCHING' | 'BIDDING' | 'ACCEPTED' | 'COMPLETED';
  sosActive?: boolean;
  heightClass?: string;
}

export const BhairabMiniMap: React.FC<BhairabMiniMapProps> = ({
  pickup,
  dropoff,
  driverLat,
  driverLng,
  driverName,
  vehicleType,
  rideStatus,
  sosActive = false,
  heightClass = 'h-[175px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [24.0487, 90.9852],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Pickup Marker (Bangladesh Emerald)
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: `
        <div style="display:flex;align-items:center;gap:4px;transform:translate(-12px,-12px);">
          <div style="width:22px;height:22px;border-radius:9999px;background:#10B981;border:2.5px solid #064E3B;box-shadow:0 0 12px rgba(16,185,129,0.85);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:800;">P</div>
          <span style="background:rgba(11,19,30,0.92);color:#A7F3D0;border:1px solid rgba(16,185,129,0.45);padding:1px 6px;border-radius:6px;font-size:10px;font-weight:600;white-space:nowrap;">${pickup.banglaName.split('(')[0].trim()}</span>
        </div>
      `,
      iconSize: [24, 24],
    });

    // Dropoff Marker (Crimson / Amber)
    const dropoffIcon = L.divIcon({
      className: 'custom-dropoff-pin',
      html: `
        <div style="display:flex;align-items:center;gap:4px;transform:translate(-12px,-12px);">
          <div style="width:22px;height:22px;border-radius:9999px;background:#F42A41;border:2.5px solid #7F1D1D;box-shadow:0 0 12px rgba(244,42,65,0.85);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:800;">D</div>
          <span style="background:rgba(11,19,30,0.92);color:#FECDD3;border:1px solid rgba(244,42,65,0.45);padding:1px 6px;border-radius:6px;font-size:10px;font-weight:600;white-space:nowrap;">${dropoff.banglaName.split('(')[0].trim()}</span>
        </div>
      `,
      iconSize: [24, 24],
    });

    L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon }).addTo(group);
    L.marker([dropoff.latitude, dropoff.longitude], { icon: dropoffIcon }).addTo(group);

    // Dashed route polyline between Pickup & Dropoff
    L.polyline(
      [
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude],
      ],
      {
        color: sosActive ? '#F42A41' : rideStatus === 'ACCEPTED' ? '#10B981' : '#F59E0B',
        weight: 3.5,
        dashArray: '7, 7',
        opacity: 0.9,
      },
    ).addTo(group);

    // Live Moving Driver Marker
    const emoji =
      vehicleType === 'BIKE'
        ? '🏍️'
        : vehicleType === 'CAR_MICROBUS'
          ? '🚐'
          : '🛺';

    const driverIcon = L.divIcon({
      className: 'custom-driver-pin',
      html: `
        <div style="position:relative;transform:translate(-16px,-16px);">
          <div style="width:32px;height:32px;border-radius:9999px;background:${
            sosActive ? '#F42A41' : rideStatus === 'ACCEPTED' ? '#006A4E' : '#1E293B'
          };border:2px solid ${
            sosActive ? '#FCA5A5' : '#F59E0B'
          };box-shadow:0 0 14px rgba(245,158,11,0.75);display:flex;align-items:center;justify-content:center;font-size:16px;">
            ${emoji}
          </div>
        </div>
      `,
      iconSize: [32, 32],
    });

    L.marker([driverLat, driverLng], { icon: driverIcon })
      .bindTooltip(`${driverName}`, { direction: 'top' })
      .addTo(group);

    // Fit bounds smoothly
    const bounds = L.latLngBounds([
      [pickup.latitude, pickup.longitude],
      [dropoff.latitude, dropoff.longitude],
      [driverLat, driverLng],
    ]);
    map.fitBounds(bounds, { padding: [26, 26], maxZoom: 15 });
  }, [pickup, dropoff, driverLat, driverLng, driverName, vehicleType, rideStatus, sosActive]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-800/90 shadow-inner`}>
      <div ref={containerRef} className="w-full h-full z-0" />
      {/* Floating Map Overlay Pill */}
      <div className="absolute top-2 left-2 z-[400] flex items-center gap-1.5 bg-[#0B131E]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/70 text-[10px] font-bangla text-slate-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>ভৈরব লাইভ জিপিএস ম্যাপ • 24.0487°N</span>
      </div>
      {sosActive && (
        <div className="absolute top-2 right-2 z-[400] bg-rose-600/95 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-bounce shadow-lg">
          🚨 999 SOS ACTIVE
        </div>
      )}
    </div>
  );
};
