import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Building2, ChevronDown, CheckCircle2, FileText,
  MapPin, Layers, ShieldCheck, LineChart as LineChartIcon,
  Map as MapIcon, AlertTriangle, FileCheck, X, TrendingUp, ArrowUpDown, RefreshCw
} from 'lucide-react';

import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DEFAULT_MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL?.trim() || DEFAULT_MAP_TILE_URL;
const mapAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION?.trim() || DEFAULT_MAP_ATTRIBUTION;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const createColoredMarker = (color: string, index: number) => L.divIcon({
  className: '',
  html: `<div style="
    width: 22px; height: 22px; border-radius: 50%;
    background: ${color}; border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: white; font-weight: 500;
  ">${index + 1}</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

function FlyToMarker({ position, zoom, offsetPixels }: { position: [number, number]; zoom: number; offsetPixels?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      if (offsetPixels) {
        // Add offset to pixel coordinates (adding to Y moves camera down, marker up)
        const targetPoint = map.project(position, zoom).add(offsetPixels as [number, number]);
        const targetLatLng = map.unproject(targetPoint, zoom);
        map.flyTo(targetLatLng, zoom, { animate: true, duration: 1.2 });
      } else {
        map.flyTo(position, zoom, { animate: true, duration: 1.2 });
      }
    }
  }, [position, zoom, offsetPixels, map]);
  return null;
}

const ownershipColors = {
  self: { bg: '#E6F1FB', text: '#185FA5', dot: '#185FA5', label: 'Self-owned' },
  inherited: { bg: '#E1F5EE', text: '#0F6E56', dot: '#0F6E56', label: 'Inherited' },
  joint: { bg: '#FAEEDA', text: '#854F0B', dot: '#BA7517', label: 'Joint' },
  disputed: { bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A', label: 'Disputed' },
};

const titleStatusColors = {
  clear: { color: '#0F6E56', label: 'Clear title' },
  dispute: { color: '#A32D2D', label: 'Dispute pending' },
  mutation_pending: { color: '#854F0B', label: 'Mutation pending' },
  encumbered: { color: '#854F0B', label: 'Encumbered' },
};

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

type LandUnit = 'acres' | 'hectares' | 'sqft' | 'sqm' | 'bigha' | 'guntha' | 'cent';

const UNIT_LABELS: Record<LandUnit, string> = {
  acres: 'Acres',
  hectares: 'Hectares',
  sqft: 'Sq. Ft',
  sqm: 'Sq. Meters',
  bigha: 'Bigha',
  guntha: 'Guntha',
  cent: 'Cent',
};

function formatArea(rawAcres: number | string, targetUnit: LandUnit): string {
  const acres = Number(rawAcres) || 0;
  switch (targetUnit) {
    case 'hectares': return `${(acres * 0.404686).toFixed(2)} ha`;
    case 'sqft': return `${Math.round(acres * 43560).toLocaleString()} sq.ft`;
    case 'sqm': return `${Math.round(acres * 4046.86).toLocaleString()} sq.m`;
    case 'bigha': return `${(acres * 1.6).toFixed(2)} Bigha`; // approx standard
    case 'guntha': return `${(acres * 40).toFixed(1)} Guntha`;
    case 'cent': return `${(acres * 100).toFixed(1)} Cent`;
    case 'acres':
    default: return `${acres.toFixed(2)} Acres`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export interface LandParcel {
  id: string;
  surveyNumber?: string;
  khasraNumber?: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  stateCode: string;
  areaAcres: number;
  areaUnit: string;
  landType: string;
  ownershipType: 'self' | 'inherited' | 'joint' | 'disputed';
  titleStatus: 'clear' | 'dispute' | 'mutation_pending' | 'encumbered';
  registrationDate: string;
  estimatedValue: number;
  latitude: number | null;
  longitude: number | null;
  digilockerDocAvailable: boolean;
  mutationStatus: string;
  source: string;
}

export const mockParcels: LandParcel[] = [
  {
    id: 'p1',
    surveyNumber: 'Survey No. 142/B',
    village: 'Hadapsar',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    areaAcres: 1.2,
    areaUnit: 'acres',
    landType: 'Agricultural',
    ownershipType: 'self',
    titleStatus: 'clear',
    registrationDate: '2018-03-12',
    estimatedValue: 3800000,
    latitude: 18.5204,
    longitude: 73.8567,
    digilockerDocAvailable: true,
    mutationStatus: 'completed',
    source: 'surepass',
  },
  {
    id: 'p2',
    surveyNumber: 'Plot No. 78',
    khasraNumber: 'Sy. 56',
    village: 'Dharwad',
    taluka: 'Dharwad',
    district: 'Dharwad',
    state: 'Karnataka',
    stateCode: 'KA',
    areaAcres: 0.8,
    areaUnit: 'acres',
    landType: 'Residential',
    ownershipType: 'inherited',
    titleStatus: 'clear',
    registrationDate: '2015-06-05',
    estimatedValue: 5200000,
    latitude: 15.4589,
    longitude: 75.0078,
    digilockerDocAvailable: true,
    mutationStatus: 'completed',
    source: 'surepass',
  },
  {
    id: 'p3',
    surveyNumber: 'Survey No. 33/1A',
    village: 'Mysuru',
    taluka: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    stateCode: 'KA',
    areaAcres: 1.1,
    areaUnit: 'acres',
    landType: 'Commercial',
    ownershipType: 'self',
    titleStatus: 'clear',
    registrationDate: '2021-11-20',
    estimatedValue: 8500000,
    latitude: 12.2958,
    longitude: 76.6394,
    digilockerDocAvailable: false,
    mutationStatus: 'pending',
    source: 'surepass',
  },
  {
    id: 'p4',
    khasraNumber: 'Khasra No. 441',
    surveyNumber: 'Khasra No. 441',
    village: 'Varanasi',
    taluka: 'Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    areaAcres: 0.7,
    areaUnit: 'acres',
    landType: 'Agricultural',
    ownershipType: 'disputed',
    titleStatus: 'dispute',
    registrationDate: '2009-01-03',
    estimatedValue: 1200000,
    latitude: 25.3176,
    longitude: 82.9739,
    digilockerDocAvailable: false,
    mutationStatus: 'not_required',
    source: 'manual',
  },
];

interface Props {
  parcels?: LandParcel[];
  isLoading?: boolean;
  hasLandConsent?: boolean;
  onRefresh?: () => void;
}

export default function LandPropertyMap({ parcels = [], isLoading = false, hasLandConsent = true, onRefresh }: Props) {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [showFullRecord, setShowFullRecord] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showDigilockerModal, setShowDigilockerModal] = useState(false);
  const [isFetchingDigilocker, setIsFetchingDigilocker] = useState(false);
  const [activeStateFilter, setActiveStateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'size-asc' | 'size-desc'>('default');
  const [displayUnit, setDisplayUnit] = useState<LandUnit>('acres');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const selectedParcel = useMemo(() => parcels.find(p => p.id === selectedParcelId) ?? null, [selectedParcelId, parcels]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Hide the button if within 20px of the bottom
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 20);
  };

  const filteredParcels = useMemo(() => {
    let result = activeStateFilter === 'all'
      ? [...parcels]
      : parcels.filter(p => p.stateCode === activeStateFilter);

    if (sortBy === 'price-asc') result.sort((a, b) => a.estimatedValue - b.estimatedValue);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.estimatedValue - a.estimatedValue);
    else if (sortBy === 'size-asc') result.sort((a, b) => a.areaAcres - b.areaAcres);
    else if (sortBy === 'size-desc') result.sort((a, b) => b.areaAcres - a.areaAcres);

    return result;
  }, [parcels, activeStateFilter, sortBy]);

  function handleSelectParcel(parcel: LandParcel) {
    setSelectedParcelId(parcel.id);
    if (parcel.latitude && parcel.longitude) {
      setMapCenter([parcel.latitude, parcel.longitude]);
      setMapZoom(13);
    }
  }

  const handleFetchDigilocker = () => {
    setIsFetchingDigilocker(true);
    setTimeout(() => {
      setIsFetchingDigilocker(false);
      setShowDigilockerModal(true);
    }, 1200);
  };

  // Derived states
  const uniqueStates = Array.from(new Set(parcels.map(p => p.stateCode)));

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6 w-full">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
        </div>
        <div className="w-full md:w-2/3">
          <div className="w-full h-[320px] md:h-[450px] bg-muted rounded-[24px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (parcels.length === 0) {
    return (
      <div className="bg-card rounded-[24px] p-12 text-center shadow-sm border border-border">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border">
          <MapPin className="size-8 text-zinc-300" />
        </div>
        <h3 className="text-xl font-display font-medium text-foreground mb-2">
          {!hasLandConsent ? "Provide consent" : "No property found"}
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          {!hasLandConsent 
            ? "Please provide consent to view your land registries."
            : "We searched linked registries for your Aadhaar, but no properties were found."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Left Side: Property List */}
        <div className="relative w-full md:w-1/3 h-[400px] md:h-[450px] flex flex-col">
          {/* Filters & Units */}
          <div className="flex items-center justify-between gap-2 shrink-0 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-hide">
              <button
                onClick={() => setActiveStateFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${activeStateFilter === 'all' ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : 'bg-card text-zinc-600 dark:text-zinc-400 border border-border hover:bg-muted/50'}`}
              >
                All States
              </button>
              {uniqueStates.map(stateCode => (
                <button
                  key={stateCode}
                  onClick={() => setActiveStateFilter(stateCode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${activeStateFilter === stateCode ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : 'bg-card text-zinc-600 dark:text-zinc-400 border border-border hover:bg-muted/50'}`}
                >
                  {stateCode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="bg-card rounded-xl shadow-sm border border-border p-2 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition active:scale-95" title="Sort properties">
                    <ArrowUpDown className="size-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border border-border shadow-lg p-1 bg-card">
                  <DropdownMenuItem onClick={() => setSortBy('default')} className={`text-sm font-medium rounded-lg cursor-pointer px-3 py-2 outline-none transition ${sortBy === 'default' ? 'bg-muted text-foreground' : 'text-zinc-700 dark:text-zinc-300 hover:bg-muted/50'}`}>Default order</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-desc')} className={`text-sm font-medium rounded-lg cursor-pointer px-3 py-2 outline-none transition ${sortBy === 'price-desc' ? 'bg-muted text-foreground' : 'text-zinc-700 dark:text-zinc-300 hover:bg-muted/50'}`}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-asc')} className={`text-sm font-medium rounded-lg cursor-pointer px-3 py-2 outline-none transition ${sortBy === 'price-asc' ? 'bg-muted text-foreground' : 'text-zinc-700 dark:text-zinc-300 hover:bg-muted/50'}`}>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size-desc')} className={`text-sm font-medium rounded-lg cursor-pointer px-3 py-2 outline-none transition ${sortBy === 'size-desc' ? 'bg-muted text-foreground' : 'text-zinc-700 dark:text-zinc-300 hover:bg-muted/50'}`}>Size: Largest first</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size-asc')} className={`text-sm font-medium rounded-lg cursor-pointer px-3 py-2 outline-none transition ${sortBy === 'size-asc' ? 'bg-muted text-foreground' : 'text-zinc-700 dark:text-zinc-300 hover:bg-muted/50'}`}>Size: Smallest first</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="bg-card rounded-xl shadow-sm border border-border px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition active:scale-95">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit:</span>
                    <span className="text-sm font-semibold text-foreground">{UNIT_LABELS[displayUnit]}</span>
                    <ChevronDown className="size-4 text-zinc-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[140px] rounded-xl border border-border shadow-lg p-1 bg-card">
                  {Object.entries(UNIT_LABELS).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setDisplayUnit(key as LandUnit)}
                      className="text-sm font-medium text-foreground rounded-lg cursor-pointer focus:bg-muted hover:bg-muted px-3 py-2 outline-none transition"
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div id="land-list-container" className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar scroll-smooth overscroll-contain" onScroll={handleScroll}>
            {/* Cards */}
            <div className="flex flex-col gap-2 mt-1">
              {filteredParcels.map((parcel, index) => {
                const isSelected = selectedParcelId === parcel.id;
                const ownStyle = ownershipColors[parcel.ownershipType];
                const titleStatus = titleStatusColors[parcel.titleStatus];

                return (
                  <div
                    key={parcel.id}
                    onClick={() => handleSelectParcel(parcel)}
                    className={`bg-card rounded-xl p-3 shadow-sm transition cursor-pointer border ${isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40' : 'border-border hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 flex items-center justify-center size-4 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-[9px] font-bold">
                          {index + 1}
                        </span>
                        <h4 className="text-[13px] font-semibold text-foreground truncate">
                          {parcel.district}, {parcel.stateCode}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {parcel.digilockerDocAvailable && (
                          <ShieldCheck className="size-3.5 text-emerald-500" strokeWidth={2} />
                        )}
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium" style={{ backgroundColor: ownStyle.bg, color: ownStyle.text }}>
                          {ownStyle.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5 mb-2 flex-wrap">
                      <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: titleStatus.color }} />
                      <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{titleStatus.label}</p>
                      {parcel.source === 'manual' && (
                        <>
                          <span className="text-zinc-300 text-[9px] hidden sm:inline">|</span>
                          <span className="text-[9px] font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">Manually verified</span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
                      <div>
                        <p className="text-[9px] uppercase text-zinc-400 font-medium tracking-wider">Area</p>
                        <p className="text-[11px] font-semibold text-foreground mt-0.5">{formatArea(parcel.areaAcres, displayUnit)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase text-zinc-400 font-medium tracking-wider">Est. Value</p>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatINR(parcel.estimatedValue)}</p>
                      </div>
                    </div>

                    {(!parcel.latitude || !parcel.longitude) && (
                      <div className="mt-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium py-1 px-2 rounded-md flex items-center gap-1.5">
                        <MapIcon className="size-3 shrink-0" /> No coordinates — location approximate
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Scroll Indicator Button */}
          {filteredParcels.length > 2 && !isAtBottom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300">
              <button
                onClick={() => document.getElementById('land-list-container')?.scrollBy({ top: 250, behavior: 'smooth' })}
                className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white shadow-xl px-4 py-2 rounded-full text-xs font-bold hover:bg-zinc-800 transition active:scale-95"
              >
                Scroll for more <ChevronDown className="size-4 animate-bounce" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="w-full md:w-2/3 flex flex-col gap-3 relative">
          <div className="flex justify-end absolute -top-12 right-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 bg-card border border-border hover:bg-muted/50 text-zinc-700 dark:text-zinc-300 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 shadow-sm active:scale-95"
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-zinc-400' : 'text-muted-foreground'}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
          <div className="w-full h-[320px] md:h-[450px] rounded-[24px] overflow-hidden border border-border shadow-sm relative z-0">
            <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full" zoomControl={false}>
            <TileLayer
              attribution={mapAttribution}
              url={mapTileUrl}
            />
            <FlyToMarker position={mapCenter} zoom={mapZoom} offsetPixels={selectedParcelId ? [0, 90] : undefined} />
            {filteredParcels.map((parcel, index) => {
              if (!parcel.latitude || !parcel.longitude) return null;
              return (
                <Marker
                  key={parcel.id}
                  position={[parcel.latitude, parcel.longitude]}
                  icon={createColoredMarker(ownershipColors[parcel.ownershipType].dot, index)}
                  eventHandlers={{ click: () => handleSelectParcel(parcel) }}
                >
                  <Popup className="custom-map-popup border-0 shadow-lg">
                    <div className="flex flex-col gap-0.5 min-w-[80px]">
                      <div className="font-semibold text-foreground text-xs">{parcel.district}, {parcel.stateCode}</div>
                      <div className="text-[10px] text-muted-foreground">{formatArea(parcel.areaAcres, displayUnit)}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      <div
        className={`absolute -bottom-16 right-0 left-0 md:left-auto md:right-6 md:w-[72%] lg:w-[62%] max-w-5xl bg-card rounded-t-[24px] md:rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.16)] border border-border transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-10
          ${selectedParcel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
      >
        {selectedParcel && (
          <div className="p-4 md:p-5 relative">
            <button
              onClick={() => setSelectedParcelId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col md:flex-row gap-5 md:gap-6">
              {/* Left Column */}
              <div className="w-full md:w-3/5">
                <h3 className="text-lg md:text-xl font-semibold text-foreground pr-10 mb-4 leading-tight">
                  {selectedParcel.surveyNumber || selectedParcel.khasraNumber || 'Property'} at {selectedParcel.village}, {selectedParcel.taluka}, {selectedParcel.district}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Survey/Khasra</p>
                    <p className="text-sm font-medium text-foreground truncate" title={selectedParcel.surveyNumber || selectedParcel.khasraNumber || 'N/A'}>
                      {selectedParcel.surveyNumber || selectedParcel.khasraNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Area</p>
                    <p className="text-sm font-medium text-foreground">{formatArea(selectedParcel.areaAcres, displayUnit)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Land Type</p>
                        <p className="font-medium text-foreground truncate">{(selectedParcel as any).ownerName || 'Joint Property'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Reg. Date</p>
                    <p className="text-sm font-medium text-foreground truncate">{formatDate(selectedParcel.registrationDate)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Ownership</p>
                    <p className="text-sm font-medium text-foreground capitalize truncate">{selectedParcel.ownershipType.replace('_', ' ')}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Mutation Status</p>
                    <p className="text-sm font-medium text-foreground capitalize truncate">{selectedParcel.mutationStatus.replace('_', ' ')}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Title Status</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="size-1.5 rounded-full" style={{ backgroundColor: titleStatusColors[selectedParcel.titleStatus].color }} />
                      <p className="text-sm font-medium text-foreground truncate">{titleStatusColors[selectedParcel.titleStatus].label}</p>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Source</p>
                    <p className="text-sm font-medium text-foreground uppercase tracking-wide truncate">{selectedParcel.source}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full md:w-2/5 flex flex-col pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-6">
                <div className="mb-4">
                  <p className="text-[11px] text-muted-foreground mb-0.5 font-medium">Estimated Value</p>
                  <p className="text-2xl md:text-3xl font-sans font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 mb-1">
                    {formatINR(selectedParcel.estimatedValue)}
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    * Based on state circle rates and recent transactions in {selectedParcel.taluka}.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 mt-auto">
                  <button
                    onClick={() => setShowFullRecord(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0 group"
                  >
                    <FileText className="size-3.5 group-hover:-translate-y-0.5 transition-transform duration-300" /> View full record
                  </button>
                  <button
                    onClick={() => setShowValuationModal(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-card border border-border text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-muted/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0 group"
                  >
                    <LineChartIcon className="size-3.5 group-hover:scale-110 transition-transform duration-300 text-muted-foreground group-hover:text-zinc-700 dark:group-hover:text-zinc-300" /> Get valuation report
                  </button>
                  <button
                    disabled={!selectedParcel.digilockerDocAvailable || isFetchingDigilocker}
                    onClick={handleFetchDigilocker}
                    className={`flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 group ${selectedParcel.digilockerDocAvailable
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 active:translate-y-0'
                      : 'bg-muted/50 text-zinc-400 cursor-not-allowed border border-border'
                      }`}
                  >
                    {isFetchingDigilocker ? (
                      <div className="size-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className={`size-3.5 ${selectedParcel.digilockerDocAvailable ? 'group-hover:rotate-12 transition-transform duration-300' : ''}`} />
                    )}
                    {isFetchingDigilocker ? 'Fetching...' : selectedParcel.digilockerDocAvailable ? 'Fetch DigiLocker document' : 'No DigiLocker document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Record Modal */}
      {selectedParcel && (
        <Dialog open={showFullRecord} onOpenChange={setShowFullRecord}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl max-h-[calc(100dvh-2rem)] p-0 gap-0 overflow-hidden rounded-2xl border-border bg-muted/50 shadow-2xl sm:rounded-3xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-5 pr-14 text-white sm:p-6 sm:pr-16 md:p-7 md:pr-20">
              <div className="pointer-events-none absolute -right-3 -top-3 opacity-10">
                <MapIcon className="size-24 sm:size-28 md:size-32" />
              </div>
              <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="pr-3 text-2xl font-display font-semibold tracking-tight sm:text-3xl">
                  {selectedParcel.surveyNumber || selectedParcel.khasraNumber || 'Property Record'}
                </DialogTitle>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-zinc-300">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0" /> {selectedParcel.village}, {selectedParcel.taluka}</span>
                  <span className="inline-flex items-center gap-1.5"><Building2 className="size-4 shrink-0" /> {selectedParcel.district}, {selectedParcel.state}</span>
                </div>
                <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 font-mono text-xs text-zinc-200 backdrop-blur-sm">
                  <span className="shrink-0 text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">Record ID</span>
                  <span className="truncate">{selectedParcel.id.toUpperCase()}</span>
                </div>
              </DialogHeader>
            </div>

            <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto p-4 sm:p-6 md:p-7">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-zinc-200/60 dark:bg-zinc-700/60 p-1 sm:mb-6 sm:w-fit">
                  <TabsTrigger value="overview" className="shrink-0 rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="ownership" className="shrink-0 rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm">Ownership & Title</TabsTrigger>
                  <TabsTrigger value="documents" className="shrink-0 rounded-lg px-3 py-2 text-xs sm:px-4 sm:text-sm">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                      <h4 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Layers className="size-4" /> Property Details
                      </h4>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-5 min-[480px]:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Land Type</p>
                          <p className="text-base font-semibold text-foreground">{selectedParcel.landType}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Area</p>
                          <p className="text-base font-semibold text-foreground">{formatArea(selectedParcel.areaAcres, displayUnit)}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Coordinates</p>
                          <p className="break-words font-mono text-sm font-medium text-foreground">
                            {Number(selectedParcel.latitude)?.toFixed(4) || 'N/A'}, {Number(selectedParcel.longitude)?.toFixed(4) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Registration Date</p>
                          <p className="text-base font-semibold text-foreground">{formatDate(selectedParcel.registrationDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col rounded-2xl border border-emerald-100 dark:border-emerald-800/60 bg-gradient-to-br from-white dark:from-zinc-900 to-emerald-50/70 dark:to-emerald-950/40 p-5 shadow-sm sm:p-6">
                      <h4 className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <LineChartIcon className="size-4" /> Valuation Analytics
                      </h4>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Estimated Current Value</p>
                      <p className="text-4xl font-sans font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-5xl">
                        {formatINR(selectedParcel.estimatedValue)}
                      </p>
                      <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-100 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/40 p-3 text-xs font-medium leading-relaxed text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="mt-0.5 size-4 shrink-0" /> Value is estimated to be +12.5% above circle rate
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ownership" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Title Status</p>
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-full" style={{ backgroundColor: titleStatusColors[selectedParcel.titleStatus].color }} />
                          <p className="text-lg font-medium text-foreground">{titleStatusColors[selectedParcel.titleStatus].label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Ownership Type</p>
                        <p className="text-lg font-medium text-foreground capitalize">{selectedParcel.ownershipType.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Mutation Status: <span className="capitalize">{selectedParcel.mutationStatus.replace('_', ' ')}</span></p>
                          <p className="text-xs text-muted-foreground">The property has been successfully mutated in the local land revenue records. Ownership transfers are fully recorded.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                        <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">Encumbrance Warning</p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">Please fetch the latest Encumbrance Certificate (EC) to verify if there are any active loans or liabilities against this parcel.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center gap-3 transition-all ${selectedParcel.digilockerDocAvailable ? 'bg-card border-border hover:border-indigo-300 dark:hover:border-indigo-800/60 hover:shadow-md cursor-pointer' : 'bg-muted/50 border-border opacity-60 grayscale'}`}>
                      <div className={`p-4 rounded-full ${selectedParcel.digilockerDocAvailable ? 'bg-indigo-50 text-indigo-600 dark:text-indigo-400' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'}`}>
                        <ShieldCheck className="size-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">DigiLocker Records</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                          {selectedParcel.digilockerDocAvailable ? 'Official digitized land records are available to fetch.' : 'Not available for this region yet.'}
                        </p>
                      </div>
                      {selectedParcel.digilockerDocAvailable && (
                        <button className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition">Fetch Now</button>
                      )}
                    </div>

                    <div className="bg-card p-5 rounded-2xl border border-border hover:border-emerald-300 dark:hover:border-emerald-800/60 hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <FileCheck className="size-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">7/12 Extract / RTC</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Latest extract pulled from state registry portal.</p>
                      </div>
                      <button className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition">View Document</button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Valuation Report Modal */}
      {selectedParcel && (
        <Dialog open={showValuationModal} onOpenChange={setShowValuationModal}>
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-muted/50 border-border shadow-2xl rounded-2xl">
            <div className="bg-zinc-950 dark:bg-zinc-800 p-5 md:p-6 text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <LineChartIcon className="size-32" />
              </div>
              <DialogHeader className="relative z-10 text-left">
                <div className="flex items-center gap-2 mb-2 text-emerald-200/80 uppercase tracking-widest text-xs font-bold">
                  <TrendingUp className="size-4" /> Official Valuation Report
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-display font-semibold mb-2">
                  {selectedParcel.surveyNumber || selectedParcel.khasraNumber || 'Property'}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-4 text-emerald-100/80 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {selectedParcel.village}, {selectedParcel.district}</span>
                  <span className="flex items-center gap-1.5"><Layers className="size-4" /> {formatArea(selectedParcel.areaAcres, displayUnit)}</span>
                </div>
              </DialogHeader>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <div className="bg-card p-4 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estimated Current Market Value</p>
                <p className="text-5xl font-sans font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {formatINR(selectedParcel.estimatedValue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Value per {displayUnit === 'acres' ? 'Acre' : displayUnit === 'hectares' ? 'Hectare' : 'Sq.Ft'}: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatINR(selectedParcel.estimatedValue / (displayUnit === 'acres' ? selectedParcel.areaAcres : displayUnit === 'hectares' ? selectedParcel.areaAcres * 0.404686 : selectedParcel.areaAcres * 43560))}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Govt. Circle Rate</p>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatINR(selectedParcel.estimatedValue * 0.75)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Base rate set by {selectedParcel.state} government.</p>
                </div>
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Premium</p>
                  </div>
                  <p className="text-xl font-bold text-foreground">+{formatINR(selectedParcel.estimatedValue * 0.25)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on recent registered transactions nearby.</p>
                </div>
              </div>

              <div className="bg-card p-4 rounded-2xl border border-border shadow-sm mt-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">5-Year Valuation Trend</p>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { year: '2020', value: selectedParcel.estimatedValue * 0.72 },
                        { year: '2021', value: selectedParcel.estimatedValue * 0.81 },
                        { year: '2022', value: selectedParcel.estimatedValue * 0.89 },
                        { year: '2023', value: selectedParcel.estimatedValue * 0.95 },
                        { year: '2024', value: selectedParcel.estimatedValue },
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                      <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
                      <Tooltip
                        formatter={(value: any) => [`₹${(value / 100).toLocaleString('en-IN')}`, "Current Value"]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  onClick={() => setShowValuationModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Valuation report downloaded as PDF.');
                    setShowValuationModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition active:scale-95"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DigiLocker Document Modal */}
      {selectedParcel && (
        <Dialog open={showDigilockerModal} onOpenChange={setShowDigilockerModal}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-muted/50 border-border shadow-2xl rounded-2xl">
            <div className="bg-indigo-600 p-4 md:p-6 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1 text-indigo-200 uppercase tracking-widest text-xs font-bold">
                  <ShieldCheck className="size-4" /> DigiLocker Verified
                </div>
                <DialogTitle className="text-xl md:text-2xl font-semibold text-white">
                  Official Record of Rights (7/12 Extract)
                </DialogTitle>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/DigiLocker_logo.png/600px-DigiLocker_logo.png" alt="DigiLocker" className="h-8 md:h-10 opacity-90" />
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-card border-2 border-border shadow-sm p-8 rounded-lg relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <ShieldCheck className="w-96 h-96" />
                </div>

                <div className="flex justify-between items-start border-b border-border pb-6 mb-6">
                  <div>
                    <h2 className="text-2xl font-serif text-foreground font-bold mb-2">Government of {selectedParcel.state}</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Revenue Department</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="size-3.5" /> Digitally Signed
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 font-mono">ID: DL-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Owner Name</p>
                    <p className="text-base font-bold text-foreground">{(selectedParcel as any).ownerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Survey / Khasra No.</p>
                    <p className="text-base font-bold text-foreground">{selectedParcel.surveyNumber || selectedParcel.khasraNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Area</p>
                    <p className="text-base font-bold text-foreground">{selectedParcel.areaAcres} Acres</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Village & District</p>
                    <p className="text-base font-bold text-foreground">{selectedParcel.village}, {selectedParcel.district}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex items-center gap-3 relative z-10">
                  <div className="size-16 border-2 border-indigo-100 dark:border-indigo-800/60 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-400">
                    <span className="text-[10px] uppercase font-bold transform -rotate-45 tracking-widest">Valid</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">This document is digitally signed by the authorized revenue officer.</p>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">Timestamp: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDigilockerModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Document downloaded successfully.');
                    setShowDigilockerModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition active:scale-95 flex items-center gap-2"
                >
                  <FileText className="size-4" /> Download PDF
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
