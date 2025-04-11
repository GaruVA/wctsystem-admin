"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCog, 
  BarChart3, 
  CheckCircle, 
  Clock,
  AlertCircle,
  MapPin,
  Trophy,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [areas, setAreas] = useState<{areaID: string, areaName: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<boolean>(false);
  
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
        
        // Use the actual efficiency values from the backend
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
  
  // Filter collectors based on search term, status, and active tab
  const filteredCollectors = collectors.filter(collector => {
    const matchesSearch = 
      collector.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collector.firstName && collector.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (collector.lastName && collector.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter always applies
    const matchesStatus = statusFilter === "all" || collector.status === statusFilter;
    
    // Tab filter
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "assigned" && collector.area) || 
      (activeTab === "unassigned" && !collector.area);
    
    return matchesSearch && matchesStatus && matchesTab;
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
  
  // Open edit dialog and populate form with selected collector data
  const openEditDialog = (collector: Collector) => {
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
    setIsEditDialogOpen(true);
  };
  
  // Open status change dialog
  const openStatusDialog = (collector: Collector) => {
    setSelectedCollector(collector);
    setIsStatusDialogOpen(true);
  };
  
  // Open assign area dialog
  const openAssignDialog = (collector: Collector) => {
    setSelectedCollector(collector);
    setIsAssignDialogOpen(true);
  };
  
  // Handle add collector form submission
  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createCollector(collectorFormData);
      
      // Refresh the collectors list with actual data from backend
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close dialog and reset form
      setIsAddDialogOpen(false);
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
      
      // Refresh the collectors list with actual data from backend
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close dialog and reset
      setIsEditDialogOpen(false);
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
      
      // Refresh the collectors list with actual data from backend
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close dialog and reset
      setIsDeleteDialogOpen(false);
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
      
      // Refresh the collectors list with actual data from backend
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close dialog and reset
      setIsStatusDialogOpen(false);
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
      
      // Refresh the collectors list with actual data from backend
      const collectorsData = await getAllCollectors();
      setCollectors(collectorsData);
      
      // Close dialog and reset
      setIsAssignDialogOpen(false);
      setSelectedCollector(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to assign area:', err);
      setError(err.message || 'Failed to assign area. Please try again.');
    } finally {
      setLoading(false);
    }
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
  
  // Get efficiency color based on percentage
  const getEfficiencyColor = (efficiency: number | undefined) => {
    if (!efficiency) return "bg-gray-500";
    if (efficiency >= 90) return "bg-green-500";
    if (efficiency >= 75) return "bg-blue-500";
    if (efficiency >= 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  // Get efficiency label
  const getEfficiencyLabel = (efficiency: number | undefined) => {
    if (!efficiency) return "N/A";
    if (efficiency >= 90) return "Excellent";
    if (efficiency >= 75) return "Good";
    if (efficiency >= 60) return "Average";
    return "Poor";
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Collectors</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search collectors..."
              className="pl-10 w-64 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size={"sm"} onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Collector
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Collector List</span>
          </CardTitle>
          <CardDescription>
            Manage waste collection personnel and view performance
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList>
            <TabsTrigger value="all">All Collectors</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          </TabsList>
        </Tabs>

        <CardContent>
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {!loading && filteredCollectors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No collectors found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {activeTab === "all" 
                  ? "Add a new collector to get started" 
                  : activeTab === "assigned" 
                    ? "No assigned collectors found" 
                    : "No unassigned collectors found"
                }
              </p>
              {activeTab === "all" && (
                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Collector
                </Button>
              )}
            </div>
          )}
          
          {!loading && filteredCollectors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assigned Area</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Efficiency</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollectors.map((collector) => (
                    <tr key={collector._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{getCollectorName(collector)}</span>
                          <span className="text-xs text-gray-500">{collector.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {collector.status === 'active' && (
                            <span className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                              <Badge variant="outline" className={getStatusBadgeClass(collector.status)}>
                                Active
                              </Badge>
                            </span>
                          )}
                          {collector.status === 'on-leave' && (
                            <span className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                              <Badge variant="outline" className={getStatusBadgeClass(collector.status)}>
                                On Leave
                              </Badge>
                            </span>
                          )}
                          {collector.status === 'inactive' && (
                            <span className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                              <Badge variant="outline" className={getStatusBadgeClass(collector.status)}>
                                Inactive
                              </Badge>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {collector.area ? (
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            <span>{collector.area.name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 bg-gray-100">Not assigned</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{collector.efficiency || 'N/A'}%</span>
                            <span className="text-xs text-gray-500">{getEfficiencyLabel(collector.efficiency)}</span>
                          </div>
                          <Progress
                            value={collector.efficiency} 
                            className="h-2"
                          >
                            <div 
                              className={`h-full ${getEfficiencyColor(collector.efficiency)}`} 
                              style={{ width: `${collector.efficiency || 0}%` }}
                            />
                          </Progress>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm">{collector.email}</span>
                          <span className="text-xs text-gray-500">{collector.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(collector)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusDialog(collector)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAssignDialog(collector)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              {collector.area ? 'Reassign Area' : 'Assign Area'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedCollector(collector); setIsDeleteDialogOpen(true); }}
                              className="text-red-600 focus:text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collector Performance Overview */}
      <div className="grid gap-6 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Collector Performance Overview</span>
            </CardTitle>
            <CardDescription>
              Key metrics and insights about waste collection team performance
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectors.length}</div>
            <p className="text-xs text-muted-foreground">{collectors.filter(c => c.status === 'active').length} active collectors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Efficiency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {
                collectors.length > 0 
                  ? (collectors.reduce((acc, c) => acc + (c.efficiency || 0), 0) / collectors.length).toFixed(1)
                  : "0"
              }%
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-muted">
              <div 
                className="h-2 rounded-full bg-blue-500" 
                style={{ 
                  width: collectors.length > 0 
                    ? `${collectors.reduce((acc, c) => acc + (c.efficiency || 0), 0) / collectors.length}%`
                    : "0%"
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Area Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectors.filter(c => c.area).length}/{collectors.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(collectors.filter(c => c.area).length / Math.max(collectors.length, 1) * 100)}% assigned to areas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {collectors.filter(c => c.status === 'active' && c.efficiency).length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {
                    getCollectorName(
                      collectors
                        .filter(c => c.status === 'active' && c.efficiency)
                        .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))[0]
                    )
                  }
                </div>
                <p className="text-xs flex items-center gap-1 text-muted-foreground">
                  <span className={getEfficiencyColor(
                    collectors
                      .filter(c => c.status === 'active' && c.efficiency)
                      .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))[0]?.efficiency
                  ).replace('bg-', 'text-')}>{
                    collectors
                      .filter(c => c.status === 'active' && c.efficiency)
                      .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))[0]?.efficiency
                  }%</span> efficiency rating
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">N/A</div>
                <p className="text-xs text-muted-foreground">No active collectors</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Collector Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Collector
            </DialogTitle>
            <DialogDescription>
              Create a new collector account to manage waste collection assignments.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCollector} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username*</Label>
                <Input
                  id="username"
                  name="username"
                  value={collectorFormData.username}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password*</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={collectorFormData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={collectorFormData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={collectorFormData.firstName}
                  onChange={handleInputChange}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={collectorFormData.lastName}
                  onChange={handleInputChange}
                  autoComplete="family-name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={collectorFormData.phone}
                  onChange={handleInputChange}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={collectorFormData.status} onValueChange={(value) => 
                  setCollectorFormData({...collectorFormData, status: value as 'active' | 'on-leave' | 'inactive'})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="areaId">Assign to Area (Optional)</Label>
              <Select name="areaId" value={collectorFormData.areaId || ''} onValueChange={(value) => 
                setCollectorFormData({...collectorFormData, areaId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Not assigned</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Collector'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Collector Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Collector
            </DialogTitle>
            <DialogDescription>
              Update collector details and information.
            </DialogDescription>
          </DialogHeader>
          {selectedCollector && (
            <form onSubmit={handleEditCollector} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username*</Label>
                <Input
                  id="username"
                  name="username"
                  value={collectorFormData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={collectorFormData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={collectorFormData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={collectorFormData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={collectorFormData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" value={collectorFormData.status} onValueChange={(value) => 
                    setCollectorFormData({...collectorFormData, status: value as 'active' | 'on-leave' | 'inactive'})
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the collector{selectedCollector && 
                <span className="font-semibold"> {getCollectorName(selectedCollector)}</span>}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCollector}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Change Collector Status
            </DialogTitle>
            <DialogDescription>
              Update status for {selectedCollector && 
                <span className="font-medium">{getCollectorName(selectedCollector)}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              onClick={() => handleStatusChange('active')}
              variant="outline"
              className={cn(
                selectedCollector?.status === 'active' && "border-green-500 bg-green-50 hover:bg-green-100"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <span className="font-medium">Active</span>
                <span className="text-xs text-center">Ready for assignments</span>
              </div>
            </Button>
            
            <Button
              onClick={() => handleStatusChange('on-leave')}
              variant="outline"
              className={cn(
                selectedCollector?.status === 'on-leave' && "border-amber-500 bg-amber-50 hover:bg-amber-100"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 text-amber-500" />
                <span className="font-medium">On Leave</span>
                <span className="text-xs text-center">Temporarily unavailable</span>
              </div>
            </Button>
            
            <Button
              onClick={() => handleStatusChange('inactive')}
              variant="outline"
              className={cn(
                selectedCollector?.status === 'inactive' && "border-red-500 bg-red-50 hover:bg-red-100"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <span className="font-medium">Inactive</span>
                <span className="text-xs text-center">Not available for work</span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Area Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedCollector?.area ? 'Reassign Area' : 'Assign Area'}
            </DialogTitle>
            <DialogDescription>
              {selectedCollector?.area 
                ? `Reassign ${getCollectorName(selectedCollector!)} from ${selectedCollector.area.name} to a different area`
                : `Assign ${selectedCollector ? getCollectorName(selectedCollector) : 'collector'} to a collection area`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignArea} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="areaId">Select Area</Label>
              <Select 
                defaultValue={selectedCollector?.area?._id || ""}
                onValueChange={(value) => {
                  const selectElement = document.getElementById('areaId') as HTMLInputElement;
                  selectElement.value = value;
                }}
              >
                <SelectTrigger id="areaId">
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Not assigned</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Area'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}