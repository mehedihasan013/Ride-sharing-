import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ActiveRide, BhairabLandmarkData, OnlineDriver, VehicleType } from '../types/admin';
import { Crosshair, Layers } from 'lucide-react';

interface BhairabMapProps {
  landmarks: BhairabLandmarkData[];
  drivers: OnlineDriver[];
  activeRides: ActiveRide[];
  selectedVehicleFilter: VehicleType | 'ALL';
  onSelectVehicleFilter: (filter: VehicleType | 'ALL') => void;
  onSelectDriverForTopup?: (driverId: string) => void;
}

// Shared by the admin views: one label and one identity colour per vehicle type.
export const VEHICLE_META: Record<VehicleType, { label: string; token: string; dot: string }> = {
  EASYBIKE: { label: 'ইজিবাইক', token: 'easybike', dot: 'bg-easybike' },
  CNG: { label: 'সিএনজি', token: 'cng', dot: 'bg-cng' },
  BIKE: { label: 'বাইক', token: 'bike', dot: 'bg-bike' },
  CAR_MICROBUS: { label: 'মাইক্রোবাস', token: 'microbus', dot: 'bg-microbus' },
};

export const RIDE_STATUS_LABEL: Record<ActiveRide['status'], string> = {
  SEARCHING: 'চালক খুঁজছে',
  BIDDING: 'দর কষাকষি',
  ACCEPTED: 'গৃহীত',
  ARRIVING: 'চালক আসছেন',
  IN_PROGRESS: 'চলছে',
  COMPLETED: 'সম্পন্ন',
  CANCELLED: 'বাতিল',
};

export const VehicleLabel: React.FC<{ type: VehicleType }> = ({ type }) => {
  const meta = VEHICLE_META[type] || VEHICLE_META.EASYBIKE;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
};

const BHAIRAB_CENTER: L.LatLngExpression = [24.0487, 90.9852];
const MONO = "'Geist Mono', ui-monospace, monospace";

// shortcut: OSM's public tiles are for light use only; move to Barikoi or a paid tile provider before real traffic
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Inline styles can use var(); SVG stroke attributes (polylines) cannot, so resolve the token.
const tokenColor = (name: string) =>
  `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()})`;

