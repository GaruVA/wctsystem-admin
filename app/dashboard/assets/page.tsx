"use client"

import React, { useState, useEffect } from "react"
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Save, Plus, Trash2, Edit, Map, Info, RefreshCcw, Check, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import AreaBoundaryMap from "@/components/dashboard/area-boundary-map"
import SuggestionBinMap from "@/components/dashboard/suggestion-bin-map";
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// AreaStatusOverview import removed
import { getAllAreasWithBins, AreaWithBins } from "@/lib/api/areas";


// Interface definitions for AreasPage
interface Area {
  _id: string;
  name: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  startLocation: {
    type: string;
    coordinates: number[];
  };
  endLocation: {
    type: string;
    coordinates: number[];
  };
  binCount?: number;
  collectorCount?: number;
  fillRate?: number;
}

interface AreaFormData {
  name: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  startLocation: {
    coordinates: number[];
  };
  endLocation: {
    coordinates: number[];
  };
}

// Interface definitions for BinManagementPage
interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fillLevel: number;
  lastCollected: string;
  wasteType: string;
  address?: string;
  area?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'PENDING_INSTALLATION';
}

interface BinSuggestion {
  _id: string;
  reason: string;
  location: {
    longitude: number;
    latitude: number;
  };
  address?: string;
  createdAt: string;
}

