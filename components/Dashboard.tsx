"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Button,
  Grid,
  Box,
} from "@mui/material";
import MapDisplay from "./MapDisplay";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your actual backend URL
});

interface AnalyticsData {
  [areaId: string]: {
    utilization: number;
    collectionEfficiency: number;
    serviceDelay: number;
    bins: number;
  };
}

// Define Bin interface to match the MongoDB structure
interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fillLevel: number;
  lastCollected: string;
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  
  // Hardcoded bins data based on provided MongoDB structure
  const mockBins: Bin[] = [
    {
      _id: "67cbf9384d042a183ab3e095",
      location: {
        type: "Point",
        coordinates: [-73.9568, 40.7789] // Central Park NYC area
      },
      fillLevel: 60,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e096",
      location: {
        type: "Point",
        coordinates: [-73.9708, 40.7648] // Times Square NYC area
      },
      fillLevel: 85,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e097",
      location: {
        type: "Point",
        coordinates: [-73.9632, 40.7831] // Upper East Side NYC area
      },
      fillLevel: 45,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e098",
      location: {
        type: "Point",
        coordinates: [-73.9932, 40.7362] // Chelsea NYC area
      },
      fillLevel: 95,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e099",
      location: {
        type: "Point",
        coordinates: [-74.0099, 40.7047] // Financial District NYC area
      },
      fillLevel: 72,
      lastCollected: new Date().toISOString()
    }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get("/analytics/analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Replace with your actual token
        },
      });
      setAnalytics(response.data as AnalyticsData);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleBinSelect = (bin: Bin) => {
    setSelectedBin(bin);
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Button variant="contained" onClick={fetchAnalytics} disabled={loading} sx={{ mb: 2 }}>
        Refresh
      </Button>

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Bins Map" />
            <CardContent>
              <MapDisplay 
                bins={mockBins} 
                onBinSelect={handleBinSelect}
                selectedBin={selectedBin}
              />
              {selectedBin && (
                <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                  <Typography variant="h6">Selected Bin Details</Typography>
                  <Typography>ID: {selectedBin._id}</Typography>
                  <Typography>Fill Level: {selectedBin.fillLevel}%</Typography>
                  <Typography>
                    Location: {selectedBin.location.coordinates[1]}, {selectedBin.location.coordinates[0]}
                  </Typography>
                  <Typography>
                    Last Collected: {new Date(selectedBin.lastCollected).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Section */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Analytics Data" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Area ID</TableCell>
                      <TableCell>Utilization</TableCell>
                      <TableCell>Collection Efficiency</TableCell>
                      <TableCell>Service Delay</TableCell>
                      <TableCell>Number of Bins</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(analytics).map((areaId) => (
                      <TableRow key={areaId}>
                        <TableCell>{areaId}</TableCell>
                        <TableCell>{analytics[areaId].utilization}</TableCell>
                        <TableCell>{analytics[areaId].collectionEfficiency}</TableCell>
                        <TableCell>{analytics[areaId].serviceDelay}</TableCell>
                        <TableCell>{analytics[areaId].bins}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}