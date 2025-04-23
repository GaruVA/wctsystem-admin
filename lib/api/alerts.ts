import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export enum AlertType {
  BIN_FILL_LEVEL = 'BIN_FILL_LEVEL',
  AREA_FILL_LEVEL = 'AREA_FILL_LEVEL',
  MISSED_COLLECTION = 'MISSED_COLLECTION'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum AlertStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export interface Alert {
  _id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  type: AlertType;
  createdAt: string;
}

/**
 * Get all unread alerts
 */
export const getUnreadAlerts = async (): Promise<Alert[]> => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get<{ alerts: Alert[] }>(`${API_URL}/alerts/unread`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.alerts;
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    throw error;
  }
};

/**
 * Mark a specific alert as read
 */
export const markAsRead = async (alertId: string): Promise<Alert> => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.patch<Alert>(
      `${API_URL}/alerts/${alertId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
};

/**
 * Mark all unread alerts as read
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('adminToken');
    await axios.patch(
      `${API_URL}/alerts/mark-all-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    throw error;
  }
};