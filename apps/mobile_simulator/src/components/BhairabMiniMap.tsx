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

const VEHICLE_TOKEN: Record<VehicleType, string> = {
  EASYBIKE: 'easybike',
  BIKE: 'bike',
  CNG: 'cng',
  CAR_MICROBUS: 'microbus',
};

// Leaflet writes polyline colours as SVG attributes, where var() does not resolve, so read the token value.
const tokenColor = (name: string) =>
  `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()})`;

const shortName = (l: BhairabLandmark) => l.banglaName.split('(')[0].trim();

const pin = (fill: string, label: string) => `
  <div style="display:flex;align-items:center;gap:6px;">
    <div style="width:14px;height:14px;border-radius:9999px;background:${fill};border:2px solid rgb(var(--surface));box-shadow:0 1px 2px rgb(var(--ink) / 0.3);flex:none;"></div>
    <span style="background:rgb(var(--surface));color:rgb(var(--ink));border:1px solid rgb(var(--line));padding:2px 6px;border-radius:6px;font-size:12px;font-weight:500;white-space:nowrap;">${label}</span>
  </div>
`;

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
    });
    map.attributionControl.setPrefix(false);

    // shortcut: OSM's public tiles are for light use only; move to Barikoi or a paid tile provider before real traffic
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

    L.marker([pickup.latitude, pickup.longitude], {
      icon: L.divIcon({ className: '', html: pin('rgb(var(--brand))', shortName(pickup)), iconSize: [14, 14] }),
    }).addTo(group);
    L.marker([dropoff.latitude, dropoff.longitude], {
      icon: L.divIcon({ className: '', html: pin('rgb(var(--ink))', shortName(dropoff)), iconSize: [14, 14] }),
    }).addTo(group);

    L.polyline(
      [
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude],
      ],
      {
        color: tokenColor(sosActive ? 'danger' : rideStatus === 'ACCEPTED' ? 'brand' : 'ink-3'),
        weight: 3,
        dashArray: '6, 6',
      },
    ).addTo(group);

    const driverIcon = L.divIcon({
      className: '',
      html: `<div style="width:20px;height:20px;border-radius:9999px;background:rgb(var(--${VEHICLE_TOKEN[vehicleType]}));border:3px solid ${
        sosActive ? 'rgb(var(--danger))' : 'rgb(var(--surface))'
      };box-shadow:0 1px 3px rgb(var(--ink) / 0.35);"></div>`,
      iconSize: [20, 20],
    });

    L.marker([driverLat, driverLng], { icon: driverIcon })
      .bindTooltip(driverName, { direction: 'top' })
      .addTo(group);

    map.fitBounds(
      L.latLngBounds([
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude],
        [driverLat, driverLng],
      ]),
      { padding: [32, 32], maxZoom: 15 },
    );
  }, [pickup, dropoff, driverLat, driverLng, driverName, vehicleType, rideStatus, sosActive]);

  return (
    <div className={`relative isolate w-full ${heightClass} overflow-hidden bg-raised`}>
      <div ref={containerRef} className="w-full h-full z-0" />
      {sosActive && (
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-surface border border-danger text-danger px-2.5 py-1 rounded-full text-[12px] font-medium">
          <span className="w-2 h-2 rounded-full bg-danger" />
          SOS চালু
        </div>
      )}
    </div>
  );
};
