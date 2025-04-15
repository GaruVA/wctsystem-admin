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
  onBinSelect?: (bin: Bin | null) => void;
  onBinDoubleClick?: (bin: Bin) => void; // Add double click handler
  selectedBin?: Bin | null;
  style?: React.CSSProperties;
  colorByArea?: boolean;
  suggestionBins?: Bin[]; // Add prop for suggestion bins
  binsWithIssues?: Set<string>; // Add prop for tracking bins with issues
}

// Extend the Bin type to include suggestion-specific properties
interface ExtendedBin extends Bin {
  isSuggestion?: boolean;
  reason?: string;
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
  onBinDoubleClick,
  selectedBin = null,
  style,
  colorByArea = true,
  suggestionBins = [], // Add default empty array for suggestion bins
  binsWithIssues = new Set() // Add default empty Set for bins with issues
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
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
  const createBinIcon = (
    fillLevel: number, 
    wasteType?: string, 
    areaId?: string, 
    isSuggestion?: boolean,
    binId?: string,
    hasIssue?: boolean
  ) => {
    // Fill level colors (primary color indicator)
    const getFillLevelColor = (level: number) => {
      if (level >= 90) return '#EF4444'; // Red
      if (level >= 70) return '#F59E0B'; // Orange
      if (level >= 50) return '#FBBF24'; // Yellow
      return '#10B981'; // Green
    };

    // For suggestion bins, use a special blue color
    const fillLevelColor = isSuggestion ? '#3B82F6' : getFillLevelColor(fillLevel);    // For suggestion bins, use a different icon style
    if (isSuggestion) {
      return L.divIcon({
        className: 'custom-suggestion-marker',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
          ">
            <div style="
              margin-top: 22px;
              width: 30px;
              height: 30px;
              background-color: #3B82F6;
              border-radius: 50%;
              box-shadow: 0 1px 8px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
              border: 2px solid white;
              position: relative;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });
    }// Regular bin icon
    return L.divIcon({
      className: 'custom-bin-marker',
      html: `
        <div style="
          position: relative;
          width: 24px; 
          height: 28px;
        ">
          ${hasIssue ? `<div style="
            position: absolute;
            top: -10px;
            right: -8px;
            width: 18px;
            height: 18px;
            background-color: #EF4444;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 2;
          ">!</div>` : ''}
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

  // Add legend to the map
  const addLegend = () => {
    if (!mapRef.current) return;
    
    // Remove existing legend if any
    const existingLegend = document.querySelector('.map-legend');
    if (existingLegend) existingLegend.remove();
    
    // Create legend control
    const legend = new L.Control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
        ">
          <div style="font-weight: bold; margin-bottom: 5px;">Fill Level</div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background-color: #10B981; border-radius: 2px; margin-right: 5px;"></div>
            <span>< 50% - Low</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background-color: #FBBF24; border-radius: 2px; margin-right: 5px;"></div>
            <span>50-70% - Medium</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background-color: #F59E0B; border-radius: 2px; margin-right: 5px;"></div>
            <span>70-90% - High</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 15px; height: 15px; background-color: #EF4444; border-radius: 2px; margin-right: 5px;"></div>
            <span>≥ 90% - Critical</span>
          </div>
          
          <div style="font-weight: bold; margin-bottom: 5px;">Bin Types</div>
          <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background-color: #3B82F6; border-radius: 50%; margin-right: 5px;"></div>
            <span>Suggested Bin</span>
          </div>
          
          <div style="font-weight: bold; margin-bottom: 5px; margin-top: 10px;">Waste Types</div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span class="font-medium">GEN</span> - General
          </div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span class="font-medium">ORG</span> - Organic
          </div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span class="font-medium">REC</span> - Recycle
          </div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span class="font-medium">HAZ</span> - Hazardous
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
      mapRef.current.fitBounds(group.getBounds());

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
    let allBins: { bin: ExtendedBin; areaId?: string }[] = [];
    
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
        allBins.push({ bin: bin as ExtendedBin });
      });
    }
    
    // Add suggestion bins if provided
    if (suggestionBins && suggestionBins.length > 0) {
      suggestionBins.forEach(bin => {
        allBins.push({ bin: { ...bin, isSuggestion: true } as ExtendedBin });
      });
    }    // Create bin markers
    binMarkersRef.current = allBins.map(({ bin, areaId }) => {
      const isSuggestion = (bin as ExtendedBin).isSuggestion || false;
      
      // Check if this bin has any reported issues
      const hasIssue = binsWithIssues.has(bin._id);
      
      const marker = L.marker(
        [bin.location.coordinates[1], bin.location.coordinates[0]], 
        { 
          icon: createBinIcon(
            bin.fillLevel, 
            bin.wasteType, 
            areaId, 
            isSuggestion,
            bin._id,
            hasIssue
          ) 
        }
      );
      
      // For suggestion bins, add a special popup with more info
      if (isSuggestion) {
        marker.bindPopup(`
          <div style="min-width: 200px">
            <h3 style="font-size: 16px; margin-bottom: 5px; font-weight: 600;">Suggested Bin Location</h3>
            ${bin.address ? `<p style="margin: 5px 0"><strong>Address:</strong> ${bin.address}</p>` : ''}
            <p style="margin: 5px 0"><strong>Coordinates:</strong> ${bin.location.coordinates[1].toFixed(6)}, ${bin.location.coordinates[0].toFixed(6)}</p>
            ${(bin as ExtendedBin).reason ? `<p style="margin: 5px 0"><strong>Reason:</strong> ${(bin as ExtendedBin).reason}</p>` : ''}
          </div>
        `);
      }
      
      // Add interactions (click, double click) for all bins including suggestions
      addBinMarkerInteractions(marker, bin);
      
      // Add to map
      if (mapRef.current) marker.addTo(mapRef.current);
      
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
        
        areaPolygonsRef.current.push(polygon);
        
        // Add markers for start and end locations
        if (area.startLocation && area.startLocation.coordinates) {
          L.marker([area.startLocation.coordinates[1], area.startLocation.coordinates[0]], {
            icon: L.divIcon({
              className: 'start-marker',
              html: `<div style="width:14px;height:14px;border-radius:50%;background-color:green;border:2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          })
          .addTo(mapRef.current!);
        }
        
        if (area.endLocation && area.endLocation.coordinates) {
          L.marker([area.endLocation.coordinates[1], area.endLocation.coordinates[0]], {
            icon: L.divIcon({
              className: 'end-marker',
              html: `<div style="width:14px;height:14px;border-radius:50%;background-color:blue;border:2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          })
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
    fitToRoute, 
    fitToCurrentSegment, 
    fitToAreas,
    onBinSelect,
    onBinDoubleClick,
    areaColors,
    colorByArea,
    suggestionBins,
    selectedBin
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
      ref={mapContainerRef}
      style={{ 
        height: '600px', 
        width: '100%', 
        ...style 
      }} 
    />
  );
};

export default BinMap;