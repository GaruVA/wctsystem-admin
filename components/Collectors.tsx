"use client";

import { useState, useEffect } from 'react';
import { 
  getAllCollectors, 
  createCollector, 
  updateCollector, 
  deleteCollector,
  assignCollectorToArea
} from '../lib/api/collectors';
import { Collector, CollectorFormData, CollectorUpdateData } from '../lib/types/collector';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function Collectors() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCollectorId, setEditingCollectorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CollectorFormData>({
    username: '',
    password: '',
    email: '',
    areaId: ''
  });
  const [updateData, setUpdateData] = useState<CollectorUpdateData>({
    username: '',
    email: '',
    area: ''
  });

  // Fetch all collectors on component mount
  useEffect(() => {
    fetchCollectors();
  }, []);

  const fetchCollectors = async () => {
    try {
      setLoading(true);
      const data = await getAllCollectors();
      setCollectors(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch collectors');
      console.error('Error fetching collectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createCollector(formData);
      setShowAddForm(false);
      setFormData({
        username: '',
        password: '',
        email: '',
        areaId: ''
      });
      fetchCollectors();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add collector');
      }
    } finally {
      setLoading(false);
    }
  };

  const prepareForEdit = (collector: Collector) => {
    setEditingCollectorId(collector._id);
    setUpdateData({
      username: collector.username,
      email: collector.email,
      area: collector.area || ''
    });
  };

  const cancelEdit = () => {
    setEditingCollectorId(null);
    setUpdateData({
      username: '',
      email: '',
      area: ''
    });
  };

  const handleUpdateCollector = async (e: React.FormEvent, collectorId: string) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateCollector(collectorId, updateData);
      setEditingCollectorId(null);
      fetchCollectors();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update collector');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollector = async (collectorId: string) => {
    if (window.confirm('Are you sure you want to delete this collector?')) {
      try {
        setLoading(true);
        await deleteCollector(collectorId);
        fetchCollectors();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to delete collector');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignArea = async (collectorId: string, areaId: string) => {
    if (!areaId) {
      setError('Please enter an area ID');
      return;
    }
    
    try {
      setLoading(true);
      await assignCollectorToArea(collectorId, areaId);
      fetchCollectors();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to assign area');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to safely display location coordinates
  const formatLocation = (location?: [number, number]) => {
    if (!location || !Array.isArray(location) || location.length < 2) {
      return 'Not available';
    }
    return `[${location[0].toFixed(4)}, ${location[1].toFixed(4)}]`;
  };

  if (loading && collectors.length === 0) {
    return <div className="text-center mt-8">Loading collectors...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Collectors Management</h1>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {showAddForm ? 'Cancel' : 'Add New Collector'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      {showAddForm && (
        <Card className="p-4 mb-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Add New Collector</h2>
          <form onSubmit={handleAddCollector}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="areaId">Area ID (Optional)</Label>
                <Input
                  id="areaId"
                  name="areaId"
                  value={formData.areaId}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                type="submit" 
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Collector'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Area ID</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collectors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center">
                  No collectors found.
                </td>
              </tr>
            ) : (
              collectors.map(collector => (
                <tr key={collector._id} className="border-t border-gray-200">
                  {editingCollectorId === collector._id ? (
                    // Edit mode
                    <>
                      <td className="px-4 py-2">
                        <Input
                          name="username"
                          value={updateData.username}
                          onChange={handleUpdateInputChange}
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          name="email"
                          value={updateData.email}
                          onChange={handleUpdateInputChange}
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          name="area"
                          value={updateData.area}
                          onChange={handleUpdateInputChange}
                        />
                      </td>
                      <td className="px-4 py-2">
                        {formatLocation(collector.currentLocation)}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <Button 
                          onClick={(e) => handleUpdateCollector(e, collector._id)}
                          className="bg-green-500 hover:bg-green-600 text-white text-sm"
                          disabled={loading}
                        >
                          Save
                        </Button>
                        <Button 
                          onClick={cancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-sm"
                        >
                          Cancel
                        </Button>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td className="px-4 py-2">{collector.username}</td>
                      <td className="px-4 py-2">{collector.email}</td>
                      <td className="px-4 py-2">
                        {collector.area || (
                          <div className="flex space-x-2">
                            <Input
                              className="w-32 h-8 text-sm"
                              placeholder="Area ID"
                              id={`area-${collector._id}`}
                            />
                            <Button
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8"
                              onClick={() => {
                                const input = document.getElementById(`area-${collector._id}`) as HTMLInputElement;
                                handleAssignArea(collector._id, input.value);
                              }}
                            >
                              Assign
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {formatLocation(collector.currentLocation)}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <Button 
                          onClick={() => prepareForEdit(collector)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleDeleteCollector(collector._id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm"
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}