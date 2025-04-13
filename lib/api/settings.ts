import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface NotificationSettings {
  enabled: boolean;
  criticalThreshold: number;
  warningThreshold: number;
  emailAlerts: boolean;
  smsAlerts: boolean;
}

export interface Settings {
  _id?: string;
  systemName: string;
  adminEmail: string;
  notifications: NotificationSettings;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all system settings
 */
export const getSettings = async (): Promise<Settings> => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(`${API_URL}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data as Settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

/**
 * Update system settings
 */
export const updateSettings = async (settingsData: Partial<Settings>): Promise<Settings> => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.put(`${API_URL}/settings`, settingsData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data as Settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};