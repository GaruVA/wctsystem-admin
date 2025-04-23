"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bin } from '../../lib/api/areas';

// Define interfaces for the component
interface SuggestionBinMapProps {
  suggestionBins: Bin[];
  onBinSelect?: (bin: Bin | null) => void;
  onBinDoubleClick?: (bin: Bin) => void;
  selectedBin?: Bin | null;
  style?: React.CSSProperties;
}

// Extend the Bin type to include suggestion-specific properties
interface SuggestionBin extends Bin {
  reason?: string;
}

const SuggestionBinMap: React.FC<SuggestionBinMapProps> = ({
  suggestionBins = [],
  onBinSelect,
  onBinDoubleClick,
  selectedBin = null,
  style,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const binMarkersRef = useRef<L.Marker[]>([]);
  const mapInitializedRef = useRef<boolean>(false);

  // Create bin icon specifically for suggestion bins
  const createSuggestionBinIcon = () => {
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

  // Update markers when suggestion bins change
  useEffect(() => {
    if (!mapRef.current || !mapInitializedRef.current) return;

    // Clear previous markers
    if (binMarkersRef.current.length > 0) {
      binMarkersRef.current.forEach(marker => {
        if (mapRef.current) marker.removeFrom(mapRef.current);
      });
      binMarkersRef.current = [];
    }

    // Create new markers for suggestion bins
    if (suggestionBins.length > 0) {
      binMarkersRef.current = suggestionBins.map(bin => {
        const marker = L.marker(
          [bin.location.coordinates[1], bin.location.coordinates[0]], 
          { icon: createSuggestionBinIcon() }
        );
        
        // Add popup with bin details
        marker.bindPopup(`
          <div style="min-width: 200px">
            <h3 style="font-size: 16px; margin-bottom: 5px; font-weight: 600;">Suggested Bin Location</h3>
            ${bin.address ? `<p style="margin: 5px 0"><strong>Address:</strong> ${bin.address}</p>` : ''}
            <p style="margin: 5px 0"><strong>Coordinates:</strong> ${bin.location.coordinates[1].toFixed(6)}, ${bin.location.coordinates[0].toFixed(6)}</p>
            ${(bin as SuggestionBin).reason ? `<p style="margin: 5px 0"><strong>Reason:</strong> ${(bin as SuggestionBin).reason}</p>` : ''}
          </div>
        `);
        
        // Add interactions (click, double click)
        addBinMarkerInteractions(marker, bin);
        
        // Add to map
        if (mapRef.current) marker.addTo(mapRef.current);
        
        return marker;
      });

      // Fit map to all suggestion bins
      const binCoords = suggestionBins.map(bin => ({
        lat: bin.location.coordinates[1],
        lng: bin.location.coordinates[0]
      }));
      
      fitMapToCoordinates(binCoords);
    }
  }, [suggestionBins, onBinSelect, onBinDoubleClick, selectedBin]);

  // Handle selected bin highlighting
  useEffect(() => {
    if (selectedBin) {
      fitMapToCoordinates([{
        lat: selectedBin.location.coordinates[1],
        lng: selectedBin.location.coordinates[0]
      }]);
    }
  }, [selectedBin]);

  return (
    <div 
      ref={mapContainerRef}
      style={{ 
        height: '400px', 
        width: '100%', 
        borderRadius: '8px',
        ...style 
      }} 
    />
  );
};

export default SuggestionBinMap;