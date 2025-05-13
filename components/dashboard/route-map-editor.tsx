"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useTheme } from 'next-themes';
import { CSSProperties } from 'react';

interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  [key: string]: any; // Other bin properties
}

interface RouteMapEditorProps {
  routeBins: Bin[];
  routePolyline: Array<[number, number]>; // Array of [longitude, latitude] points
  style?: CSSProperties;
  showSequenceNumbers?: boolean;
  editable?: boolean;
  onRouteChange?: (route: Array<[number, number]>, distance: number) => void;
}

// Add TypeScript interface to extend L.Map for our custom drawControl property
interface CustomMap extends L.Map {
  drawControl?: L.Control.Draw;
}

const RouteMapEditor = ({ 
  routeBins, 
  routePolyline, 
  style = { height: '400px', width: '100%' },
  showSequenceNumbers = false,
  editable = false,
  onRouteChange
}: RouteMapEditorProps) => {
  const mapRef = useRef<CustomMap | null>(null);
  const { theme } = useTheme();
  const [mapInitialized, setMapInitialized] = useState(false);
  const leafletDrawLayerRef = useRef<L.FeatureGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  
  // Initialize the map once
  useEffect(() => {
    if (typeof window !== 'undefined' && !mapRef.current) {
      // Dynamically import Leaflet Draw
      import('leaflet-draw').then(() => {
        // Initialize map
        const map = L.map('route-map', {
          center: [6.9271, 79.8612], // Default center (Colombo)
          zoom: 13,
          layers: [
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            })
          ]
        });
        
        mapRef.current = map;
        setMapInitialized(true);
        
        // Initialize the draw feature group
        leafletDrawLayerRef.current = new L.FeatureGroup();
        map.addLayer(leafletDrawLayerRef.current);

        return () => {
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }
        };
      });
    }
  }, []);

  // Update map with route and markers whenever they change
  useEffect(() => {
    if (mapRef.current && mapInitialized) {
      const map = mapRef.current;
      
      // Clear existing layers
      if (polylineLayerRef.current) {
        map.removeLayer(polylineLayerRef.current);
      }
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          // Check if leafletDrawLayerRef.current exists and if this layer is not part of it
          if (leafletDrawLayerRef.current && 
              layer !== leafletDrawLayerRef.current &&
              !(leafletDrawLayerRef.current.getLayers().some((l: any) => l === layer))) {
            map.removeLayer(layer);
          }
        }
      });

      // Create route polyline if we have route data
      if (routePolyline && routePolyline.length > 0) {
        // Convert from [lng, lat] format to [lat, lng] for Leaflet
        const path = routePolyline.map(point => [point[1], point[0]] as [number, number]);
        
        // Create polyline
        polylineLayerRef.current = L.polyline(path, { 
          color: theme === 'dark' ? '#3b82f6' : '#3b82f6', 
          weight: 3,
          opacity: 0.7
        });
        
        polylineLayerRef.current.addTo(map);
        
        // Add start and end markers with custom icons
        if (path.length > 0) {
          // Start marker
          L.marker(path[0], {
            icon: L.divIcon({
              html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-bold border-2 border-white">S</div>`,
              className: 'custom-div-icon',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          }).addTo(map);
          
          // End marker
          L.marker(path[path.length - 1], {
            icon: L.divIcon({
              html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white font-bold border-2 border-white">E</div>`,
              className: 'custom-div-icon',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          }).addTo(map);
        }
        
        // Fit the map to the route bounds
        const bounds = L.latLngBounds(path);
        map.fitBounds(bounds, { padding: [30, 30] });
        
        // If editable, add the polyline to the draw layer for editing
        if (editable && leafletDrawLayerRef.current) {
          // Clear existing draw layers
          leafletDrawLayerRef.current.clearLayers();
          
          // Add the existing polyline to the draw layer
          const editablePolyline = L.polyline(path, { color: '#3b82f6', weight: 4 });
          leafletDrawLayerRef.current.addLayer(editablePolyline);
        }
      }
      
      // Add bin markers
      if (routeBins && routeBins.length > 0) {
        routeBins.forEach((bin, index) => {
          if (bin.location && bin.location.coordinates) {
            const [longitude, latitude] = bin.location.coordinates;
            
            // Create marker
            const marker = L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: showSequenceNumbers ? 
                  `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold border-2 border-white">${index + 1}</div>` :
                  `<div class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 border-2 border-white"></div>`,
                className: 'custom-div-icon',
                iconSize: showSequenceNumbers ? [24, 24] : [20, 20],
                iconAnchor: showSequenceNumbers ? [12, 12] : [10, 10],
              })
            });
            
            // Add tooltip with bin info
            marker.bindTooltip(`
              <div class="p-1">
                <p class="font-semibold">${bin._id}</p>
                ${bin.address ? `<p class="text-xs">${bin.address}</p>` : ''}
                ${bin.fillLevel !== undefined ? `<p class="text-xs">Fill level: ${bin.fillLevel}%</p>` : ''}
                ${bin.wasteType ? `<p class="text-xs">Type: ${bin.wasteType}</p>` : ''}
              </div>
            `, { 
              direction: 'top', 
              offset: L.point(0, -15),
              className: 'rounded-md border-0 shadow-md'
            });
            
            marker.addTo(map);
          }
        });
      }
      
      // Set up Leaflet.Draw for editing if in edit mode
      if (editable && leafletDrawLayerRef.current) {
        // Remove existing edit controls if present
        if (map.drawControl) {
          map.removeControl(map.drawControl);
        }
        
        // Initialize the Draw control with ONLY edit capability (no drawing tools)
        const drawControl = new L.Control.Draw({
          draw: false, // Disable all drawing tools
          edit: {
            featureGroup: leafletDrawLayerRef.current,
            edit: true,   // Enable the edit tool
            remove: false // Disable the delete tool
          } as any 
        });
        
        map.addControl(drawControl);
        map.drawControl = drawControl;
        
        // Handle edited events
        map.on(L.Draw.Event.EDITED, (e: any) => {
          const layers = e.layers;
          
          layers.eachLayer((layer: L.Polyline) => {
            // Extract coordinates and convert to [lng, lat] format
            const latLngs = layer.getLatLngs();
            
            // Handle both simple polylines and multi-polylines
            let coordinates: [number, number][] = [];
            
            if (Array.isArray(latLngs[0]) && latLngs[0].length > 0 && 'lat' in latLngs[0][0]) {
              // Handle multi-polyline
              coordinates = (latLngs[0] as L.LatLng[]).map(
                latLng => [latLng.lng, latLng.lat] as [number, number]
              );
            } else {
              // Handle simple polyline
              coordinates = (latLngs as L.LatLng[]).map(
                latLng => [latLng.lng, latLng.lat] as [number, number]
              );
            }
            
            // Calculate distance
            const distance = calculateRouteDistance(coordinates);
            
            // Notify parent component
            if (onRouteChange) {
              onRouteChange(coordinates, distance);
            }
          });
        });
        
        // Clean up event handlers when component is unmounted
        return () => {
          map.off(L.Draw.Event.EDITED);
          if (map.drawControl) {
            map.removeControl(map.drawControl);
          }
        };
      }
    }
  }, [routeBins, routePolyline, theme, mapInitialized, showSequenceNumbers, editable, onRouteChange]);

  // Calculate route distance using Haversine formula
  const calculateRouteDistance = (coordinates: Array<[number, number]>): number => {
    if (!coordinates || coordinates.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];
      
      // Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  };

  return <div id="route-map" style={style}></div>;
};

export default RouteMapEditor;