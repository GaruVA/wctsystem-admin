"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Save, Plus, Trash2, Edit, Map, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import AreaBoundaryMap from "@/components/dashboard/area-boundary-map"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AreaStatusOverview } from "@/components/dashboard/area-status-overview";

// Interface definitions
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

export default function AreasPage() {
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
  
  // Form state for creating/editing an area
  const [areaForm, setAreaForm] = useState<AreaFormData>({
    name: "",
    startLocation: {
      coordinates: [79.861, 6.927]
    },
    endLocation: {
      coordinates: [79.861, 6.927]
    }
  });

  // Fetch all areas on component mount
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

      // Simulate additional area statistics that would come from the backend
      // In a real implementation, these would be provided by the API
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
      // Validate form data
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
      // Validate form data
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

  // Helper function to get fill level color
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

        {/* Area Status Overview */}
        <AreaStatusOverview />

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