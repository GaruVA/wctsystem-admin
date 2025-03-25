import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define interfaces for the component
interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fillLevel: number;
  lastCollected: string;
}

interface AreaData {
  areaName: string;
  areaID: string;
  coordinates: [number, number][];
  bins: Bin[];
  dumpLocation: {
    type: string;
    coordinates: [number, number];
  };
}

interface MapDisplayProps {
  bins: Bin[];
  optimizedRoute?: [number, number][];
  fitToRoute?: boolean;
  routeBins?: Bin[];
  currentSegment?: [number, number][];
  fitToCurrentSegment?: boolean;
  area?: AreaData;
  fitToArea?: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  dumpLocation?: {
    latitude: number;
    longitude: number;
  };
  onBinSelect?: (bin: Bin) => void;
  selectedBin?: Bin | null;
  style?: React.CSSProperties;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  bins,
  optimizedRoute = [],
  fitToRoute = false,
  routeBins = [],
  currentSegment = [],
  fitToCurrentSegment = false,
  area,
  fitToArea = false,
  currentLocation,
  dumpLocation,
  onBinSelect,
  selectedBin = null,
  style
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const binMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const currentSegmentPolylineRef = useRef<L.Polyline | null>(null);
  const areaPolygonRef = useRef<L.Polygon | null>(null);
  const mapInitializedRef = useRef<boolean>(false);

  // Custom icon for bins
  const createBinIcon = (fillLevel: number) => {
    const getFillLevelColor = (level: number) => {
      if (level >= 90) return '#EF4444'; // Red
      if (level >= 70) return '#F59E0B'; // Orange
      if (level >= 50) return '#FBBF24'; // Yellow
      return '#10B981'; // Green
    };

    const color = getFillLevelColor(fillLevel);

    return L.divIcon({
      className: 'custom-bin-marker',
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background-color: ${color}; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          <i class="fas fa-trash" style="color: white; font-size: 16px;"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && !mapInitializedRef.current) {
      const map = L.map('map-container', {
        center: [40.7128, -74.0060], // Default to NYC
        zoom: 10
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapRef.current = map;
      mapInitializedRef.current = true;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // Fit map to coordinates
  const fitMapToCoordinates = (coordinates: { lat: number; lng: number }[]) => {
    if (mapRef.current && coordinates.length > 0) {
      const group = L.featureGroup(
        coordinates.map(coord => L.marker([coord.lat, coord.lng], { opacity: 0 }))
      );
      mapRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50]
      });
      
      // Remove the temporary markers used for bounds calculation
      group.eachLayer(layer => layer.remove());
    }
  };

  // Handle map fitting and layers based on different modes
  useEffect(() => {
    if (!mapRef.current || !mapInitializedRef.current) return;

    // Clear previous layers
    if (binMarkersRef.current.length > 0) {
      binMarkersRef.current.forEach(marker => {
        if (mapRef.current) marker.removeFrom(mapRef.current);
      });
      binMarkersRef.current = [];
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.removeFrom(mapRef.current);
      routePolylineRef.current = null;
    }

    if (currentSegmentPolylineRef.current) {
      currentSegmentPolylineRef.current.removeFrom(mapRef.current);
      currentSegmentPolylineRef.current = null;
    }

    if (areaPolygonRef.current) {
      areaPolygonRef.current.removeFrom(mapRef.current);
      areaPolygonRef.current = null;
    }

    // Create new bin markers
    binMarkersRef.current = bins.map(bin => {
      const marker = L.marker(
        [bin.location.coordinates[1], bin.location.coordinates[0]], 
        { icon: createBinIcon(bin.fillLevel) }
      );
      
      marker.on('click', () => {
        onBinSelect?.(bin);
      });

      marker.addTo(mapRef.current!);
      return marker;
    });

    // Draw route
    if (optimizedRoute.length > 0) {
      const routeCoords = optimizedRoute.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      routePolylineRef.current = L.polyline(routeCoords, {
        color: 'blue', 
        weight: 4, 
        opacity: 0.7
      }).addTo(mapRef.current);
    }

    // Draw current segment
    if (currentSegment.length > 0) {
      const segmentCoords = currentSegment.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      currentSegmentPolylineRef.current = L.polyline(segmentCoords, {
        color: 'rgba(0,100,255,0.9)', 
        weight: 5
      }).addTo(mapRef.current);
    }

    // Draw area polygon
    if (area?.coordinates) {
      const areaCoords = area.coordinates.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      areaPolygonRef.current = L.polygon(areaCoords, {
        color: 'green',
        fillColor: 'rgba(0,128,0,0.1)',
        fillOpacity: 0.2
      }).addTo(mapRef.current);
    }

    // Determine what to fit to
    if (selectedBin) {
      fitMapToCoordinates([{
        lat: selectedBin.location.coordinates[1],
        lng: selectedBin.location.coordinates[0]
      }]);
    } else if (fitToCurrentSegment && currentSegment.length > 0) {
      const segmentCoords = currentSegment.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));
      fitMapToCoordinates(segmentCoords);
    } else if (fitToRoute && optimizedRoute.length > 0) {
      const routeCoords = optimizedRoute.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));
      fitMapToCoordinates(routeCoords);
    } else if (fitToArea && area?.coordinates) {
      const areaCoords = area.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));
      fitMapToCoordinates(areaCoords);
    } else if (bins.length > 0) {
      const binCoords = bins.map(bin => ({
        lat: bin.location.coordinates[1],
        lng: bin.location.coordinates[0]
      }));
      fitMapToCoordinates(binCoords);
    }
  }, [
    bins, 
    optimizedRoute, 
    currentSegment, 
    area, 
    selectedBin, 
    fitToRoute, 
    fitToCurrentSegment, 
    fitToArea,
    onBinSelect
  ]);

  return (
    <div 
      id="map-container" 
      style={{ 
        height: '500px', 
        width: '100%', 
        ...style 
      }} 
    />
  );
};

export default MapDisplay;