// --- AreasPage Component (Modified) ---
export function AreasComponent() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const defaultGeometry = {
    type: "Polygon",
    coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0]]]
  };

  const [areaForm, setAreaForm] = useState<AreaFormData>({
    name: "",
    startLocation: {
      coordinates: [79.861, 6.927]
    },
    endLocation: {
      coordinates: [79.861, 6.927]
    }
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch areas');
      }

      const data = await response.json();

      const enhancedData = data.map((area: Area) => ({
        ...area,
        binCount: Math.floor(Math.random() * 50) + 5,
        collectorCount: Math.floor(Math.random() * 3) + 1,
        fillRate: Math.floor(Math.random() * 100)
      }));

      setAreas(enhancedData);
    } catch (error) {
      console.error('Error fetching areas:', error);
      toast({
        title: "Error",
        description: "Failed to load areas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateDialog = () => {
    setAreaForm({
      name: "",
      startLocation: {
        coordinates: [79.861, 6.927]
      },
      endLocation: {
        coordinates: [79.861, 6.927]
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (area: Area) => {
    setSelectedArea(area);
    setAreaForm({
      name: area.name,
      startLocation: {
        coordinates: [...area.startLocation.coordinates]
      },
      endLocation: {
        coordinates: [...area.endLocation.coordinates]
      },
      geometry: area.geometry
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (areaId: string) => {
    setAreaToDelete(areaId);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateArea = async () => {
    try {
      if (!areaForm.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Area name is required",
          variant: "destructive"
        });
        return;
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/areas/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: areaForm.name,
          geometry: areaForm.geometry,
          startLocation: {
            type: "Point",
            coordinates: areaForm.startLocation.coordinates
          },
          endLocation: {
            type: "Point",
            coordinates: areaForm.endLocation.coordinates
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create area');
      }

      toast({
        title: "Success",
        description: "Area created successfully"
      });

      setIsCreateDialogOpen(false);
      fetchAreas();
    } catch (error) {
      console.error('Error creating area:', error);
      toast({
        title: "Error",
        description: "Failed to create area",
        variant: "destructive"
      });
    }
  };

  const handleUpdateArea = async () => {
    if (!selectedArea) return;

    try {
      if (!areaForm.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Area name is required",
          variant: "destructive"
        });
        return;
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/areas/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          areaId: selectedArea._id,
          name: areaForm.name,
          geometry: areaForm.geometry || selectedArea.geometry,
          startLocation: {
            type: "Point",
            coordinates: areaForm.startLocation.coordinates
          },
          endLocation: {
            type: "Point",
            coordinates: areaForm.endLocation.coordinates
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update area');
      }

      toast({
        title: "Success",
        description: "Area updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchAreas();
    } catch (error) {
      console.error('Error updating area:', error);
      toast({
        title: "Error",
        description: "Failed to update area",
        variant: "destructive"
      });
    }
  };

  const handleDeleteArea = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = `http://localhost:5000/api/areas/${areaToDelete}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete area');
      }

      toast({
        title: "Success",
        description: "Area deleted successfully and resources unassigned"
      });

      setIsDeleteDialogOpen(false);
      fetchAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive"
      });
    }
  };

  const handleLocationChange = (
    locationType: 'startLocation' | 'endLocation',
    coordIndex: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setAreaForm(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        coordinates: prev[locationType].coordinates.map(
          (coord, idx) => idx === coordIndex ? numValue : coord
        )
      }
    }));
  };

  const formatCoordinates = (coords: number[]) => {
    return `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
  };

  const getFillLevelColor = (fillRate?: number) => {
    if (!fillRate) return "bg-gray-400";
    if (fillRate > 80) return "bg-red-500";
    if (fillRate > 60) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Areas</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Input
                placeholder="Search areas..."
                className="w-64 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleOpenCreateDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Area
            </Button>
          </div>
        </div>

        {/* Area Status Overview Removed */}
        {/* <AreaStatusOverview /> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                <span>Area List</span>
            </CardTitle>
              <CardDescription className="mt-1.5">Configure and manage waste collection areas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Start Location</TableHead>
                    <TableHead>End Location</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading areas...</TableCell>
                    </TableRow>
                  ) : filteredAreas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {searchTerm ? "No matching areas found" : "No areas found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAreas.map((area) => (
                      <TableRow key={area._id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>{formatCoordinates(area.startLocation.coordinates)}</TableCell>
                        <TableCell>{formatCoordinates(area.endLocation.coordinates)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(area)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(area._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Area Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add New Area</DialogTitle>
              <DialogDescription>
                Create a new collection area with start and end points.
                Draw the area boundary on the map below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="area-name">Area Name</Label>
                <Input
                  id="area-name"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({...areaForm, name: e.target.value})}
                  placeholder="e.g. Wellawatte South"
                />
              </div>

              <div className="grid gap-2 mt-2">
                <Label>Area Boundary</Label>
                <div className="border rounded-md p-1 bg-gray-50">
                  <AreaBoundaryMap
                    initialStartLocation={areaForm.startLocation.coordinates}
                    initialEndLocation={areaForm.endLocation.coordinates}
                    onBoundaryChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        geometry: {
                          type: "Polygon",
                          coordinates
                        }
                      }))
                    }
                    onStartLocationChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        startLocation: { coordinates }
                      }))
                    }
                    onEndLocationChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        endLocation: { coordinates }
                      }))
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the drawing tools to define the area boundary. Set start and end locations using the buttons.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateArea}>Create Area</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Area Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Area</DialogTitle>
              <DialogDescription>
                Update area details, boundary, and location points.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-area-name">Area Name</Label>
                <Input
                  id="edit-area-name"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({...areaForm, name: e.target.value})}
                />
              </div>

              <div className="grid gap-2 mt-2">
                <Label>Area Boundary and Locations</Label>
                <div className="border rounded-md p-1 bg-gray-50">
                  <AreaBoundaryMap
                    initialBoundary={areaForm.geometry?.coordinates}
                    initialStartLocation={areaForm.startLocation.coordinates}
                    initialEndLocation={areaForm.endLocation.coordinates}
                    onBoundaryChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        geometry: {
                          type: "Polygon",
                          coordinates
                        }
                      }))
                    }
                    onStartLocationChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        startLocation: { coordinates }
                      }))
                    }
                    onEndLocationChange={(coordinates) =>
                      setAreaForm(prev => ({
                        ...prev,
                        endLocation: { coordinates }
                      }))
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Edit the boundary by using the edit tools. Drag the start and end markers to reposition them.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateArea}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Area Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Delete Area</DialogTitle>
              <DialogDescription>
                This will permanently delete the area. All bins and collectors will be unassigned and will need to be reassigned later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteArea}>Delete Area</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}


// --- BinManagementPage Component (Original) ---

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

export function BinManagementComponent() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [binSuggestions, setBinSuggestions] = useState<BinSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [suggestionLoading, setSuggestionLoading] = useState<boolean>(true);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterWasteType, setFilterWasteType] = useState<string>("");
  const [filterFillLevel, setFilterFillLevel] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const itemsPerPage = 5;

  // State for CRUD operations
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [viewMapDialogOpen, setViewMapDialogOpen] = useState<boolean>(false);
  const [currentBin, setCurrentBin] = useState<Bin | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<BinSuggestion | null>(null);

  // Form states for new bin
  const [newBinWasteType, setNewBinWasteType] = useState<string>("GENERAL");
  const [newBinLatitude, setNewBinLatitude] = useState<string>("");
  const [newBinLongitude, setNewBinLongitude] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [newBinStatus, setNewBinStatus] = useState<string>("PENDING_INSTALLATION");

  // Form states for edit dialog
  const [editWasteType, setEditWasteType] = useState<string>("");
  const [editAreaId, setEditAreaId] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editLatitude, setEditLatitude] = useState<string>("");
  const [editLongitude, setEditLongitude] = useState<string>("");

  // Fetch all data on component mount
  useEffect(() => {
    fetchBins();
    fetchBinSuggestions();
    fetchAreas();
  }, []);

  // Fetch bins from API
  const fetchBins = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Bin[]>("http://localhost:5000/api/bins", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      setBins(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching bins:", error);
      setError("Failed to load bins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bin suggestions from API
  const fetchBinSuggestions = async () => {
    try {
      setSuggestionLoading(true);
      const response = await axios.get<BinSuggestion[]>("http://localhost:5000/api/bin-suggestions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      setBinSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching bin suggestions:", error);
      toast({
        title: "Error fetching suggestions",
        description: "Could not load bin suggestions",
        variant: "destructive"
      });
    } finally {
      setSuggestionLoading(false);
    }
  };

  // Fetch areas for bin assignment
  const fetchAreas = async () => {
    try {
      setAreasLoading(true);
      const areasData = await getAllAreasWithBins();
      setAreas(areasData);
    } catch (error) {
      console.error("Error fetching areas:", error);
    } finally {
      setAreasLoading(false);
    }
  };

  // Handle creating a new bin
  const handleCreateBin = async () => {
    if (!newBinLatitude || !newBinLongitude) {
      toast({
        title: "Location required",
        description: "Please enter both latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(newBinLatitude);
    const lng = parseFloat(newBinLongitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bins/create",
        {
          location: {
            type: "Point",
            coordinates: [lng, lat] // API expects [longitude, latitude]
          },
          wasteType: newBinWasteType,
          status: newBinStatus,
          area: selectedAreaId === "_none" ? undefined : selectedAreaId || undefined
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      toast({
        title: "Bin created",
        description: "The bin has been created successfully",
      });

      setNewBinLatitude("");
      setNewBinLongitude("");
      setNewBinWasteType("GENERAL");
      setNewBinStatus("PENDING_INSTALLATION");
      setSelectedAreaId("");
      setCreateDialogOpen(false);
      fetchBins();
    } catch (error) {
      console.error("Error creating bin:", error);
      toast({
        title: "Error",
        description: "Failed to create bin. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle approving a bin suggestion
  const handleApproveSuggestion = async (suggestion: BinSuggestion) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/bins/create",
        {
          location: {
            type: "Point",
            coordinates: [suggestion.location.longitude, suggestion.location.latitude]
          },
          wasteType: "GENERAL",
          status: "PENDING_INSTALLATION",
          notes: suggestion.reason,
          address: suggestion.address || undefined
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      await axios.delete(`http://localhost:5000/api/bin-suggestions/${suggestion._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      toast({
        title: "Suggestion approved",
        description: "A new bin has been created from the suggestion with Pending Installation status",
      });

      fetchBins();
      fetchBinSuggestions();
    } catch (error) {
      console.error("Error approving suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to approve suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle rejecting a bin suggestion
  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/bin-suggestions/${suggestionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      toast({
        title: "Suggestion rejected",
        description: "The bin suggestion has been removed",
      });

      fetchBinSuggestions();
    } catch (error) {
      console.error("Error rejecting suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to reject suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper functions for bin status
  const getFillLevelColor = (level: number) => {
    if (level >= 90) return "bg-red-500";
    if (level >= 70) return "bg-amber-500";
    if (level >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatBinStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBinStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'MAINTENANCE':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'INACTIVE':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'PENDING_INSTALLATION':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const handleViewSuggestionOnMap = (suggestion: BinSuggestion) => {
    setCurrentSuggestion(suggestion);
    setViewMapDialogOpen(true);
  };

  const openEditDialog = (bin: Bin) => {
    setCurrentBin(bin);
    setEditWasteType(bin.wasteType || "");
    setEditStatus(bin.status || "");
    setEditAreaId(bin.area || "");
    setEditLatitude(bin.location.coordinates[1].toString());
    setEditLongitude(bin.location.coordinates[0].toString());
    setEditDialogOpen(true);
  };

  const handleEditBin = async () => {
    if (!currentBin) return;

    if (editLatitude && editLongitude) {
      const lat = parseFloat(editLatitude);
      const lng = parseFloat(editLongitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        toast({
          title: "Invalid coordinates",
          description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const updates: any = {};

      if (editWasteType) {
        updates.wasteType = editWasteType;
      }

      if (editAreaId) {
        updates.area = editAreaId === "_none" ? null : editAreaId;
      }

      if (editStatus) {
        updates.status = editStatus;
      }

      if (editLatitude && editLongitude) {
        updates.location = {
          type: "Point",
          coordinates: [parseFloat(editLongitude), parseFloat(editLatitude)]
        };
      }

      await axios.post(
        `http://localhost:5000/api/bins/direct-update`,
        {
          binId: currentBin._id,
          updates: updates
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      toast({
        title: "Bin updated",
        description: "The bin has been updated successfully",
      });

      setEditLatitude("");
      setEditLongitude("");
      setEditWasteType("");
      setEditAreaId("");
      setEditStatus("");
      setEditDialogOpen(false);
      fetchBins();
    } catch (error) {
      console.error("Error updating bin:", error);
      toast({
        title: "Error",
        description: "Failed to update bin. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBin = async () => {
    if (!currentBin) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/bins/${currentBin._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      toast({
        title: "Bin deleted",
        description: "The bin has been permanently deleted from the database",
      });

      setDeleteDialogOpen(false);
      fetchBins();
    } catch (error) {
      console.error("Error deleting bin:", error);
      toast({
        title: "Error",
        description: "Failed to delete bin. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredBins = bins.filter((bin) => {
    const searchMatch = !searchTerm ||
      bin._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bin.address && bin.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const wasteTypeMatch = !filterWasteType || filterWasteType === "all_types" || bin.wasteType === filterWasteType;

    let fillLevelMatch = true;
    if (filterFillLevel === "high") {
      fillLevelMatch = bin.fillLevel >= 70;
    } else if (filterFillLevel === "medium") {
      fillLevelMatch = bin.fillLevel >= 30 && bin.fillLevel < 70;
    } else if (filterFillLevel === "low") {
      fillLevelMatch = bin.fillLevel < 30;
    }

    const statusMatch = !filterStatus || filterStatus === "all_statuses" || bin.status === filterStatus;

    return searchMatch && wasteTypeMatch && fillLevelMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredBins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBins = filteredBins.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWasteType, filterFillLevel, filterStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bins</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchBins();
              fetchBinSuggestions();
              fetchAreas();
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Bin
          </Button>
        </div>
      </div>

      {/* Bins List Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Bin List</CardTitle>
          <CardDescription>
            Manage all waste collection bins across different areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-2 text-sm text-muted-foreground">Loading bins...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : bins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No waste bins found. Create new bins using the "Add New Bin" button.</p>
            </div>
          ) : (
            <>
              {/* Filter controls */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search" className="mb-2 block text-sm">
                    Search
                  </Label>
                  <div className="relative">
                    <Input
                      id="search"
                      placeholder="Search by ID or address"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 absolute left-2.5 top-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="w-[200px]">
                  <Label htmlFor="waste-type-filter" className="mb-2 block text-sm">
                    Waste Type
                  </Label>
                  <Select
                    value={filterWasteType}
                    onValueChange={setFilterWasteType}
                  >
                    <SelectTrigger id="waste-type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_types">All Types</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ORGANIC">Organic</SelectItem>
                      <SelectItem value="RECYCLE">Recyclable</SelectItem>
                      <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-[200px]">
                  <Label htmlFor="status-filter" className="mb-2 block text-sm">
                    Status
                  </Label>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_statuses">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING_INSTALLATION">Pending Installation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-[200px]">
                  <Label htmlFor="fill-level-filter" className="mb-2 block text-sm">
                    Fill Level
                  </Label>
                  <Select
                    value={filterFillLevel}
                    onValueChange={setFilterFillLevel}
                  >
                    <SelectTrigger id="fill-level-filter">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_levels">All Levels</SelectItem>
                      <SelectItem value="high">High (≥70%)</SelectItem>
                      <SelectItem value="medium">Medium (30-69%)</SelectItem>
                      <SelectItem value="low">Low (&lt;30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results summary */}
              <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                <div>
                  Showing {paginatedBins.length} of {filteredBins.length} bins
                  {(filteredBins.length !== bins.length) && (
                    <span> (filtered from {bins.length} total)</span>
                  )}
                </div>
              </div>

              {/* Bins table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Fill Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBins.map((bin) => (
                      <TableRow key={bin._id}>
                        <TableCell className="font-medium">{bin._id}</TableCell>
                        <TableCell>
                          {bin.address || `${bin.location.coordinates[1].toFixed(6)}, ${bin.location.coordinates[0].toFixed(6)}`}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            if (!bin.area) return (
                              <Badge variant="outline" className="text-gray-500 bg-gray-100">Not assigned</Badge>
                            );
                            const areaName = areas.find(area => area.areaID === bin.area)?.areaName;
                            return (
                              <div className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                <span>{areaName || bin.area}</span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {bin.wasteType.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getFillLevelColor(bin.fillLevel)}`}></div>
                            <span>{bin.fillLevel}%</span>
                          </div>
                          <Progress value={bin.fillLevel} className="h-1 mt-1" />
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getBinStatusColor(bin.status || 'ACTIVE')}
                          >
                            {formatBinStatus(bin.status || 'ACTIVE')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(bin)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setCurrentBin(bin);
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M7.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L3.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-1">...</span>;
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 15.707a1 1 0 010-1.414L11.586 10 7.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M12.293 15.707a1 1 0 010-1.414L16.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bin Suggestions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map size={20} className="text-blue-500" />
            Bin Location Suggestions
          </CardTitle>
          <CardDescription>
            Suggested locations for new waste bins based on community feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestionLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading suggestions...</span>
            </div>
          ) : binSuggestions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No bin location suggestions available.</p>
            </div>
          ) : (
            <div>

              {/* Layout changed to flex with map taking 2/3 and list 1/3 */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Map showing all suggestion locations - now 2/3 width */}
                <div className="md:w-2/3 h-[400px] rounded-md overflow-hidden border">
                  <SuggestionBinMap
                    suggestionBins={binSuggestions.map(suggestion => ({
                      _id: suggestion._id,
                      location: {
                        type: "Point",
                        coordinates: [suggestion.location.longitude, suggestion.location.latitude]
                      },
                      fillLevel: 0,
                      wasteType: "GENERAL",
                      lastCollected: new Date().toISOString(),
                      address: suggestion.address || "",
                      reason: suggestion.reason
                    }))}
                    style={{ height: "100%" }}
                    selectedBin={currentSuggestion ? {
                      _id: currentSuggestion._id,
                      location: {
                        type: "Point",
                        coordinates: [currentSuggestion.location.longitude, currentSuggestion.location.latitude]
                      }
                    } as any : null}
                    onBinSelect={(bin) => {
                      if (bin) {
                        const suggestion = binSuggestions.find(s => s._id === bin._id);
                        setCurrentSuggestion(suggestion || null);
                      } else {
                        setCurrentSuggestion(null);
                      }
                    }}
                  />
                </div>

                {/* List of suggestions with improved layout - now 1/3 width */}
                <div className="md:w-1/3 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {binSuggestions.map((suggestion) => (
                    <div
                      key={suggestion._id}
                      className={`flex items-start gap-3 p-3 border rounded-md shadow-sm bg-white mb-2 hover:shadow-md transition-shadow cursor-pointer ${
                        currentSuggestion && currentSuggestion._id === suggestion._id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (currentSuggestion && currentSuggestion._id === suggestion._id) {
                          setCurrentSuggestion(null);
                        } else {
                          setCurrentSuggestion(suggestion);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500">
                        <Map size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-gray-800 truncate">
                          {suggestion.address || `Location: ${suggestion.location.latitude.toFixed(6)}, ${suggestion.location.longitude.toFixed(6)}`}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {suggestion.reason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Suggested:</strong> {formatRelativeTime(suggestion.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApproveSuggestion(suggestion)}
                          title="Approve suggestion"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectSuggestion(suggestion._id)}
                          title="Reject suggestion"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Bin Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bin</DialogTitle>
            <DialogDescription>
              Create a new waste collection bin by specifying its location and type.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="waste-type" className="text-right">
                Waste Type
              </Label>
              <Select
                value={newBinWasteType}
                onValueChange={setNewBinWasteType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ORGANIC">Organic</SelectItem>
                  <SelectItem value="RECYCLE">Recyclable</SelectItem>
                  <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newBinStatus}
                onValueChange={setNewBinStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING_INSTALLATION">Pending Installation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right">
                Area
              </Label>
              <Select
                value={selectedAreaId}
                onValueChange={setSelectedAreaId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Latitude</Label>
              <Input
                value={newBinLatitude}
                onChange={(e) => setNewBinLatitude(e.target.value)}
                placeholder="Enter latitude"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Longitude</Label>
              <Input
                value={newBinLongitude}
                onChange={(e) => setNewBinLongitude(e.target.value)}
                placeholder="Enter longitude"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBin}>Create Bin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Suggestion on Map Dialog */}
      <Dialog open={viewMapDialogOpen} onOpenChange={setViewMapDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Bin Suggestion Location</DialogTitle>
            <DialogDescription>
              {currentSuggestion?.address || "Viewing the suggested bin location on the map"}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[400px] border rounded-md overflow-hidden">
            {currentSuggestion && (
              <div className="h-full">
                <SuggestionBinMap
                  suggestionBins={[{
                    _id: currentSuggestion._id,
                    location: {
                      type: "Point",
                      coordinates: [currentSuggestion.location.longitude, currentSuggestion.location.latitude]
                    },
                    fillLevel: 0,
                    wasteType: "GENERAL",
                    lastCollected: new Date().toISOString(),
                    address: currentSuggestion.address || "",
                    reason: currentSuggestion.reason
                  }]}
                  style={{ height: "100%" }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMapDialogOpen(false)}>
              Close
            </Button>
            {currentSuggestion && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (currentSuggestion) {
                      handleApproveSuggestion(currentSuggestion);
                      setViewMapDialogOpen(false);
                    }
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (currentSuggestion) {
                      handleRejectSuggestion(currentSuggestion._id);
                      setViewMapDialogOpen(false);
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bin Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bin</DialogTitle>
            <DialogDescription>
              Update bin details such as waste type and area assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-waste-type" className="text-right">
                Waste Type
              </Label>
              <Select
                value={editWasteType}
                onValueChange={setEditWasteType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={currentBin?.wasteType || "Select waste type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ORGANIC">Organic</SelectItem>
                  <SelectItem value="RECYCLE">Recyclable</SelectItem>
                  <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select
                value={editStatus}
                onValueChange={setEditStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={currentBin?.status || "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING_INSTALLATION">Pending Installation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-area" className="text-right">
                Area
              </Label>
              <Select
                value={editAreaId}
                onValueChange={setEditAreaId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Latitude</Label>
              <Input
                value={editLatitude}
                onChange={(e) => setEditLatitude(e.target.value)}
                placeholder="Enter latitude"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Longitude</Label>
              <Input
                value={editLongitude}
                onChange={(e) => setEditLongitude(e.target.value)}
                placeholder="Enter longitude"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBin}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bin Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bin? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentBin && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md">
                <p className="text-sm font-medium">You are about to delete the following bin:</p>
                <p className="text-sm mt-1">
                  <strong>Location:</strong> {currentBin.address || `${currentBin.location.coordinates[1].toFixed(6)}, ${currentBin.location.coordinates[0].toFixed(6)}`}
                </p>
                <p className="text-sm">
                  <strong>Waste Type:</strong> {currentBin.wasteType}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBin}>
              Delete Bin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// --- Main Combined Page Component (Example Wrapper) ---
export default function AssetsPage() {
  return (
    <div>
      {/* You can structure this page however you like. 
          Maybe render AreasComponent first, then BinManagementComponent,
          or use Tabs, or a different layout. */}
      
      <section className="mb-8">
        <AreasComponent />
      </section>
      
      <hr className="my-8" />
      
      <section>
        <BinManagementComponent />
      </section>
    </div>
  );
}