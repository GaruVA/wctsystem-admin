"use client"

import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MapPin, Save, Upload, Plus, Trash2, Edit, MapPinned, Map, Trash, AlertCircle, Check, X, Info, ArrowDownToLine } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import AreaBoundaryMap from "@/components/dashboard/area-boundary-map"

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

export default function SettingsPage() {
  const [showSecrets, setShowSecrets] = useState({
    mongodb: false,
    jwt: false,
    ors: false
  });
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  
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

  // Area to reassign bins and collectors to when deleting an area
  const [areaToDelete, setAreaToDelete] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      setAreas(data);
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
        // No body is needed now, as we always unassign
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

  return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="collection">Area Configuration</TabsTrigger>
            <TabsTrigger value="alerts">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure your waste collection system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input id="system-name" defaultValue="WCT Waste Collection System" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@wctsystem.com" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <Switch id="notifications" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="collection" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Area Configuration</CardTitle>
                  <CardDescription className="mt-1.5">Configure collection areas</CardDescription>
                </div>
                <Button onClick={handleOpenCreateDialog} className="ml-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Area
                </Button>
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
                          <TableCell colSpan={4} className="text-center">Loading areas...</TableCell>
                        </TableRow>
                      ) : areas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No areas found</TableCell>
                        </TableRow>
                      ) : (
                        areas.map((area) => (
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
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure bin fill level thresholds and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Critical Fill Level Threshold</Label>
                    <span className="text-sm">85%</span>
                  </div>
                  <Slider defaultValue={[85]} max={100} step={5} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Warning Fill Level Threshold</Label>
                    <span className="text-sm">70%</span>
                  </div>
                  <Slider defaultValue={[70]} max={100} step={5} />
                </div>
                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <Switch id="email-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="sms-alerts">SMS Alerts</Label>
                  <Switch id="sms-alerts" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Alert Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Configure API keys and database connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mongodb-uri">MongoDB URI</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, mongodb: !showSecrets.mongodb})}
                    >
                      {showSecrets.mongodb ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="mongodb-uri" 
                    type={showSecrets.mongodb ? "text" : "password"}
                    defaultValue="mongodb+srv://garukaassalaarachchi:RJL8J7ZEnsNzycnt@db.fbree.mongodb.net/wctsystem?retryWrites=true&w=majority&appName=DB" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="jwt-secret">JWT Secret</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, jwt: !showSecrets.jwt})}
                    >
                      {showSecrets.jwt ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="jwt-secret" 
                    type={showSecrets.jwt ? "text" : "password"}
                    defaultValue="H9igabBAKjzwJoXzepsNHfXo4DAOEvXzSPa-jLq9YUc" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ors-api-key">OpenRouteService API Key</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, ors: !showSecrets.ors})}
                    >
                      {showSecrets.ors ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="ors-api-key" 
                    type={showSecrets.ors ? "text" : "password"}
                    defaultValue="5b3ce3597851110001cf62489d3650ef4f0f47a9b852b45571dc18ed" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backend-port">Backend Port</Label>
                  <Input id="backend-port" type="number" defaultValue="5000" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These API keys and secrets should be kept confidential. 
                  Only authorized personnel should have access to this page.
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save API Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

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

        {/* Delete Area Dialog - Simplified */}
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