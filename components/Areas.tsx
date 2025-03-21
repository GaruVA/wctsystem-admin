"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { Card, CardHeader, CardContent, Container, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Snackbar, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype.options.iconUrl;
delete L.Icon.Default.prototype.options.iconRetinaUrl;
delete L.Icon.Default.prototype.options.shadowUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your actual backend URL
});

interface Area {
  _id: string;
  name: string;
  coordinates: number[][];
  dump: string;
}

const Areas = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [dumpId, setDumpId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null); // Ref to track the map instance

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/areas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setAreas(response.data as Area[]);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch areas");
    } finally {
      setLoading(false);
    }
  };

  // Initialize the map only once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [37.7749, -122.4194],
        zoom: 10,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    // Cleanup the map instance when the component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and polygons when areas change
  useEffect(() => {
    if (mapRef.current) {
      // Clear existing layers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polygon) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add new markers and polygons
      areas.forEach((area) => {
        area.coordinates.forEach((coord, index) => {
          const position: [number, number] = [coord[0], coord[1]];
          L.marker(position, { icon: L.icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png' }) })
            .addTo(mapRef.current!)
            .bindPopup(`<strong>${area.name}</strong><br />Dump ID: ${area.dump}`);
        });

        L.polygon(area.coordinates as L.LatLngTuple[], { color: 'blue' })
          .addTo(mapRef.current!)
          .bindPopup(`<strong>${area.name}</strong><br />Dump ID: ${area.dump}`);
      });
    }
  }, [areas]);

  const validateForm = () => {
    if (!name || !coordinates || !dumpId) {
      setError("All fields are required");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setName("");
    setCoordinates("");
    setDumpId("");
  };

  const handleAddArea = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const parsedCoordinates = JSON.parse(coordinates);
      if (!Array.isArray(parsedCoordinates) || !parsedCoordinates.every(coord => Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite))) {
        setError("Coordinates must be a JSON array of arrays of numbers");
        return;
      }

      const response = await api.post(
        "/areas/add",
        { name, coordinates: parsedCoordinates, dumpId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setAreas([...areas, response.data as Area]);
      resetForm();
      setError(null);
    } catch (err: any) {
      setError("Failed to add area");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArea = async () => {
    if (!validateForm() || !currentAreaId) return;

    setLoading(true);
    try {
      const parsedCoordinates = JSON.parse(coordinates);
      if (!Array.isArray(parsedCoordinates) || !parsedCoordinates.every(coord => Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite))) {
        setError("Coordinates must be a JSON array of arrays of numbers");
        return;
      }

      const response = await api.put(
        "/areas/update",
        { areaId: currentAreaId, name, coordinates: parsedCoordinates, dumpId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setAreas(areas.map((area) => (area._id === currentAreaId ? response.data as Area : area)));
      resetForm();
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError("Failed to update area");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveArea = async (areaId: string) => {
    setLoading(true);
    try {
      await api.delete(`/areas/${areaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setAreas(areas.filter((area) => area._id !== areaId));
      setError(null);
    } catch (err: any) {
      setError("Failed to remove area");
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  const startEditing = (area: Area) => {
    setName(area.name);
    setCoordinates(JSON.stringify(area.coordinates));
    setDumpId(area.dump);
    setCurrentAreaId(area._id);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetForm();
    setIsEditing(false);
  };

  const confirmDelete = (areaId: string) => {
    setAreaToDelete(areaId);
    setOpenDeleteDialog(true);
  };

  const formatCoordinates = (coords: number[][]) => {
    if (coords.length <= 2) {
      return JSON.stringify(coords);
    }
    return `[${coords[0]}, ... ${coords.length - 2} more points, ${coords[coords.length - 1]}]`;
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Area Management
      </Typography>
      <Button variant="contained" onClick={fetchAreas} disabled={loading}>
        Refresh
      </Button>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}

      <Card sx={{ mt: 2 }}>
        <CardHeader title={isEditing ? "Update Area" : "Add New Area"} />
        <CardContent>
          <TextField
            fullWidth
            label="Area Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Dump ID"
            value={dumpId}
            onChange={(e) => setDumpId(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Coordinates (JSON array)"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            placeholder='[[37.7749, -122.4194], [34.0522, -118.2437], [40.7128, -74.0060], [51.5074, -0.1278], [48.8566, 2.3522]]'
          />
          <Button
            variant="contained"
            onClick={isEditing ? handleUpdateArea : handleAddArea}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : isEditing ? "Update Area" : "Add Area"}
          </Button>
          {isEditing && (
            <Button variant="outlined" onClick={cancelEditing} sx={{ mt: 2, ml: 2 }}>
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardHeader title="Existing Areas" />
        <CardContent>
          {areas.length === 0 ? (
            <Typography>No areas found. Add your first area above.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Coordinates</TableCell>
                    <TableCell>Dump ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areas.map((area) => (
                    <TableRow key={area._id}>
                      <TableCell>{area.name}</TableCell>
                      <TableCell title={JSON.stringify(area.coordinates)}>
                        {formatCoordinates(area.coordinates)}
                      </TableCell>
                      <TableCell>{area.dump}</TableCell>
                      <TableCell>
                        <Button onClick={() => startEditing(area)}>Edit</Button>
                        <Button onClick={() => confirmDelete(area._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Area</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this area? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={() => handleRemoveArea(areaToDelete!)} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Card sx={{ mt: 2 }}>
        <CardHeader title="Map View" />
        <CardContent>
          <div id="map" style={{ height: "500px", width: "100%" }}></div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Areas;