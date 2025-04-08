// API functions for schedule management
import { Collector } from '../types/collector';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Interface for schedule data
 */
export interface Schedule {
  _id: string;
  name: string;
  areaId: string;
  area?: {
    _id: string;
    name: string;
  };
  collectorId: string;
  collector?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    phone?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  binSequence: string[];
  route: Array<[number, number]>;
  distance: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all schedules (with area and collector populated)
 */
export async function getAllSchedules(
  query: { date?: string; areaId?: string; collectorId?: string; status?: string } = {}
): Promise<Schedule[]> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add query parameters if present
    if (query.date) {
      // Format the date as YYYY-MM-DD for the API
      queryParams.append('date', query.date);
      
      // We also need to add fromDate and toDate for the backend's date range filter
      queryParams.append('fromDate', query.date);
      queryParams.append('toDate', query.date);
    }
    
    if (query.areaId) queryParams.append('areaId', query.areaId);
    if (query.collectorId) queryParams.append('collectorId', query.collectorId);
    if (query.status) queryParams.append('status', query.status);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_BASE_URL}/schedules${queryString}`;
    
    console.log('Fetching schedules from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('API Response:', responseData);
    
    // Handle the backend response structure - backend returns an object with data property
    const schedulesData = responseData.data || responseData;
    
    // Process the data to ensure we have correct structure
    const schedules = Array.isArray(schedulesData) 
      ? schedulesData 
      : [];
    
    // Map through schedules to normalize the structure
    return schedules.map(schedule => {
      // Convert any potential nested objects with _id to proper structure
      if (schedule.areaId && typeof schedule.areaId === 'object' && schedule.areaId._id) {
        schedule.area = {
          _id: schedule.areaId._id,
          name: schedule.areaId.name || 'Unknown Area'
        };
      }
      
      if (schedule.collectorId && typeof schedule.collectorId === 'object' && schedule.collectorId._id) {
        schedule.collector = {
          _id: schedule.collectorId._id,
          firstName: schedule.collectorId.firstName || 'Unknown',
          lastName: schedule.collectorId.lastName || 'Collector',
          username: schedule.collectorId.username || ''
        };
      }
      
      return schedule;
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(scheduleId: string): Promise<Schedule> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(scheduleData: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
}

/**
 * Update schedule status
 */
export async function updateScheduleStatus(
  scheduleId: string, 
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
): Promise<Schedule> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update schedule status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating schedule status:', error);
    throw error;
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}