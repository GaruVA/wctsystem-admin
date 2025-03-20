import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your actual backend URL
});

interface Collector {
  _id: string;
  username: string;
  email: string;
  area: string;
  currentLocation?: [number, number];
}

const Driver: React.FC = () => {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    areaId: '',
  });
  const [assignData, setAssignData] = useState({
    collectorId: '',
    areaId: '',
  });
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
  });

  // Fetch collectors from the backend
  useEffect(() => {
    fetchCollectors();
  }, []);

  const fetchCollectors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching collectors with the following details:');
      console.log('Request URL:', '/collector/area');
      console.log('Headers:', { Authorization: `Bearer ${token}` });

      const response = await api.get<Collector[]>('/collector/area', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response Data:', response.data);
      setCollectors(response.data);
    } catch (error) {
      console.error('Error fetching collectors:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle location input changes
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationData({ ...locationData, [e.target.name]: e.target.value });
  };

  // Handle assign input changes
  const handleAssignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssignData({ ...assignData, [e.target.name]: e.target.value });
  };

  // Handle form submission to add a collector
  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Adding collector with the following details:');
      console.log('Request URL:', '/collector/add');
      console.log('Headers:', { Authorization: `Bearer ${token}` });
      console.log('Request Body:', formData);

      const response = await api.post<Collector>('/collector/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response Data:', response.data);
      setCollectors([...collectors, response.data]);
      setFormData({ username: '', password: '', email: '', areaId: '' });
      alert('Collector added successfully!');
    } catch (error) {
      console.error('Error adding collector:', error);
    }
  };

  // Handle delete collector
  const handleDeleteCollector = async (collectorId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/collector/${collectorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCollectors(collectors.filter((collector) => collector._id !== collectorId));
      alert('Collector deleted successfully!');
    } catch (error) {
      console.error('Error deleting collector:', error);
    }
  };

  // Handle update location
  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        '/collector/location',
        {
          latitude: parseFloat(locationData.latitude),
          longitude: parseFloat(locationData.longitude),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data as { message: string };
      alert(data.message);
      setLocationData({ latitude: '', longitude: '' });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Handle assign collector to area
  const handleAssignCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/collector/assign', assignData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Collector assigned to area successfully!');
      setAssignData({ collectorId: '', areaId: '' });
    } catch (error) {
      console.error('Error assigning collector:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Collector Management</h1>

      {/* Add Collector Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Collector</h2>
        <form onSubmit={handleAddCollector} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="areaId"
            placeholder="Area ID"
            value={formData.areaId}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Add Collector
          </button>
        </form>
      </div>

      {/* Collector List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Collectors</h2>
        <ul className="space-y-4">
          {collectors.map((collector) => (
            <li
              key={collector._id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span
                className="cursor-pointer text-blue-500"
                onClick={() => setSelectedCollector(collector)}
              >
                {collector.username}
              </span>
              <button
                onClick={() => handleDeleteCollector(collector._id)}
                className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Collector Details */}
      {selectedCollector && (
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Collector Details</h3>
          <p>
            <strong>Username:</strong> {selectedCollector.username}
          </p>
          <p>
            <strong>Email:</strong> {selectedCollector.email}
          </p>
          <p>
            <strong>Area:</strong> {selectedCollector.area}
          </p>
          {selectedCollector.currentLocation && (
            <p>
              <strong>Location:</strong> {selectedCollector.currentLocation[0]},{' '}
              {selectedCollector.currentLocation[1]}
            </p>
          )}
        </div>
      )}

      {/* Update Location Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Update Location</h2>
        <form onSubmit={handleUpdateLocation} className="space-y-4">
          <input
            type="text"
            name="latitude"
            placeholder="Latitude"
            value={locationData.latitude}
            onChange={handleLocationChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="longitude"
            placeholder="Longitude"
            value={locationData.longitude}
            onChange={handleLocationChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          >
            Update Location
          </button>
        </form>
      </div>

      {/* Assign Collector to Area Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Assign Collector to Area</h2>
        <form onSubmit={handleAssignCollector} className="space-y-4">
          <input
            type="text"
            name="collectorId"
            placeholder="Collector ID"
            value={assignData.collectorId}
            onChange={handleAssignChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="areaId"
            placeholder="Area ID"
            value={assignData.areaId}
            onChange={handleAssignChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
          >
            Assign Collector
          </button>
        </form>
      </div>
    </div>
  );
};

export default Driver;