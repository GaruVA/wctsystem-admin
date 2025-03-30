// API functions for collector management

import { Collector, CollectorFormData, CollectorUpdateData, StatusUpdate } from '../types/collector';

const API_BASE_URL = 'http://localhost:5000/api';

// Get all collectors (admin only)
export async function getAllCollectors(): Promise<Collector[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch collectors');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching collectors:', error);
    throw error;
  }
}

// Get active collectors only (admin only)
export async function getActiveCollectors(): Promise<{ count: number, collectors: Collector[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/active`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch active collectors');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching active collectors:', error);
    throw error;
  }
}

// Get collector by ID (admin only)
export async function getCollectorById(collectorId: string): Promise<Collector> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/${collectorId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch collector');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching collector:', error);
    throw error;
  }
}

// Create new collector (admin only)
export async function createCollector(collectorData: CollectorFormData): Promise<{ message: string, collector: Collector }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(collectorData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create collector');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating collector:', error);
    throw error;
  }
}

// Update collector (admin only)
export async function updateCollector(collectorId: string, collectorData: CollectorUpdateData): Promise<{ message: string, collector: Collector }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/${collectorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(collectorData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update collector');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating collector:', error);
    throw error;
  }
}

// Update collector status (admin only)
export async function updateCollectorStatus(collectorId: string, statusData: StatusUpdate): Promise<{ message: string, collector: Collector }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/${collectorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(statusData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update collector status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating collector status:', error);
    throw error;
  }
}

// Delete collector (admin only)
export async function deleteCollector(collectorId: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/${collectorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete collector');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting collector:', error);
    throw error;
  }
}

// Assign collector to area (admin only)
export async function assignCollectorToArea(collectorId: string, areaId: string): Promise<{ message: string, collector: Collector }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collector/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ collectorId, areaId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign collector to area');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error assigning collector to area:', error);
    throw error;
  }
}