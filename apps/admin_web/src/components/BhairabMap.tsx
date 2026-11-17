import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ActiveRide, BhairabLandmarkData, OnlineDriver, VehicleType } from '../types/admin';
import { Compass, Layers, Navigation, ShieldAlert } from 'lucide-react';

interface BhairabMapProps {
  landmarks: BhairabLandmarkData[];
  drivers: OnlineDriver[];
  activeRides: ActiveRide[];
  selectedVehicleFilter: VehicleType | 'ALL';
  onSelectVehicleFilter: (filter: VehicleType | 'ALL') => void;
  onSelectDriverForTopup?: (driverId: string) => void;
}

const VEHICLE_META: Record<
  VehicleType,
  { emoji: string; labelBn: string; labelEn: string; color: string; bgHex: string }
> = {
  EASYBIKE: {
    emoji: '🛺',
    labelBn: 'ইজিবাইক',
    labelEn: 'Easy-Bike',
    color: '#10B981',
    bgHex: 'rgba(16, 185, 129, 0.18)',
  },
  CNG: {
    emoji: '🛺',
    labelBn: 'সিএনজি',
    labelEn: 'CNG Auto',
    color: '#06B6D4',
    bgHex: 'rgba(6, 182, 212, 0.18)',
  },
  BIKE: {
    emoji: '🏍️',
    labelBn: 'বাইক',
    labelEn: 'Motorbike',
    color: '#F59E0B',
    bgHex: 'rgba(245, 158, 11, 0.18)',
  },
  CAR_MICROBUS: {
    emoji: '🚐',
    labelBn: 'মাইক্রোবাস',
    labelEn: 'Microbus',
    color: '#A855F7',
    bgHex: 'rgba(168, 85, 247, 0.18)',
  },
};

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

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24.0487, 90.9852], // Bhairab Railway Junction center
      zoom: 14,
      zoomControl: true,
    });

    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO | CholoBhairab GIS',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = darkTiles;
    markersLayerRef.current = layerGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch tile theme between Dark Matter and Standard OSM
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors | CholoBhairab GIS',
      maxZoom: 19,
    }).addTo(map);
  }, [mapTheme]);

  // Render Landmarks, Online Drivers, and Active Ride Polylines
  useEffect(() => {
    const layerGroup = markersLayerRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render 6 Bhairab Landmarks
    landmarks.forEach((lm) => {
      const iconHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(11, 19, 30, 0.92);
          border: 1px solid rgba(16, 185, 129, 0.45);
          padding: 3px 8px;
          border-radius: 999px;
          color: #A7F3D0;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
          <span>${lm.banglaName.split('(')[0].trim()}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'bhairab-landmark-pin',
        iconSize: [140, 26],
        iconAnchor: [70, 13],
      });

      const marker = L.marker([lm.latitude, lm.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="min-width: 210px; padding: 2px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #10B981; font-weight: 700;">
            📍 ভৈরব ল্যান্ডমার্ক হাব • ${lm.category.toUpperCase()}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #F8FAFC; margin-top: 3px;">
            ${lm.banglaName}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
            ${lm.englishName}
          </div>
          <div style="font-size: 11px; color: #CBD5E1; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px;">
            ${lm.descriptionBangla}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 6px; font-family: monospace;">
            GPS: ${lm.latitude.toFixed(4)}° N, ${lm.longitude.toFixed(4)}° E
          </div>
        </div>
      `);
      marker.addTo(layerGroup);
    });

    // 2. Render Active Ride Polylines & Pickup/Dropoff Markers
    activeRides
      .filter((r) => r.status !== 'CANCELLED')
      .forEach((ride) => {
        const isSos = Boolean(ride.sosActive);
        const lineColor = isSos
          ? '#F42A41'
          : ride.status === 'ACCEPTED' || ride.status === 'IN_PROGRESS'
          ? '#10B981'
          : '#F59E0B';

        const polyline = L.polyline(
          [
            [ride.pickupLat, ride.pickupLng],
            [ride.dropoffLat, ride.dropoffLng],
          ],
          {
            color: lineColor,
            weight: isSos ? 4 : 3,
            dashArray: '8, 8',
            opacity: 0.9,
          }
        );

        polyline.bindPopup(`
          <div style="min-width: 220px;">
            <div style="font-size: 11px; font-weight: 700; color: ${lineColor};">
              ${isSos ? '🚨 999 SOS জরুরি সতর্কতা!' : `⚡ সক্রিয় ট্রিপ (${ride.status})`}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #F8FAFC; margin-top: 3px;">
              যাত্রী: ${ride.passengerName}
            </div>
            <div style="font-size: 11px; color: #CBD5E1; margin-top: 4px;">
              🟢 পিকআপ: ${ride.pickupAddress}<br/>
              🏁 গন্তব্য: ${ride.dropoffAddress}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #F59E0B; margin-top: 6px;">
              প্রস্তাবিত ভাড়া: ৳${ride.initialOfferFare} ${
          ride.finalAgreedFare ? `• চূড়ান্ত: ৳${ride.finalAgreedFare}` : ''
        }
            </div>
          </div>
        `);
        polyline.addTo(layerGroup);

        // Pickup badge
        const pickupIcon = L.divIcon({
          html: `
            <div class="${isSos ? 'pulse-sos' : 'pulse-emerald'}" style="
              background: ${isSos ? '#F42A41' : '#006A4E'};
              border: 2px solid #FFFFFF;
              color: #FFFFFF;
              padding: 3px 8px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.65);
            ">
              ${isSos ? '🚨 SOS' : '🙋 পিকআপ'} • ৳${ride.finalAgreedFare || ride.initialOfferFare}
            </div>
          `,
          className: 'ride-pickup-marker',
          iconSize: [110, 26],
          iconAnchor: [55, 28],
        });

        L.marker([ride.pickupLat, ride.pickupLng], { icon: pickupIcon }).addTo(layerGroup);
      });

    // 3. Render Online Drivers with Vehicle Type Badges
    const filteredDrivers =
      selectedVehicleFilter === 'ALL'
        ? drivers
        : drivers.filter((d) => d.vehicleType === selectedVehicleFilter);

    filteredDrivers.forEach((driver) => {
      const meta = VEHICLE_META[driver.vehicleType] || VEHICLE_META.EASYBIKE;
      const isLowBalance = driver.walletBalance < 50;
      const borderColor = isLowBalance ? '#F42A41' : meta.color;

      // Slight offset so driver marker sits neatly beside landmark pin
      const latOffset = driver.lat + 0.0014;
      const lngOffset = driver.lng + 0.0012;

      const driverHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #111C2D;
          border: 2px solid ${borderColor};
          padding: 4px 10px;
          border-radius: 999px;
          color: #F8FAFC;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 6px 16px rgba(0,0,0,0.75);
        ">
          <span style="font-size: 14px;">${meta.emoji}</span>
          <span>${meta.labelBn}</span>
          <span style="
            background: ${isLowBalance ? 'rgba(244,42,65,0.25)' : 'rgba(16,185,129,0.2)'};
            color: ${isLowBalance ? '#FCA5A5' : '#6EE7B7'};
            padding: 1px 5px;
            border-radius: 6px;
            font-size: 10px;
          ">
            ${isLowBalance ? '🔒' : ''}৳${driver.walletBalance}
          </span>
        </div>
      `;

      const driverIcon = L.divIcon({
        html: driverHtml,
        className: 'bhairab-driver-marker',
        iconSize: [145, 30],
        iconAnchor: [72, 15],
      });

      const dMarker = L.marker([latOffset, lngOffset], { icon: driverIcon });
      dMarker.bindPopup(`
        <div style="min-width: 225px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 700; color: ${meta.color};">
              ${meta.emoji} ${meta.labelBn} • ${meta.labelEn}
            </span>
            <span style="font-size: 11px; color: #FBBF24; font-weight: 700;">★ ${driver.rating}</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">
            ${driver.driverName}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
            📞 ${driver.driverPhone} • ${driver.vehicleModel}
          </div>
          <div style="
            margin-top: 8px;
            padding: 6px 8px;
            border-radius: 8px;
            background: ${isLowBalance ? 'rgba(244, 42, 65, 0.16)' : 'rgba(16, 185, 129, 0.14)'};
            border: 1px solid ${isLowBalance ? 'rgba(244, 42, 65, 0.4)' : 'rgba(16, 185, 129, 0.3)'};
            font-size: 11px;
            color: ${isLowBalance ? '#FECACA' : '#A7F3D0'};
            font-weight: 600;
          ">
            ওয়ালেট ব্যালেন্স: ৳${driver.walletBalance} BDT
            ${isLowBalance ? '<br/>🔒 বিডিং লকড (নূন্যতম ৫০ টাকা প্রয়োজন)' : ' • ✓ বিডিং সক্রিয়'}
          </div>
        </div>
      `);
      dMarker.addTo(layerGroup);
    });
  }, [landmarks, drivers, activeRides, selectedVehicleFilter]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([24.0487, 90.9852], 14, { animate: true });
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col border border-white/10">
      {/* Map Top Controls Bar */}
      <div className="px-4 py-3 bg-[#0E1726] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>ভৈরব লাইভ জিআইএস রাডার ম্যাপ</span>
              <span className="text-xs font-normal text-slate-400">• Bhairab Live Telemetry Radar</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              রেলওয়ে জংশন, মেঘনা সেতু, কাচারি মোড় ও পুরাতন নদী ঘাট (24.0487°N, 90.9852°E)
            </p>
          </div>
        </div>

        {/* Vehicle Filter Pills + Map Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'সব যান (All)', emoji: '🛰️' },
              { id: 'EASYBIKE', label: 'ইজিবাইক', emoji: '🛺' },
              { id: 'CNG', label: 'সিএনজি', emoji: '🛺' },
              { id: 'BIKE', label: 'বাইক', emoji: '🏍️' },
              { id: 'CAR_MICROBUS', label: 'মাইক্রোবাস', emoji: '🚐' },
            ] as const
          ).map((tab) => {
            const active = selectedVehicleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectVehicleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-white/5'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setMapTheme((prev) => (prev === 'dark' ? 'osm' : 'dark'))}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1"
            title="Switch Radar / Street Map"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mapTheme === 'dark' ? 'স্ট্রিট ম্যাপ' : 'ডার্ক রাডার'}</span>
          </button>

          <button
            onClick={handleRecenter}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
            title="Recenter on Bhairab Junction"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>ভৈরব কেন্দ্র</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-[430px] bg-[#080E17]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-[#0B131E]/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-[11px] flex flex-wrap items-center gap-3 shadow-xl">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            ৬টি ল্যান্ডমার্ক হাব
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span className="w-4 border-t-2 border-dashed border-amber-400 inline-block"></span>
            চলমান বিডিং রুট
          </span>
          <span className="flex items-center gap-1.5 text-rose-300 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>🔒 &lt; ৫০৳ লকড ড্রাইভার</span>
          </span>
        </div>
      </div>
    </div>
  );
};
