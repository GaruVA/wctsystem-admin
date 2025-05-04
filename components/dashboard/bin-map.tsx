"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaWithBins, Bin } from '../../lib/api/areas';

// Define interfaces for the component
interface BinMapProps {
  areas?: AreaWithBins[];
  fitToAreas?: boolean;
  todaysRoutes?: Array<{ _id: string; route: [number, number][] }>;
  style?: React.CSSProperties;
}

// Extend the Bin type to include suggestion-specific properties
interface ExtendedBin extends Bin {
  isSuggestion?: boolean;
  reason?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'PENDING_INSTALLATION';
}

// Fill level color helper
const getFillLevelColor = (level: number) => {
  if (level >= 90) return '#EF4444';
  if (level >= 70) return '#F59E0B';
  if (level >= 50) return '#FBBF24';
  return '#10B981';
};

const BinMap: React.FC<BinMapProps> = ({
  areas = [],
  fitToAreas = true,
  style,
  todaysRoutes = []
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const binMarkersRef = useRef<L.Marker[]>([]);
  const areaPolygonsRef = useRef<L.Polygon[]>([]);
  const mapInitializedRef = useRef<boolean>(false);
  const [areaColors, setAreaColors] = useState<Map<string, string>>(new Map());

  // Generate unique colors for areas
  useEffect(() => {
    if (areas.length > 0) {
      const colors = new Map<string, string>();
      // Predefined colors for better visibility
      const colorPalette = [
        '#3388ff', '#ff3388', '#88ff33', '#ff8833', '#33ff88',
        '#8833ff', '#ff3333', '#33ff33', '#3333ff', '#ffff33'
      ];

      areas.forEach((area, index) => {
        colors.set(area.areaID, colorPalette[index % colorPalette.length]);
      });

      setAreaColors(colors);
    }
  }, [areas]);

  // Custom icon for bins
  const createBinIcon = (
    fillLevel: number, 
    wasteType?: string, 
    areaId?: string, 
    isSuggestion?: boolean,
    binId?: string,
    hasIssue?: boolean,
    status?: string
  ) => {
    // Get status indicator color and style
    const getStatusIndicator = (status?: string) => {
      switch(status) {
        case 'MAINTENANCE':
          return `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background-color: #F59E0B;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 2;
          ">M</div>`;
        case 'INACTIVE':
          return `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background-color: #6B7280;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 2;
          ">I</div>`;
        case 'PENDING_INSTALLATION':
          return `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background-color: #8B5CF6;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 2;
          ">P</div>`;
        default:
          return ''; // ACTIVE status - no indicator needed
      }
    };

    // Get fill level color based on status
    const getBinColor = (fillLevel: number, status?: string) => {
      // For inactive bins, always gray
      if (status === 'INACTIVE') return '#6B7280';
      // For pending installation, always purple
      if (status === 'PENDING_INSTALLATION') return '#8B5CF6';
      // For other statuses, use the fill level color
      return getFillLevelColor(fillLevel);
    };

    const fillLevelColor = getBinColor(fillLevel, status);

    // Regular bin icon
    return L.divIcon({
      className: 'custom-bin-marker',
      html: `
        <div style="
          position: relative;
          width: 24px; 
          height: 28px;
        ">
          ${getStatusIndicator(status)}
          <div style="
          margin-top: 3px;
            width: 24px;
            height: 24px;
            background-color: ${fillLevelColor};
            border-radius: 4px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            position: relative;
            ${status === 'INACTIVE' ? 'opacity: 0.7;' : ''}
          ">
            ${fillLevel}%
          </div>
          <div style="
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            background: white;
            border-radius: 2px;
            padding: 0 2px;
          ">
            ${wasteType ? wasteType.substring(0, 3) : 'N/A'}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  // Add start and end marker creators for routes
  const createStartLocationMarker = () => L.divIcon({
    className: 'start-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background-color:green;border:2px solid white;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const createEndLocationMarker = () => L.divIcon({
    className: 'end-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background-color:blue;border:2px solid white;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  // Add legend to the map
  const addLegend = () => {
    if (!mapRef.current) return;
    const existingLegend = document.querySelector('.map-legend');
    if (existingLegend) existingLegend.remove();
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div style="background:white;padding:10px;border-radius:5px;box-shadow:0 0 5px rgba(0,0,0,0.2)">
          <div style="font-weight:bold;margin-bottom:5px;">Fill Level</div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;background:#10B981;border-radius:50%;margin-right:5px;"></span>
            <span>&lt;50% Full (Low)</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;background:#FBBF24;border-radius:50%;margin-right:5px;"></span>
            <span>50-70% Full (Medium)</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;background:#F59E0B;border-radius:50%;margin-right:5px;"></span>
            <span>70-90% Full (High)</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:10px;">
            <span style="display:inline-block;width:12px;height:12px;background:#EF4444;border-radius:50%;margin-right:5px;"></span>
            <span>&gt;90% Full (Critical)</span>
          </div>
          <div style="font-weight:bold;margin-bottom:5px;">Status</div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#F59E0B;margin-right:5px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">M</div>
            <span>Maintenance</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#6B7280;margin-right:5px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">I</div>
            <span>Inactive</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:10px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#8B5CF6;margin-right:5px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">P</div>
            <span>Pending Installation</span>
          </div>
          <div style="font-weight:bold;margin:10px 0 5px;">Routes</div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <div style="width:15px;height:2px;background-color:blue;margin-right:5px;border-radius:1px;background-image:linear-gradient(to right, blue 50%, transparent 50%);background-size:5px 2px;background-repeat:repeat-x;"></div>
            <span>Route Path</span>
          </div>
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <div style="width:12px;height:12px;border-radius:50%;background-color:green;border:2px solid white;margin-right:5px;"></div>
            <span>Start Location</span>
          </div>
          <div style="display:flex;align-items:center;">
            <div style="width:12px;height:12px;border-radius:50%;background-color:blue;border:2px solid white;margin-right:5px;"></div>
            <span>End Location</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(mapRef.current);
  };

  // Initialize map and add legend
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, { center: [7.8731, 80.7718], zoom: 9 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
      mapRef.current = map;
      addLegend();
    }
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Update map layers: bins, areas, and today's routes
  useEffect(() => {
    if (!mapRef.current) return;
    // Clear existing layers
    binMarkersRef.current.forEach(m => m.remove());
    binMarkersRef.current = [];
    areaPolygonsRef.current.forEach(p => p.remove());
    areaPolygonsRef.current = [];

    // Draw bins for all areas
    areas.forEach(area => {
      area.bins.forEach(bin => {
        const marker = L.marker([bin.location.coordinates[1], bin.location.coordinates[0]], { icon: createBinIcon(bin.fillLevel, bin.wasteType, undefined, false, undefined, false, bin.status) });
        marker.addTo(mapRef.current!);
      });
    });

    // Draw area polygons
    areas.forEach(area => {
      if (area.geometry?.coordinates?.[0]) {
        const coords = area.geometry.coordinates[0].map(c => L.latLng(c[1], c[0]));
        const avgFill = area.bins.length > 0 ? area.bins.reduce((sum, b) => sum + b.fillLevel, 0) / area.bins.length : 0;
        const fillColor = getFillLevelColor(avgFill);
        const polygon = L.polygon(coords, { color: fillColor, fillColor, fillOpacity: 0.2, weight: 1 }).addTo(mapRef.current!);
        areaPolygonsRef.current.push(polygon);
      }
    });

    // Draw today's routes
    todaysRoutes.forEach(schedule => {
      const coords = schedule.route.map(c => L.latLng(c[1], c[0]));
      L.polyline(coords, { color: 'blue', weight: 4, opacity: 0.7, dashArray: '10, 5' }).addTo(mapRef.current!);
      if (coords.length > 0) {
        L.marker(coords[0], { icon: createStartLocationMarker() }).bindPopup('<strong>Route Start</strong>').addTo(mapRef.current!);
        const end = coords[coords.length - 1];
        L.marker(end, { icon: createEndLocationMarker() }).bindPopup('<strong>Route End</strong>').addTo(mapRef.current!);
      }
    });

    // Fit map to areas if requested
    if (fitToAreas && areas.length > 0) {
      const bounds: L.LatLng[] = [];
      areas.forEach(area => {
        area.geometry?.coordinates?.[0]?.forEach(c => bounds.push(L.latLng(c[1], c[0])));
      });
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }, [areas, todaysRoutes, fitToAreas]);

  return <div ref={mapContainerRef} style={{ ...style, height: '562px', width: '100%' }} />;
};

export default BinMap;