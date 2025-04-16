"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Map, 
  Filter, 
  RefreshCcw,
  Check,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import BinMap from "@/components/dashboard/bin-map";
import { getAllAreasWithBins, AreaWithBins } from "@/lib/api/areas";

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

interface DrawMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (coordinates: [number, number]) => void;
  initialLocation?: [number, number];
}

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

// Map Dialog Component for selecting coordinates
const DrawMapDialog: React.FC<DrawMapDialogProps> = ({ 
  open, 
  onOpenChange, 
  onLocationSelect,
  initialLocation
}) => {
  // Stub location, would be replaced with actual Leaflet implementation in a full solution
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | undefined>(initialLocation);
  
  useEffect(() => {
    // Initialize leaflet map with drawing controls here
    // This is a simple placeholder
    console.log("Initialize map with drawing controls");
    // In a full implementation, you would:
    // 1. Initialize leaflet map
    // 2. Add drawing controls
    // 3. Set up event handlers for drawing events
  }, [open]);

  // Simulating selecting a location for simplicity
  // In a real implementation, this would come from the leaflet map
  const handleSimulateSelect = () => {
    // Dummy coordinates near Colombo, Sri Lanka
    const coords: [number, number] = [79.861243, 6.927079];
    setSelectedLocation(coords);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onOpenChange(false);
    } else {
      toast({
        title: "No location selected",
        description: "Please select a location on the map",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Select Bin Location</DialogTitle>
          <DialogDescription>
            Click on the map to select the bin location. You can zoom in and out for precision.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] border rounded-md bg-gray-100 flex items-center justify-center">
          {/* This would be replaced with an actual map */}
          <div className="text-center">
            <p className="mb-4">Map would be displayed here with drawing controls</p>
            <Button onClick={handleSimulateSelect} className="mb-2">
              Simulate Location Selection
            </Button>
            {selectedLocation && (
              <p className="text-sm">
                Selected: {selectedLocation[1].toFixed(6)}, {selectedLocation[0].toFixed(6)}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Bin Management Page Component
export default function BinManagementPage() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [binSuggestions, setBinSuggestions] = useState<BinSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [suggestionLoading, setSuggestionLoading] = useState<boolean>(true);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for CRUD operations
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [viewMapDialogOpen, setViewMapDialogOpen] = useState<boolean>(false);
  const [drawMapDialogOpen, setDrawMapDialogOpen] = useState<boolean>(false);
  const [currentBin, setCurrentBin] = useState<Bin | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<BinSuggestion | null>(null);
  
  // Form states
  const [newBinWasteType, setNewBinWasteType] = useState<string>("GENERAL");
  const [newBinLocation, setNewBinLocation] = useState<[number, number] | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  
  // For edit dialog
  const [editWasteType, setEditWasteType] = useState<string>("");
  const [editAreaId, setEditAreaId] = useState<string>("");

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
    if (!newBinLocation) {
      toast({
        title: "Location required",
        description: "Please select a location for the bin",
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
            coordinates: newBinLocation
          },
          wasteType: newBinWasteType,
          area: selectedAreaId || undefined
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

      // Reset form and refresh data
      setNewBinLocation(null);
      setNewBinWasteType("GENERAL");
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
      // Create a new bin using the suggestion coordinates
      const response = await axios.post(
        "http://localhost:5000/api/bins/create",
        {
          location: {
            type: "Point",
            coordinates: [suggestion.location.longitude, suggestion.location.latitude]
          },
          wasteType: "GENERAL", // Default waste type
          notes: suggestion.reason // Store the suggestion reason as notes
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      // Delete the suggestion after successful bin creation
      await axios.delete(`http://localhost:5000/api/bin-suggestions/${suggestion._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      toast({
        title: "Suggestion approved",
        description: "A new bin has been created from the suggestion",
      });

      // Refresh data
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

      // Refresh data
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

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Handle location selection from map
  const handleLocationSelect = (coordinates: [number, number]) => {
    setNewBinLocation(coordinates);
  };
  // Show suggestion on map dialog
  const handleViewSuggestionOnMap = (suggestion: BinSuggestion) => {
    setCurrentSuggestion(suggestion);
    setViewMapDialogOpen(true);
  };

  // Handle editing a bin
  const handleEditBin = async () => {
    if (!currentBin) return;

    try {
      const updates: any = {};
      
      if (editWasteType) {
        updates.wasteType = editWasteType;
      }
      
      if (editAreaId) {
        updates.area = editAreaId;
      }
      
      await axios.post(
        `http://localhost:5000/api/bins/update`,
        {
          binId: currentBin._id,
          ...updates
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

  // Handle deleting a bin
  const handleDeleteBin = async () => {
    if (!currentBin) return;

    try {
      // This is a placeholder - your actual API might use a different endpoint
      await axios.delete(`http://localhost:5000/api/bins/${currentBin._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      toast({
        title: "Bin deleted",
        description: "The bin has been deleted successfully",
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bins</h1>
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
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Bin
          </Button>
        </div>
      </div>

      {/* Bins List Section */}
      <Card className="mb-8">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Waste Type</TableHead>
                    <TableHead>Fill Level</TableHead>
                    <TableHead>Last Collected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bins.map((bin) => (
                    <TableRow key={bin._id}>
                      <TableCell className="font-medium">{bin._id}</TableCell>
                      <TableCell>
                        {bin.address || `${bin.location.coordinates[1].toFixed(6)}, ${bin.location.coordinates[0].toFixed(6)}`}
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
                      <TableCell>{formatDate(bin.lastCollected)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setCurrentBin(bin);
                            setEditDialogOpen(true);
                          }}>
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
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {binSuggestions.map((suggestion) => (
                <div
                  key={suggestion._id}
                  className="flex items-start gap-4 p-4 border rounded-md shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-500">
                    <Map size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-800">
                      {suggestion.address ? (
                        <>{suggestion.address}</>
                      ) : (
                        <>Location: {suggestion.location.latitude.toFixed(6)}, {suggestion.location.longitude.toFixed(6)}</>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Coordinates:</strong> {suggestion.location.latitude.toFixed(4)}, {suggestion.location.longitude.toFixed(4)} |{" "}
                      <strong>Suggested:</strong>{" "}
                      {formatRelativeTime(suggestion.createdAt)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleViewSuggestionOnMap(suggestion)}
                      >
                        View on Map
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveSuggestion(suggestion)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-7 text-xs"
                        onClick={() => handleRejectSuggestion(suggestion._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
              <Label htmlFor="area" className="text-right">
                Area
              </Label>              <Select
                value={selectedAreaId}
                onValueChange={setSelectedAreaId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Location</Label>
              <div className="col-span-3 flex items-center gap-2">
                {newBinLocation ? (
                  <div className="text-sm">
                    Lat: {newBinLocation[1].toFixed(6)}, Lng: {newBinLocation[0].toFixed(6)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No location selected</div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDrawMapDialogOpen(true)}
                >
                  Select on Map
                </Button>
              </div>
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

      {/* Map Dialog for Drawing/Selecting Location */}
      <DrawMapDialog 
        open={drawMapDialogOpen}
        onOpenChange={setDrawMapDialogOpen}
        onLocationSelect={handleLocationSelect}
      />

      {/* View Suggestion on Map Dialog */}
      <Dialog open={viewMapDialogOpen} onOpenChange={setViewMapDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Bin Suggestion Location</DialogTitle>
            <DialogDescription>
              {currentSuggestion?.address || "Viewing the suggested bin location on the map"}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[400px] border rounded-md">
            {currentSuggestion && (
              <div className="h-full">
                {/* This would be replaced with an actual BinMap component */}
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <p className="mb-2">Map would display here showing:</p>
                    <p className="font-medium">
                      Location: {currentSuggestion.location.latitude.toFixed(6)}, {currentSuggestion.location.longitude.toFixed(6)}
                    </p>
                    <p className="text-sm mt-2">{currentSuggestion.reason}</p>
                  </div>
                </div>
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
        </DialogContent>      </Dialog>

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
              <Label htmlFor="edit-area" className="text-right">
                Area
              </Label>              <Select
                value={editAreaId}
                onValueChange={setEditAreaId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
