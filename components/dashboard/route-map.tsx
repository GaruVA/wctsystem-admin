"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaWithBins, Bin } from '../../lib/api/areas';

// Define interfaces for the component
interface RouteMapProps {
  routeBins: Bin[]; // Bins in sequence order for the route
  routePolyline?: [number, number][]; // Route line coordinates
  area?: AreaWithBins; // Optional area containing the route
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  onBinSelect?: (bin: Bin | null) => void;
  onBinDoubleClick?: (bin: Bin) => void;
  selectedBin?: Bin | null;
  style?: React.CSSProperties;
  currentSegment?: [number, number][]; // Current segment of the route being traversed
  collectorLocation?: {
    latitude: number;
    longitude: number;
  };
  showSequenceNumbers?: boolean; // Whether to display sequence numbers on bins
}

const RouteMap: React.FC<RouteMapProps> = ({
  routeBins = [],
  routePolyline = [],
  area,
  currentLocation,
  onBinSelect,
  onBinDoubleClick,
  selectedBin = null,
  style,
  currentSegment = [],
  collectorLocation,
  showSequenceNumbers = true,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const binMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const currentSegmentPolylineRef = useRef<L.Polyline | null>(null);
  const areaPolygonRef = useRef<L.Polygon | null>(null);
  const collectorMarkerRef = useRef<L.Marker | null>(null);
  const mapInitializedRef = useRef<boolean>(false);

  // Custom icon for bins with sequence numbers
  const createBinIcon = (
    fillLevel: number, 
    wasteType?: string, 
    sequenceNumber?: number, 
    status?: string
  ) => {
    // Fill level colors (primary color indicator)
    const getFillLevelColor = (level: number) => {
      if (level >= 90) return '#EF4444'; // Red
      if (level >= 70) return '#F59E0B'; // Orange
      if (level >= 50) return '#FBBF24'; // Yellow
      return '#10B981'; // Green
    };

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

    // Add sequence number badge if provided
    const sequenceNumberBadge = showSequenceNumbers && sequenceNumber ? 
      `<div style="
        position: absolute;
        top: -8px;
        left: -8px;
        width: 16px;
        height: 16px;
        background-color:rgb(255, 254, 254);
        border-radius: 50%;
        color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 2;
      ">${sequenceNumber}</div>` : '';

    // Regular bin icon with sequence number
    return L.divIcon({
      className: 'custom-bin-marker',
      html: `
        <div style="
          position: relative;
          width: 24px; 
          height: 28px;
        ">
          ${sequenceNumberBadge}
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

  // Create start and end markers
  const createStartLocationMarker = () => {
    return L.divIcon({
      className: 'start-marker',
      html: `<div style="width:14px;height:14px;border-radius:50%;background-color:green;border:2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };
  
  const createEndLocationMarker = () => {
    return L.divIcon({
      className: 'end-marker',
      html: `<div style="width:14px;height:14px;border-radius:50%;background-color:blue;border:2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  // Add legend to the map
  const addLegend = () => {
    if (!mapRef.current) return;
    
    // Remove existing legend if any
    const existingLegend = document.querySelector('.route-map-legend');
    if (existingLegend) existingLegend.remove();
    
    // Create legend control
    const legend = new L.Control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'route-map-legend');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
        ">
          <div style="font-weight: bold; margin-bottom: 5px;">Route Visualization</div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 2px; background-color: blue; margin-right: 5px;"></div>
            <span>Route Path</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: green; border: 2px solid white; margin-right: 5px;"></div>
            <span>Start Location</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: blue; border: 2px solid white; margin-right: 5px;"></div>
            <span>End Location</span>
          </div>
        </div>
      `;
      return div;
    };
    
    legend.addTo(mapRef.current);
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && !mapInitializedRef.current && mapContainerRef.current) {
      // Default to Sri Lanka coordinates if no specific location is provided
      const map = L.map(mapContainerRef.current, {
        center: [7.8731, 80.7718], // Sri Lanka center
        zoom: 9
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add click handler to deselect bin when clicking on the map
      map.on('click', () => {
        if (onBinSelect && selectedBin) {
          onBinSelect(null);
        }
      });

      mapRef.current = map;
      mapInitializedRef.current = true;

      // Add legend to the map
      addLegend();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [onBinSelect, selectedBin]);

  // Fit map to coordinates
  const fitMapToCoordinates = (coordinates: { lat: number; lng: number }[]) => {
    if (mapRef.current && coordinates.length > 0) {
      const group = L.featureGroup(
        coordinates.map(coord => L.marker([coord.lat, coord.lng], { opacity: 0 }))
      );
      mapRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50] // Add padding around the bounds
      });

      // Remove the temporary markers used for bounds calculation
      group.eachLayer(layer => layer.remove());
    }
  };

  // Function to handle bin marker interactions
  const addBinMarkerInteractions = (marker: L.Marker, bin: Bin) => {
    // Handle click to select bin or deselect if already selected
    marker.on('click', () => {
      if (onBinSelect) {
        // If this bin is already selected, deselect it by passing null
        if (selectedBin && selectedBin._id === bin._id) {
          onBinSelect(null);
        } else {
          onBinSelect(bin);
        }
      }
    });
    
    // Add double click handler
    marker.on('dblclick', (e) => {
      // Stop propagation to prevent map zoom
      L.DomEvent.stopPropagation(e);
      
      if (onBinDoubleClick) {
        onBinDoubleClick(bin);
      }
    });
  };

  // Update map with route data
  useEffect(() => {
    if (!mapRef.current || !mapInitializedRef.current) return;

    // Clear previous markers and paths
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

    // Draw area polygon if provided
    if (area && area.geometry && area.geometry.coordinates && area.geometry.coordinates[0]) {
      const areaColor = '#3388ff'; // Default blue color for the area
      
      // Convert GeoJSON coordinates to Leaflet format
      const polygonCoords = area.geometry.coordinates[0].map(coord => 
        L.latLng(coord[1], coord[0])
      );
      
      areaPolygonRef.current = L.polygon(polygonCoords, {
        color: areaColor,
        fillColor: areaColor,
        fillOpacity: 0.1,
        weight: 1
      }).addTo(mapRef.current);
      
      // Add markers for start and end locations
      if (area.startLocation && area.startLocation.coordinates) {
        L.marker([area.startLocation.coordinates[1], area.startLocation.coordinates[0]], {
          icon: createStartLocationMarker()
        })
        .bindPopup('<strong>Start Location</strong>')
        .addTo(mapRef.current);
      }
      
      if (area.endLocation && area.endLocation.coordinates) {
        L.marker([area.endLocation.coordinates[1], area.endLocation.coordinates[0]], {
          icon: createEndLocationMarker()
        })
        .bindPopup('<strong>End Location</strong>')
        .addTo(mapRef.current);
      }
    }

    // Create bin markers for the route
    binMarkersRef.current = routeBins.map((bin, index) => {
      const marker = L.marker(
        [bin.location.coordinates[1], bin.location.coordinates[0]], 
        { 
          icon: createBinIcon(
            bin.fillLevel, 
            bin.wasteType,
            index + 1, // Sequence number
            bin.status
          )
        }
      );
      
      // Add popup with bin details
      marker.bindPopup(`
        <div style="min-width: 200px">
          <h3 style="font-size: 16px; margin-bottom: 5px; font-weight: 600;">Bin #${index + 1}</h3>
          <p style="margin: 5px 0"><strong>ID:</strong> ${bin._id}</p>
          ${bin.address ? `<p style="margin: 5px 0"><strong>Address:</strong> ${bin.address}</p>` : ''}
          <p style="margin: 5px 0"><strong>Fill Level:</strong> ${bin.fillLevel}%</p>
          <p style="margin: 5px 0"><strong>Waste Type:</strong> ${bin.wasteType}</p>
          ${bin.status ? `<p style="margin: 5px 0"><strong>Status:</strong> ${bin.status}</p>` : ''}
        </div>
      `);
      
      // Add interactions for bin markers
      addBinMarkerInteractions(marker, bin);
      
      // Add to map
      marker.addTo(mapRef.current!);
      
      return marker;
    });

    // Create markers for start and end locations
    let startMarker: L.Marker | null = null;
    let endMarker: L.Marker | null = null;

    // Draw route polyline if provided
    if (routePolyline && routePolyline.length > 0) {
      const routeCoords = routePolyline.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      
      routePolylineRef.current = L.polyline(routeCoords, {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5' // Make the route line dashed
      }).addTo(mapRef.current!);

      // Add markers for start and end of the route
      if (routePolyline.length > 0) {
        // Start marker using first point of the route
        const startPoint = routePolyline[0];
        startMarker = L.marker(
          [startPoint[1], startPoint[0]],
          { icon: createStartLocationMarker() }
        )
        .bindPopup('<strong>Route Start</strong>')
        .addTo(mapRef.current);

        // End marker using last point of the route
        const endPoint = routePolyline[routePolyline.length - 1];
        endMarker = L.marker(
          [endPoint[1], endPoint[0]],
          { icon: createEndLocationMarker() }
        )
        .bindPopup('<strong>Route End</strong>')
        .addTo(mapRef.current);
      }
    }

    // Draw current segment if provided
    if (currentSegment && currentSegment.length > 0) {
      const segmentCoords = currentSegment.map(coord => 
        L.latLng(coord[1], coord[0])
      );
      
      currentSegmentPolylineRef.current = L.polyline(segmentCoords, {
        color: '#3388ff',
        weight: 5,
        opacity: 0.8
      }).addTo(mapRef.current!);
    }

    // Determine what to fit the map to
    const coordinatesToFit: { lat: number; lng: number }[] = [];
    
    // Add route polyline coordinates
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach(coord => {
        coordinatesToFit.push({ lat: coord[1], lng: coord[0] });
      });
    }
    
    // Add bin coordinates
    if (routeBins.length > 0) {
      routeBins.forEach(bin => {
        coordinatesToFit.push({
          lat: bin.location.coordinates[1],
          lng: bin.location.coordinates[0]
        });
      });
    }
    
    // Add current segment coordinates
    if (currentSegment && currentSegment.length > 0) {
      currentSegment.forEach(coord => {
        coordinatesToFit.push({ lat: coord[1], lng: coord[0] });
      });
    }
    
    // If there's a selected bin, prioritize it
    if (selectedBin) {
      fitMapToCoordinates([{
        lat: selectedBin.location.coordinates[1],
        lng: selectedBin.location.coordinates[0]
      }]);
    } 
    // Otherwise fit to all coordinates
    else if (coordinatesToFit.length > 0) {
      fitMapToCoordinates(coordinatesToFit);
    }
    
  }, [routeBins, routePolyline, area, currentSegment, selectedBin]);

  // Add current collector location marker if provided
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (collectorMarkerRef.current) {
      collectorMarkerRef.current.removeFrom(mapRef.current);
      collectorMarkerRef.current = null;
    }
    
    if (collectorLocation) {
      collectorMarkerRef.current = L.marker(
        [collectorLocation.latitude, collectorLocation.longitude],
        {
          icon: L.divIcon({
            className: 'collector-location-marker',
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
      )
      .bindPopup('<strong>Collector Location</strong>')
      .addTo(mapRef.current);
    }
    
  }, [collectorLocation]);
  
  // Add current user location marker if provided
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
              background-color: #3b82f6;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
              animation: pulse 2s infinite;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                }
                70% {
                  box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
                }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }
    )
    .bindPopup('<strong>Your Location</strong>')
    .addTo(mapRef.current);
    
    return () => {
      if (mapRef.current) {
        currentLocationMarker.removeFrom(mapRef.current);
      }
    };
  }, [currentLocation]);

  return (
    <div 
      ref={mapContainerRef}
      style={{ 
        height: '500px', 
        width: '100%', 
        borderRadius: '8px',
        ...style 
      }} 
    />
  );
};

export default RouteMap;