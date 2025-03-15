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
} from "@mui/material";

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

const Stats = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <Container>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Button variant="contained" onClick={fetchAnalytics} disabled={loading}>
        Refresh
      </Button>

      <Card sx={{ mt: 2 }}>
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
    </Container>
  );
};

export default Stats;