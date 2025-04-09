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
 * Interface for schedule creation/update
 */
export interface ScheduleData {
  name: string;
  areaId: string;
  collectorId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  route: Array<[number, number]>;
  distance: number;
  duration: number;
  binSequence: string[];
}

/**
 * Get all schedules (with area and collector populated)
 */
export async function getAllSchedules(
  query: { date?: string; fromDate?: string; toDate?: string; areaId?: string; collectorId?: string; status?: string } = {}
): Promise<Schedule[]> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add query parameters if present - handle both date and date range params
    if (query.date) {
      // Format the date as YYYY-MM-DD for the API
      queryParams.append('date', query.date);
      
      // If no explicit fromDate/toDate provided, use date for both
      if (!query.fromDate) queryParams.append('fromDate', query.date);
      if (!query.toDate) queryParams.append('toDate', query.date);
    } else {
      // If no specific date but we have fromDate/toDate range
      if (query.fromDate) queryParams.append('fromDate', query.fromDate);
      if (query.toDate) queryParams.append('toDate', query.toDate);
    }
    
    if (query.areaId) queryParams.append('areaId', query.areaId);
    if (query.collectorId) queryParams.append('collectorId', query.collectorId);
    if (query.status) queryParams.append('status', query.status);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_BASE_URL}/schedules${queryString}`;
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
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
    throw error;
  }
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(scheduleId: string): Promise<Schedule> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch schedule');
    }
    
    const schedule = await response.json();
    
    // Process the data structure to ensure area and collector information is properly normalized
    // Handle area information
    if (schedule.areaId && typeof schedule.areaId === 'object' && schedule.areaId._id) {
      schedule.area = {
        _id: schedule.areaId._id,
        name: schedule.areaId.name || 'Unknown Area'
      };
    }
    
    // Handle collector information
    if (schedule.collectorId && typeof schedule.collectorId === 'object' && schedule.collectorId._id) {
      schedule.collector = {
        _id: schedule.collectorId._id,
        firstName: schedule.collectorId.firstName || 'Unknown',
        lastName: schedule.collectorId.lastName || 'Collector',
        username: schedule.collectorId.username || '',
        phone: schedule.collectorId.phone || ''
      };
    }
    
    return schedule;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(scheduleData: ScheduleData): Promise<Schedule> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
 * Update an existing schedule
 */
export async function updateSchedule(scheduleId: string, scheduleData: Partial<ScheduleData>): Promise<Schedule> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scheduleData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating schedule:', error);
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
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
 * Assign collector to schedule
 */
export async function assignCollector(scheduleId: string, collectorId: string): Promise<Schedule> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ collectorId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign collector to schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error assigning collector to schedule:', error);
    throw error;
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<{ message: string }> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
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

/**
 * Save route as schedule (helper function for route page)
 */
export async function saveRouteSchedule(scheduleData: any): Promise<Schedule> {
  try {
    return await createSchedule(scheduleData as unknown as ScheduleData);
  } catch (error) {
    console.error('Error saving route as schedule:', error);
    throw error;
  }
}

/**
 * Get weekly schedule overview (counts by day and status)
 */
export async function getWeeklyScheduleOverview(
  query: { fromDate: string; toDate: string }
): Promise<any> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    if (query.fromDate) queryParams.append('fromDate', query.fromDate);
    if (query.toDate) queryParams.append('toDate', query.toDate);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_BASE_URL}/schedules/weekly-overview${queryString}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching weekly schedule overview:', error);
    throw error;
  }
}