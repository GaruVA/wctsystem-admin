// API functions for area management

const API_BASE_URL = 'http://localhost:5000/api';

// Interface for bin data
export interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fillLevel: number;
  lastCollected: string;
  address?: string;
  wasteTypes: string; // Added wasteTypes property
}

// Interface for area data with bins
export interface AreaWithBins {
  areaName: string;
  areaID: string;
  geometry: {
    type: string;
    coordinates: [number, number][][]; // GeoJSON Polygon coordinates
  };
  bins: Bin[];
  startLocation: {
    type: string;
    coordinates: [number, number];
  };
  endLocation: {
    type: string;
    coordinates: [number, number];
  };
}

// Get all areas with their bins
export async function getAllAreasWithBins(): Promise<AreaWithBins[]> {
  try {
    console.log('Fetching areas with bins from:', `${API_BASE_URL}/areas/with-bins`);
    console.log('Token used:', localStorage.getItem('adminToken')?.substring(0, 10) + '...');
    
    const response = await fetch(`${API_BASE_URL}/areas/with-bins`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to fetch areas with bins: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Areas data received:', data ? `${data.length} areas` : 'No data');
    return data;
  } catch (error) {
    console.error('Error fetching areas with bins:', error);
    throw error;
  }
}

// Get single area with bins by ID
export async function getAreaWithBinsById(areaId: string): Promise<AreaWithBins> {
  try {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}/bins`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch area with bins');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching area with bins:', error);
    throw error;
  }
}