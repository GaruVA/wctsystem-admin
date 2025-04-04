// API functions for route optimization and scheduling
const API_BASE_URL = 'http://localhost:5000/api';

// Interface for route optimization response
export interface OptimizedRoute {
  route: Array<[number, number]>; // The optimized route coordinates (polyline)
  distance: string | number; // Total distance in meters or formatted string
  duration: string | number; // Total duration in seconds or formatted string
  stops_sequence?: number[]; // The sequence of stops in the optimized order
  steps?: RouteStep[]; // Turn-by-turn navigation instructions
}

// Interface for route steps
export interface RouteStep {
  instruction: string;
  distance: string;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
  };
}

// Interface for bin scheduling flags
export interface BinScheduleOptions {
  includeIds?: string[]; // Bin IDs to include regardless of fill level
  excludeIds?: string[]; // Bin IDs to exclude regardless of fill level
  fillLevelThreshold?: number; // Override default threshold (default: 70%)
}

/**
 * Get optimized route for a specific area
 */
export async function getOptimizedRoute(areaId: string, options?: BinScheduleOptions): Promise<any> {
  try {
    // Build query params for include/exclude bins and threshold
    const queryParams = new URLSearchParams();
    
    if (options?.includeIds?.length) {
      queryParams.append('include', options.includeIds.join(','));
    }
    
    if (options?.excludeIds?.length) {
      queryParams.append('exclude', options.excludeIds.join(','));
    }
    
    if (options?.fillLevelThreshold !== undefined) {
      queryParams.append('threshold', options.fillLevelThreshold.toString());
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${API_BASE_URL}/route-optimization/area/${areaId}${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get optimized route: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting optimized route:', error);
    throw error;
  }
}

/**
 * Generate custom optimized route
 */
export async function generateCustomRoute(
  start: [number, number], 
  stops: Array<[number, number]>, 
  end: [number, number]
): Promise<OptimizedRoute> {
  try {
    const response = await fetch(`${API_BASE_URL}/route-optimization/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ start, stops, end })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate route: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating custom route:', error);
    throw error;
  }
}

/**
 * Save a route schedule to the database
 */
export async function saveRouteSchedule(scheduleData: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(scheduleData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save schedule: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving route schedule:', error);
    throw error;
  }
}

/**
 * Get all saved route schedules
 */
export async function getAllSchedules(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
}

/**
 * Adjust an existing route by adding/removing bins or reordering them
 */
export async function adjustExistingRoute(
  areaId: string,
  existingRoute: any,
  includeBins: string[] = [],
  excludeBins: string[] = [],
  binOrder: string[] = []
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/route-optimization/adjust-existing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({
        areaId,
        existingRoute,
        includeBins,
        excludeBins,
        binOrder
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to adjust route: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adjusting route:', error);
    throw error;
  }
}