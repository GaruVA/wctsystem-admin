"use client";

import React, { useEffect, useState } from "react";
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
  DialogFooter
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
  RefreshCcw,
  Check,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import SuggestionBinMap from "@/components/dashboard/suggestion-bin-map";
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

// Main Bin Management Page Component
export default function BinManagementPage() {
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
    // Validate latitude and longitude
    if (!newBinLatitude || !newBinLongitude) {
      toast({
        title: "Location required",
        description: "Please enter both latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    // Parse coordinates and validate
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

      // Reset form and refresh data
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
      // Create a new bin using the suggestion coordinates
      const response = await axios.post(
        "http://localhost:5000/api/bins/create",
        {
          location: {
            type: "Point",
            coordinates: [suggestion.location.longitude, suggestion.location.latitude]
          },
          wasteType: "GENERAL", // Default waste type
          status: "PENDING_INSTALLATION", // Set default status to pending installation
          notes: suggestion.reason, // Store the suggestion reason as notes
          address: suggestion.address || undefined // Use address if available
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
        description: "A new bin has been created from the suggestion with Pending Installation status",
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

  // Format bin status for display
  const formatBinStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Get color for bin status badge
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

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Show suggestion on map dialog
  const handleViewSuggestionOnMap = (suggestion: BinSuggestion) => {
    setCurrentSuggestion(suggestion);
    setViewMapDialogOpen(true);
  };

  // Set up edit dialog with current bin values
  const openEditDialog = (bin: Bin) => {
    setCurrentBin(bin);
    // Initialize edit form with current values
    setEditWasteType(bin.wasteType || "");
    setEditStatus(bin.status || "");
    setEditAreaId(bin.area || "");
    setEditLatitude(bin.location.coordinates[1].toString());
    setEditLongitude(bin.location.coordinates[0].toString());
    setEditDialogOpen(true);
  };

  // Handle editing a bin
  const handleEditBin = async () => {
    if (!currentBin) return;

    // Validate latitude and longitude if they've been modified
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
      
      // Add location update if coordinates were edited
      if (editLatitude && editLongitude) {
        updates.location = {
          type: "Point",
          coordinates: [parseFloat(editLongitude), parseFloat(editLatitude)]
        };
      }
      
      // Use direct-update endpoint which expects the binId in the request body
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

      // Reset edit state
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

  // Handle deleting a bin
  const handleDeleteBin = async () => {
    if (!currentBin) return;

    try {
      // Delete the bin directly from the database using DELETE method
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

  // Handle filtering and pagination
  const filteredBins = bins.filter((bin) => {
    // Filter by search term (check ID and address)
    const searchMatch = !searchTerm || 
      bin._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bin.address && bin.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by waste type
    const wasteTypeMatch = !filterWasteType || filterWasteType === "all_types" || bin.wasteType === filterWasteType;
    
    // Filter by fill level
    let fillLevelMatch = true;
    if (filterFillLevel === "high") {
      fillLevelMatch = bin.fillLevel >= 70;
    } else if (filterFillLevel === "medium") {
      fillLevelMatch = bin.fillLevel >= 30 && bin.fillLevel < 70;
    } else if (filterFillLevel === "low") {
      fillLevelMatch = bin.fillLevel < 30;
    }
    // "all_levels" will keep fillLevelMatch as true
    
    // Filter by status
    const statusMatch = !filterStatus || filterStatus === "all_statuses" || bin.status === filterStatus;

    return searchMatch && wasteTypeMatch && fillLevelMatch && statusMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBins = filteredBins.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterWasteType, filterFillLevel, filterStatus]);

  // Handle page change
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
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Fill Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Collected</TableHead>
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
                        <TableCell>{formatDate(bin.lastCollected)}</TableCell>
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
                      // Show only a window of pages around the current page
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
