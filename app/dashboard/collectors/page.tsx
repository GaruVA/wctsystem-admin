"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Search, UserPlus, Filter, X, Edit, Trash2 } from "lucide-react";
import { 
  getAllCollectors, 
  getActiveCollectors, 
  createCollector, 
  updateCollector, 
  deleteCollector, 
  updateCollectorStatus,
  assignCollectorToArea 
} from "@/lib/api/collectors";
import { getAllAreasWithBins } from "@/lib/api/areas";
import { Collector, CollectorFormData, CollectorUpdateData } from "@/lib/types/collector";

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [areas, setAreas] = useState<{areaID: string, areaName: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  
  // Selected collector for operations
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  
  // Form data
  const [collectorFormData, setCollectorFormData] = useState<CollectorFormData>({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    status: "active"
  });
  
  // Load collectors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collectorsData = await getAllCollectors();
        setCollectors(collectorsData);
        
        // Also fetch areas for assigning collectors
        const areasData = await getAllAreasWithBins();
        setAreas(areasData.map(area => ({ 
          areaID: area.areaID, 
          areaName: area.areaName 
        })));
        
        setError(null);
      } catch (err) {
        console.error('Failed to load collectors:', err);
        setError('Failed to load collectors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter collectors based on search term and status
  const filteredCollectors = collectors.filter(collector => {
    const matchesSearch = 
      collector.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collector.firstName && collector.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (collector.lastName && collector.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || collector.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCollectorFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Reset form data
  const resetFormData = () => {
    setCollectorFormData({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      status: "active"
    });
  };
  
  // Open edit modal and populate form with selected collector data
  const openEditModal = (collector: Collector) => {
    setSelectedCollector(collector);
    setCollectorFormData({
      username: collector.username,
      password: "", // Don't populate password for security
      email: collector.email,
      firstName: collector.firstName || "",
      lastName: collector.lastName || "",
      phone: collector.phone || "",
      status: collector.status
    });
    setIsEditModalOpen(true);
  };
  
  // Open add collector modal with fresh form
  const openAddModal = () => {
    // Make sure form is reset before opening add modal
    resetFormData();
    setIsAddModalOpen(true);
  };
  
  // Open status change modal
  const openStatusModal = (collector: Collector) => {
    setSelectedCollector(collector);
    setIsStatusModalOpen(true);
  };
  
  // Open assign area modal
  const openAssignModal = (collector: Collector) => {
    setSelectedCollector(collector);
    setIsAssignModalOpen(true);
  };
  
  // Handle add collector form submission
  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createCollector(collectorFormData);
      
      // Refresh the collectors list
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close modal and reset form
      setIsAddModalOpen(false);
      resetFormData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to add collector:', err);
      setError(err.message || 'Failed to add collector. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit collector form submission
  const handleEditCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollector) return;
    
    try {
      setLoading(true);
      const updateData: CollectorUpdateData = {
        username: collectorFormData.username,
        email: collectorFormData.email,
        firstName: collectorFormData.firstName,
        lastName: collectorFormData.lastName,
        phone: collectorFormData.phone,
        status: collectorFormData.status
      };
      
      await updateCollector(selectedCollector._id, updateData);
      
      // Refresh the collectors list
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close modal and reset
      setIsEditModalOpen(false);
      setSelectedCollector(null);
      resetFormData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to update collector:', err);
      setError(err.message || 'Failed to update collector. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete collector
  const handleDeleteCollector = async () => {
    if (!selectedCollector) return;
    
    try {
      setLoading(true);
      await deleteCollector(selectedCollector._id);
      
      // Refresh the collectors list
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setSelectedCollector(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to delete collector:', err);
      setError(err.message || 'Failed to delete collector. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (status: 'active' | 'on-leave' | 'inactive') => {
    if (!selectedCollector) return;
    
    try {
      setLoading(true);
      await updateCollectorStatus(selectedCollector._id, { status });
      
      // Refresh the collectors list
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close modal and reset
      setIsStatusModalOpen(false);
      setSelectedCollector(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to update collector status:', err);
      setError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle area assignment
  const handleAssignArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollector) return;
    
    const areaId = (document.getElementById('areaId') as HTMLSelectElement).value;
    
    try {
      setLoading(true);
      await assignCollectorToArea(selectedCollector._id, areaId);
      
      // Refresh the collectors list
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close modal and reset
      setIsAssignModalOpen(false);
      setSelectedCollector(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to assign area:', err);
      setError(err.message || 'Failed to assign area. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter by status
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
  };
  
  // Format collector name
  const getCollectorName = (collector: Collector) => {
    if (collector.firstName && collector.lastName) {
      return `${collector.firstName} ${collector.lastName}`;
    }
    return collector.username;
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "on-leave":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Collector Management</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search collectors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={openAddModal}
          >
            <UserPlus size={16} /> Add Collector
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Collectors</span>
          </CardTitle>
          <CardDescription>
            Manage waste collection personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-center py-4">Loading collectors...</p>}
          
          {!loading && filteredCollectors.length === 0 && (
            <p className="text-center py-4">No collectors found. Add a new collector to get started.</p>
          )}
          
          {!loading && filteredCollectors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Username</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assigned Area</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollectors.map((collector) => (
                    <tr key={collector._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{collector._id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">{getCollectorName(collector)}</td>
                      <td className="py-3 px-4">{collector.username}</td>
                      <td className="py-3 px-4">{collector.email}</td>
                      <td className="py-3 px-4">{collector.phone || '-'}</td>
                      <td className="py-3 px-4">{collector.area ? collector.area.name : 'Not assigned'}</td>
                      <td className="py-3 px-4">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(collector.status)}`}
                          onClick={() => openStatusModal(collector)}
                        >
                          {collector.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="p-1 hover:bg-gray-200 rounded-full"
                            onClick={() => openEditModal(collector)}
                            title="Edit Collector"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1 hover:bg-gray-200 rounded-full"
                            onClick={() => { setSelectedCollector(collector); setIsDeleteModalOpen(true); }}
                            title="Delete Collector"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            onClick={() => openAssignModal(collector)}
                          >
                            Assign Area
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Collector Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Collector</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCollector}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                  <input
                    type="text"
                    name="username"
                    value={collectorFormData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    name="password"
                    value={collectorFormData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={collectorFormData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={collectorFormData.firstName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={collectorFormData.lastName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={collectorFormData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={collectorFormData.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Area (Optional)</label>
                  <select
                    name="areaId"
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select an area...</option>
                    {areas.map(area => (
                      <option key={area.areaID} value={area.areaID}>
                        {area.areaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Collector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Collector Modal */}
      {isEditModalOpen && selectedCollector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Collector</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditCollector}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={collectorFormData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={collectorFormData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={collectorFormData.firstName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={collectorFormData.lastName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={collectorFormData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={collectorFormData.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCollector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-6">
              Are you sure you want to delete collector <span className="font-semibold">{getCollectorName(selectedCollector)}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollector}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Collector'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Change Modal */}
      {isStatusModalOpen && selectedCollector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Change Status</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4">
              Update status for <span className="font-semibold">{getCollectorName(selectedCollector)}</span>
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleStatusChange('active')}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  selectedCollector.status === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass('active')} mb-2`}>
                  Active
                </span>
                <span className="text-sm">Available for work</span>
              </button>
              
              <button
                onClick={() => handleStatusChange('on-leave')}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  selectedCollector.status === 'on-leave' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass('on-leave')} mb-2`}>
                  On Leave
                </span>
                <span className="text-sm">Temporarily unavailable</span>
              </button>
              
              <button
                onClick={() => handleStatusChange('inactive')}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  selectedCollector.status === 'inactive' ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass('inactive')} mb-2`}>
                  Inactive
                </span>
                <span className="text-sm">Not available</span>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign Area Modal */}
      {isAssignModalOpen && selectedCollector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Area</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4">
              Assign area for <span className="font-semibold">{getCollectorName(selectedCollector)}</span>
            </p>
            
            <form onSubmit={handleAssignArea}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Area</label>
                <select
                  id="areaId"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue={selectedCollector.area?._id}
                  required
                >
                  <option value="">Select an area...</option>
                  {areas.map(area => (
                    <option key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Assigning...' : 'Assign Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}