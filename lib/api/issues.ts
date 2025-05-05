// API functions for issue management
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Interface for issue data
 */
export interface Issue {
  _id: string;
  description: string;
  images: string[];
  status: 'pending' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all issues
 */
export async function getAllIssues(): Promise<Issue[]> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/issues`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch issues');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}

/**
 * Update issue status
 */
export async function updateIssueStatus(issueId: string, status: 'pending' | 'resolved'): Promise<Issue> {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update issue status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
}