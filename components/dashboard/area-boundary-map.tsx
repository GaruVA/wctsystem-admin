"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface AreaBoundaryMapProps {
  initialBoundary?: number[][][]; // GeoJSON Polygon coordinates
  initialStartLocation?: number[]; // [longitude, latitude]
  initialEndLocation?: number[]; // [longitude, latitude]
  onBoundaryChange: (coordinates: number[][][]) => void;
  onStartLocationChange: (coordinates: number[]) => void;
  onEndLocationChange: (coordinates: number[]) => void;
  style?: React.CSSProperties;
}

const AreaBoundaryMap: React.FC<AreaBoundaryMapProps> = ({
  initialBoundary,
  initialStartLocation,
  initialEndLocation,
  onBoundaryChange,
  onStartLocationChange,
  onEndLocationChange,
  style
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) {
      // Initialize with Sri Lanka center coordinates
      const map = L.map('area-boundary-map', {
        center: [6.927, 79.861],
        zoom: 12
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Create feature group to hold the drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Initialize the draw control
      const drawControl = new L.Control.Draw({
        draw: {
          marker: false,
          polyline: false,
          circle: false,
          rectangle: false,
          circlemarker: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: '#e1e100',
              message: '<strong>Error:</strong> Polygon edges cannot cross!'
            },
            shapeOptions: {
              color: '#000',
              fillOpacity: 0.2
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          poly: {
            allowIntersection: false
          }
        }
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Create custom controls for start and end locations
      const createCustomControl = (title: string, onClick: () => void) => {
        const customControl = L.Control.extend({
          onAdd: () => {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
            btn.title = title;
            btn.innerHTML = title === 'Set Start Location' ? 
              '<div style="width:80px;padding:4px;background:white;border:1px solid #ccc;box-shadow:0 1px 5px rgba(0,0,0,0.4);font-size:12px;text-align:center;cursor:pointer;color:#333;">Set Start</div>' :
              '<div style="width:80px;padding:4px;background:white;border:1px solid #ccc;box-shadow:0 1px 5px rgba(0,0,0,0.4);font-size:12px;text-align:center;cursor:pointer;color:#333;">Set End</div>';
            
            L.DomEvent.on(btn, 'click', L.DomEvent.stopPropagation)
              .on(btn, 'click', L.DomEvent.preventDefault)
              .on(btn, 'click', onClick);
            
            return btn;
          }
        });
        return new customControl({ position: title === 'Set Start Location' ? 'topleft' : 'topleft' });
      };

      // Add start location button
      createCustomControl('Set Start Location', () => {
        const centerPoint = map.getCenter();
        setStartLocation([centerPoint.lng, centerPoint.lat]);
      }).addTo(map);

      // Add end location button
      createCustomControl('Set End Location', () => {
        const centerPoint = map.getCenter();
        setEndLocation([centerPoint.lng, centerPoint.lat]);
      }).addTo(map);

      mapRef.current = map;
      setMapInitialized(true);

      // Initialize drawn items legend
      addDrawnItemsLegend(map);
    }

    return () => {
      // Cleanup map when component is unmounted
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawnItemsRef.current = null;
        drawControlRef.current = null;
        startMarkerRef.current = null;
        endMarkerRef.current = null;
      }
    };
  }, []);

  // Add legend for drawn items
  const addDrawnItemsLegend = (map: L.Map) => {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'area-boundary-legend');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
          font-size: 12px;
        ">
          <div style="font-weight: bold; margin-bottom: 5px;">Map Controls</div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <div style="width: 15px; height: 15px; background-color: #000; border-radius: 2px; margin-right: 5px; opacity: 0.2;"></div>
            <span>Area Boundary</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <div style="width: 12px; height: 12px; background-color: green; border-radius: 50%; margin-right: 5px;"></div>
            <span>Start Location</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 12px; height: 12px; background-color: red; border-radius: 50%; margin-right: 5px;"></div>
            <span>End Location</span>
          </div>
          <div style="margin-top: 10px; font-style: italic; font-size: 11px;">
            Drag markers to reposition.<br>
            Draw polygon for area boundary.
          </div>
        </div>
      `;
      return div;
    };
    
    legend.addTo(map);
  };

  // Add polygon from initial boundary if provided
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !drawnItemsRef.current) return;

    // Clear existing polygon if any
    if (polygonLayerRef.current) {
      drawnItemsRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    // Add the initial polygon if provided
    if (initialBoundary && initialBoundary.length > 0 && initialBoundary[0].length >= 3) {
      // Convert GeoJSON coordinates to Leaflet format
      const latLngs = initialBoundary[0].map(coord => 
        L.latLng(coord[1], coord[0])
      );

      // Create and add the polygon
      const polygon = L.polygon(latLngs, {
        color: '#000',
        fillOpacity: 0.2
      });
      
      drawnItemsRef.current.addLayer(polygon);
      polygonLayerRef.current = polygon;

      // Fit map to the polygon bounds
      mapRef.current.fitBounds(polygon.getBounds());
    }
  }, [initialBoundary, mapInitialized]);

  // Add start and end location markers
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;

    // Set initial start location marker
    if (initialStartLocation) {
      setStartLocation(initialStartLocation);
    }

    // Set initial end location marker
    if (initialEndLocation) {
      setEndLocation(initialEndLocation);
    }
  }, [initialStartLocation, initialEndLocation, mapInitialized]);

  // Set start location with a marker
  const setStartLocation = (coordinates: [number, number]) => {
    if (!mapRef.current) return;

    // Remove existing marker if any
    if (startMarkerRef.current) {
      startMarkerRef.current.removeFrom(mapRef.current);
    }

    // Create and add the new marker
    startMarkerRef.current = L.marker([coordinates[1], coordinates[0]], {
      icon: L.divIcon({
        className: 'start-location-marker',
        html: `<div style="width:12px;height:12px;border-radius:50%;background-color:green;border:2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      }),
      draggable: true
    }).addTo(mapRef.current);

    // Update coordinates when marker is dragged
    startMarkerRef.current.on('dragend', () => {
      if (startMarkerRef.current) {
        const position = startMarkerRef.current.getLatLng();
        onStartLocationChange([position.lng, position.lat]);
      }
    });

    // Notify parent component
    onStartLocationChange(coordinates);
  };

  // Set end location with a marker
  const setEndLocation = (coordinates: [number, number]) => {
    if (!mapRef.current) return;

    // Remove existing marker if any
    if (endMarkerRef.current) {
      endMarkerRef.current.removeFrom(mapRef.current);
    }

    // Create and add the new marker
    endMarkerRef.current = L.marker([coordinates[1], coordinates[0]], {
      icon: L.divIcon({
        className: 'end-location-marker',
        html: `<div style="width:12px;height:12px;border-radius:50%;background-color:red;border:2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      }),
      draggable: true
    }).addTo(mapRef.current);

    // Update coordinates when marker is dragged
    endMarkerRef.current.on('dragend', () => {
      if (endMarkerRef.current) {
        const position = endMarkerRef.current.getLatLng();
        onEndLocationChange([position.lng, position.lat]);
      }
    });

    // Notify parent component
    onEndLocationChange(coordinates);
  };

  // Handle draw events
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !drawnItemsRef.current) return;

    // Event handler for when a polygon is created
    const handleCreated = (e: any) => {
      // Clear previous drawings
      drawnItemsRef.current?.clearLayers();
      
      // Add the new layer
      drawnItemsRef.current?.addLayer(e.layer);
      
      if (e.layerType === 'polygon') {
        polygonLayerRef.current = e.layer;
        
        // Extract coordinates from the polygon
        const latLngs = e.layer.getLatLngs()[0];
        const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lng, latLng.lat]);
        
        // Close the polygon by duplicating the first point at the end if needed
        if (coordinates.length > 0 && 
            (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
             coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
          coordinates.push([coordinates[0][0], coordinates[0][1]]);
        }
        
        // Update parent component
        onBoundaryChange([coordinates]);
      }
    };

    // Event handler for when a polygon is edited
    const handleEdited = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer === polygonLayerRef.current) {
          // Extract coordinates from the edited polygon
          const latLngs = layer.getLatLngs()[0];
          const coordinates = latLngs.map((latLng: L.LatLng) => [latLng.lng, latLng.lat]);
          
          // Close the polygon by duplicating the first point at the end if needed
          if (coordinates.length > 0 && 
              (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
               coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push([coordinates[0][0], coordinates[0][1]]);
          }
          
          // Update parent component
          onBoundaryChange([coordinates]);
        }
      });
    };

    // Event handler for when a polygon is deleted
    const handleDeleted = () => {
      polygonLayerRef.current = null;
      onBoundaryChange([]);
    };

    // Add event listeners
    mapRef.current.on(L.Draw.Event.CREATED, handleCreated);
    mapRef.current.on(L.Draw.Event.EDITED, handleEdited);
    mapRef.current.on(L.Draw.Event.DELETED, handleDeleted);

    // Clean up event listeners when component is unmounted
    return () => {
      mapRef.current?.off(L.Draw.Event.CREATED, handleCreated);
      mapRef.current?.off(L.Draw.Event.EDITED, handleEdited);
      mapRef.current?.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [mapInitialized, onBoundaryChange]);

  return (
    <div 
      id="area-boundary-map" 
      style={{ 
        height: '500px', 
        width: '100%',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        ...style 
      }} 
    />
  );
};

export default AreaBoundaryMap;