// Popup HTML is built from server data; escape it.
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const BhairabMap: React.FC<BhairabMapProps> = ({
  landmarks,
  drivers,
  activeRides,
  selectedVehicleFilter,
  onSelectVehicleFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'osm'>('dark');

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BHAIRAB_CENTER,
      zoom: 14,
      zoomControl: true,
    });

    // Attribution stays visible (OSM tile licence). Dark look comes from the .map-dark CSS filter.
    tileLayerRef.current = L.tileLayer(OSM_TILES, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Toggle via classList: a changing React className would wipe the classes Leaflet adds to the container.
  useEffect(() => {
    mapContainerRef.current?.classList.toggle('map-dark', mapTheme === 'dark');
  }, [mapTheme]);

  // Landmarks, ride routes and online drivers
  useEffect(() => {
    const layerGroup = markersLayerRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Landmarks: neutral labels, they are reference points
    landmarks.forEach((lm) => {
      const name = esc(lm.banglaName.split('(')[0].trim());
      const icon = L.divIcon({
        html: `<div style="display:flex;justify-content:center;"><div style="display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:9999px;background:rgb(var(--surface) / 0.92);border:1px solid rgb(var(--line));color:rgb(var(--ink-2));font-size:12px;font-weight:500;white-space:nowrap;"><span style="width:6px;height:6px;border-radius:9999px;background:rgb(var(--ink-3));"></span>${name}</div></div>`,
        className: 'bhairab-landmark-pin',
        iconSize: [160, 24],
        iconAnchor: [80, 12],
      });

      L.marker([lm.latitude, lm.longitude], { icon, title: lm.banglaName })
        .bindPopup(
          `<div style="min-width:200px;">
            <div style="font-size:14px;font-weight:600;color:rgb(var(--ink));">${esc(lm.banglaName)}</div>
            <div style="font-size:12px;line-height:1.5;color:rgb(var(--ink-2));margin-top:4px;">${esc(lm.descriptionBangla)}</div>
            <div style="font-family:${MONO};font-size:12px;color:rgb(var(--ink-3));margin-top:8px;">${lm.latitude.toFixed(4)}, ${lm.longitude.toFixed(4)}</div>
          </div>`
        )
        .addTo(layerGroup);
    });

    // 2. Ride routes with a fare label at pickup
    activeRides
      .filter((r) => r.status !== 'CANCELLED')
      .forEach((ride) => {
        const isSos = Boolean(ride.sosActive);
        const token = isSos
          ? 'danger'
          : ride.status === 'ACCEPTED' || ride.status === 'IN_PROGRESS'
          ? 'brand-text'
          : 'warning';
        const fare = ride.finalAgreedFare || ride.initialOfferFare;
        const statusText = isSos ? 'SOS সক্রিয়' : RIDE_STATUS_LABEL[ride.status] || ride.status;

        L.polyline(
          [
            [ride.pickupLat, ride.pickupLng],
            [ride.dropoffLat, ride.dropoffLng],
          ],
          {
            color: tokenColor(token),
            weight: isSos ? 4 : 3,
            dashArray: isSos ? undefined : '6, 6',
            opacity: 0.9,
          }
        )
          .bindPopup(
            `<div style="min-width:220px;">
              <div style="font-size:12px;font-weight:500;color:rgb(var(--${token}));">${esc(statusText)}</div>
              <div style="font-size:14px;font-weight:600;color:rgb(var(--ink));margin-top:4px;">${esc(ride.passengerName)}</div>
              <div style="font-size:12px;line-height:1.5;color:rgb(var(--ink-2));margin-top:4px;">${esc(ride.pickupAddress)} &rarr; ${esc(ride.dropoffAddress)}</div>
              <div style="font-family:${MONO};font-size:12px;color:rgb(var(--ink));margin-top:8px;">প্রস্তাব ৳${ride.initialOfferFare}${
                ride.finalAgreedFare ? ` · চূড়ান্ত ৳${ride.finalAgreedFare}` : ''
              }</div>
            </div>`
          )
          .addTo(layerGroup);

        const pillStyle = isSos
          ? 'background:rgb(var(--danger));color:rgb(var(--on-brand));'
          : `background:rgb(var(--surface));color:rgb(var(--ink));border:1px solid rgb(var(--${token}));`;

        const pickupIcon = L.divIcon({
          html: `<div style="display:flex;justify-content:center;"><div class="${isSos ? 'pulse-sos' : ''}" style="${pillStyle}padding:1px 8px;border-radius:9999px;font-family:${MONO};font-size:12px;font-weight:500;white-space:nowrap;">${isSos ? 'SOS ' : ''}৳${fare}</div></div>`,
          className: 'ride-pickup-marker',
          iconSize: [100, 22],
          iconAnchor: [50, 24],
        });

        L.marker([ride.pickupLat, ride.pickupLng], {
          icon: pickupIcon,
          title: `${ride.passengerName}: ${statusText}`,
        }).addTo(layerGroup);
      });

    // 3. Online drivers: small dot in the vehicle colour, danger ring when bidding is locked
    const filteredDrivers =
      selectedVehicleFilter === 'ALL'
        ? drivers
        : drivers.filter((d) => d.vehicleType === selectedVehicleFilter);

    filteredDrivers.forEach((driver) => {
      const meta = VEHICLE_META[driver.vehicleType] || VEHICLE_META.EASYBIKE;
      const isLowBalance = driver.walletBalance < 50;

      // Slight offset so the driver dot does not cover a landmark label
      const latOffset = driver.lat + 0.0014;
      const lngOffset = driver.lng + 0.0012;

      const driverIcon = L.divIcon({
        html: `<span style="display:block;width:10px;height:10px;border-radius:9999px;background:rgb(var(--${meta.token}));border:2px solid rgb(var(--page));${
          isLowBalance ? 'box-shadow:0 0 0 2px rgb(var(--danger));' : ''
        }"></span>`,
        className: 'bhairab-driver-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([latOffset, lngOffset], { icon: driverIcon, title: driver.driverName })
        .bindPopup(
          `<div style="min-width:200px;">
            <div style="font-size:14px;font-weight:600;color:rgb(var(--ink));">${esc(driver.driverName)}</div>
            <div style="font-size:12px;color:rgb(var(--ink-2));margin-top:2px;">${meta.label} · ${esc(driver.vehicleModel)} · রেটিং ${driver.rating}</div>
            <div style="font-family:${MONO};font-size:12px;color:rgb(var(--ink-2));margin-top:2px;">${esc(driver.driverPhone)}</div>
            <div style="font-family:${MONO};font-size:13px;font-weight:500;margin-top:8px;color:rgb(var(--${isLowBalance ? 'danger' : 'ink'}));">ব্যালেন্স ৳${driver.walletBalance}</div>
            <div style="font-size:12px;margin-top:2px;color:rgb(var(--${isLowBalance ? 'danger' : 'ink-3'}));">${
              isLowBalance ? 'বিড বন্ধ: ন্যূনতম ৳৫০ লাগবে' : 'বিড করতে পারবেন'
            }</div>
          </div>`
        )
        .addTo(layerGroup);
    });
  }, [landmarks, drivers, activeRides, selectedVehicleFilter]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(BHAIRAB_CENTER, 14, { animate: true });
    }
  };

  const countFor = (id: VehicleType | 'ALL') =>
    id === 'ALL' ? drivers.length : drivers.filter((d) => d.vehicleType === id).length;

  const filters: { id: VehicleType | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'সব' },
    ...(Object.keys(VEHICLE_META) as VehicleType[]).map((id) => ({
      id,
      label: VEHICLE_META[id].label,
    })),
  ];

  const controlCls =
    'h-8 px-2.5 rounded-md text-[13px] flex items-center gap-1.5 transition-colors duration-150 ease-out';

  return (
    <section className="bg-surface border border-line rounded-lg overflow-hidden" aria-label="লাইভ ম্যাপ">
      <div className="px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">লাইভ ম্যাপ</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-line" role="group" aria-label="যানবাহন ফিল্টার">
            {filters.map((f) => {
              const active = selectedVehicleFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectVehicleFilter(f.id)}
                  className={`${controlCls} h-7 px-2 ${
                    active ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink hover:bg-raised'
                  }`}
                >
                  {f.id !== 'ALL' && (
                    <span className={`h-2 w-2 rounded-full ${VEHICLE_META[f.id].dot}`} aria-hidden />
                  )}
                  <span>{f.label}</span>
                  <span className="font-mono tabular-nums text-xs text-ink-3">{countFor(f.id)}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMapTheme((prev) => (prev === 'dark' ? 'osm' : 'dark'))}
            className={`${controlCls} border border-line text-ink-2 hover:text-ink hover:bg-raised`}
          >
            <Layers className="w-4 h-4" aria-hidden />
            <span>{mapTheme === 'dark' ? 'স্ট্রিট ম্যাপ' : 'ডার্ক ম্যাপ'}</span>
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className={`${controlCls} border border-line text-ink-2 hover:text-ink hover:bg-raised`}
          >
            <Crosshair className="w-4 h-4" aria-hidden />
            <span>ভৈরব কেন্দ্র</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-[430px] bg-page">
        <div ref={mapContainerRef} className="w-full h-full z-0 map-dark" />

        <div className="absolute bottom-3 left-3 z-[400] bg-surface border border-line rounded-md shadow-lg px-3 py-2 text-xs text-ink-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-3" aria-hidden />
            ল্যান্ডমার্ক
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-warning" aria-hidden />
            দর কষাকষি চলছে
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-2 ring-2 ring-danger" aria-hidden />
            ব্যালেন্স ৳৫০-এর নিচে
          </span>
        </div>
      </div>
    </section>
  );
};
