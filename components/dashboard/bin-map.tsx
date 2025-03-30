"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaWithBins, Bin } from '../../lib/api/areas';

// Define interfaces for the component
interface BinMapProps {
  areas?: AreaWithBins[];
  singleArea?: AreaWithBins;
  bins?: Bin[];
  optimizedRoute?: [number, number][];
  fitToRoute?: boolean;
  routeBins?: Bin[];
  currentSegment?: [number, number][];
  fitToCurrentSegment?: boolean;
  fitToAreas?: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  onBinSelect?: (bin: Bin) => void;
  selectedBin?: Bin | null;
  style?: React.CSSProperties;
  colorByArea?: boolean;
}

const BinMap: React.FC<BinMapProps> = ({
  areas = [],
  singleArea,
  bins = [],
  optimizedRoute = [],
  fitToRoute = false,
  routeBins = [],
  currentSegment = [],
  fitToCurrentSegment = false,
  fitToAreas = true,
  currentLocation,
  onBinSelect,
  selectedBin = null,
  style,
  colorByArea = true
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const binMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const currentSegmentPolylineRef = useRef<L.Polyline | null>(null);
  const areaPolygonsRef = useRef<L.Polygon[]>([]);
  const mapInitializedRef = useRef<boolean>(false);
  const [areaColors, setAreaColors] = useState<Map<string, string>>(new Map());

  // Generate unique colors for areas
  useEffect(() => {
    if (areas.length > 0 && colorByArea) {
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
  }, [areas, colorByArea]);

  // Custom icon for bins
  const createBinIcon = (fillLevel: number, areaId?: string) => {
    const getFillLevelColor = (level: number) => {
      if (level >= 90) return '#EF4444'; // Red
      if (level >= 70) return '#F59E0B'; // Orange
      if (level >= 50) return '#FBBF24'; // Yellow
      return '#10B981'; // Green
    };

    // Use area color if colorByArea is true and areaId is provided
    const color = colorByArea && areaId && areaColors.has(areaId)
      ? areaColors.get(areaId)
      : getFillLevelColor(fillLevel);

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
          position: relative;
        ">
          <div style="
            position: absolute;
            bottom: -5px;
            width: 100%;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            background: rgba(255,255,255,0.8);
            border-radius: 2px;
            padding: 0 2px;
          ">
            ${fillLevel}%
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && !mapInitializedRef.current) {
      // Default to Sri Lanka coordinates if no specific location is provided
      const map = L.map('map-container', {
        center: [7.8731, 80.7718], // Sri Lanka center
        zoom: 9
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
      mapRef.current.fitBounds(group.getBounds());
      
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

    areaPolygonsRef.current.forEach(polygon => {
      if (mapRef.current) polygon.removeFrom(mapRef.current);
    });
    areaPolygonsRef.current = [];

    // Collect all bins to display
    let allBins: { bin: Bin; areaId?: string }[] = [];
    
    // Add bins from areas
    if (areas.length > 0) {
      areas.forEach(area => {
        area.bins.forEach(bin => {
          allBins.push({ bin, areaId: area.areaID });
        });
      });
    }
    
    // Add bins from singleArea if provided
    if (singleArea) {
      singleArea.bins.forEach(bin => {
        allBins.push({ bin, areaId: singleArea.areaID });
      });
    }
    
    // Add loose bins if provided
    if (bins.length > 0) {
      bins.forEach(bin => {
        allBins.push({ bin });
      });
    }

    // Create bin markers
    binMarkersRef.current = allBins.map(({ bin, areaId }) => {
      const marker = L.marker(
        [bin.location.coordinates[1], bin.location.coordinates[0]], 
        { icon: createBinIcon(bin.fillLevel, areaId) }
      );
      
      // Add popup with bin info
      const popupContent = `
        <div>
          <strong>Fill Level:</strong> ${bin.fillLevel}%<br>
          ${bin.address ? `<strong>Address:</strong> ${bin.address}<br>` : ''}
          ${bin.lastCollected ? `<strong>Last Collected:</strong> ${new Date(bin.lastCollected).toLocaleString()}<br>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        onBinSelect?.(bin);
      });

      marker.addTo(mapRef.current!);
      return marker;
    });

    // Draw route if provided
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

    // Draw current segment if provided
    if (currentSegment.length > 0) {
      const segmentCoords = currentSegment.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      currentSegmentPolylineRef.current = L.polyline(segmentCoords, {
        color: 'rgba(0,100,255,0.9)', 
        weight: 5
      }).addTo(mapRef.current);
    }

    // Draw area polygons
    const allAreas = [...areas];
    if (singleArea) allAreas.push(singleArea);
    
    allAreas.forEach((area, index) => {
      if (area.geometry && area.geometry.coordinates && area.geometry.coordinates[0]) {
        const areaColor = areaColors.get(area.areaID) || `hsl(${(index * 137) % 360}, 70%, 50%)`;
        
        // Convert GeoJSON coordinates to Leaflet format
        const polygonCoords = area.geometry.coordinates[0].map(coord => 
          L.latLng(coord[1], coord[0])
        );
        
        const polygon = L.polygon(polygonCoords, {
          color: areaColor,
          fillColor: areaColor,
          fillOpacity: 0.2,
          weight: 2
        }).addTo(mapRef.current!);
        
        // Add popup with area info
        polygon.bindPopup(`<b>${area.areaName}</b><br>${area.bins.length} bins`);
        
        areaPolygonsRef.current.push(polygon);
        
        // Add markers for start and end locations
        if (area.startLocation && area.startLocation.coordinates) {
          L.marker([area.startLocation.coordinates[1], area.startLocation.coordinates[0]], {
            icon: L.divIcon({
              className: 'start-marker',
              html: `<div style="width:12px;height:12px;border-radius:50%;background-color:green;border:2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          })
          .bindPopup(`Start point for ${area.areaName}`)
          .addTo(mapRef.current!);
        }
        
        if (area.endLocation && area.endLocation.coordinates) {
          L.marker([area.endLocation.coordinates[1], area.endLocation.coordinates[0]], {
            icon: L.divIcon({
              className: 'end-marker',
              html: `<div style="width:12px;height:12px;border-radius:50%;background-color:red;border:2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          })
          .bindPopup(`End point for ${area.areaName}`)
          .addTo(mapRef.current!);
        }
      }
    });

    // Determine what to fit to on the map
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
    } else if (fitToAreas && allAreas.length > 0) {
      // Collect all coordinates from all areas to fit the map
      const allCoords: { lat: number; lng: number }[] = [];
      
      allAreas.forEach(area => {
        // Add area polygon coordinates
        if (area.geometry && area.geometry.coordinates && area.geometry.coordinates[0]) {
          area.geometry.coordinates[0].forEach(coord => {
            allCoords.push({ lat: coord[1], lng: coord[0] });
          });
        }
        
        // Add bin coordinates
        area.bins.forEach(bin => {
          allCoords.push({
            lat: bin.location.coordinates[1],
            lng: bin.location.coordinates[0]
          });
        });
        
        // Add start and end locations
        if (area.startLocation && area.startLocation.coordinates) {
          allCoords.push({
            lat: area.startLocation.coordinates[1],
            lng: area.startLocation.coordinates[0]
          });
        }
        
        if (area.endLocation && area.endLocation.coordinates) {
          allCoords.push({
            lat: area.endLocation.coordinates[1],
            lng: area.endLocation.coordinates[0]
          });
        }
      });
      
      if (allCoords.length > 0) {
        fitMapToCoordinates(allCoords);
      }
    } else if (allBins.length > 0) {
      const binCoords = allBins.map(({ bin }) => ({
        lat: bin.location.coordinates[1],
        lng: bin.location.coordinates[0]
      }));
      fitMapToCoordinates(binCoords);
    }
  }, [
    bins, 
    areas,
    singleArea,
    optimizedRoute, 
    currentSegment, 
    selectedBin, 
    fitToRoute, 
    fitToCurrentSegment, 
    fitToAreas,
    onBinSelect,
    areaColors,
    colorByArea
  ]);

  // Add current location marker if provided
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;
    
    const currentLocationMarker = L.marker(
      [currentLocation.latitude, currentLocation.longitude],
      {
        icon: L.divIcon({
          className: 'current-location-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: blue;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }
    ).addTo(mapRef.current);
    
    return () => {
      if (mapRef.current) {
        currentLocationMarker.removeFrom(mapRef.current);
      }
    };
  }, [currentLocation]);

  return (
    <div 
      id="map-container" 
      style={{ 
        height: '600px', 
        width: '100%', 
        ...style 
      }} 
    />
  );
};

export default BinMap;