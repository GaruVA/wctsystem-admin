"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, BarChart3, Download, PieChart, RefreshCw } from "lucide-react"
// Import directly from react-chartjs-2
import { Bar, Line, Pie } from "react-chartjs-2"
// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Update FillLevelTrends type to match the new backend response
interface FillLevelTrends {
  area: string;
  trends: { date: string; averageFillLevel: number }[];
}

interface Analytics {
  [areaName: string]: {
    utilization: number
    collectionEfficiency: number
    serviceDelay: number
    bins: number
    wasteTypeDistribution: Record<string, number>
  }
}

interface WasteTypeAnalytics {
  [wasteType: string]: {
    count: number
    averageFillLevel: number
    needsCollection: number
  }
}

interface AreaStatusOverview {
  name: string
  criticalBins: number
  scheduledCollections: number
  averageFillLevel: number
  status: "critical" | "warning" | "normal"
}

interface CollectionEfficiencyData {
  areaName: string
  collectionEfficiency: number
  binUtilization: number
}

// Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api", // Replace with your actual backend URL
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken") // Retrieve the token from localStorage
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default function AdminReportsView() {
  const [fillLevelTrends, setFillLevelTrends] = useState<Record<string, { date: string; averageFillLevel: number }[]>>({})
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [wasteTypeAnalytics, setWasteTypeAnalytics] = useState<WasteTypeAnalytics>({})
  const [areaStatusOverview, setAreaStatusOverview] = useState<AreaStatusOverview[]>([])
  const [collectionEfficiencyData, setCollectionEfficiencyData] = useState<CollectionEfficiencyData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("week")
  const [activeTab, setActiveTab] = useState("overview")
  const [aiInsights, setAIInsights] = useState<string | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports()
  }, [timeRange])

  // Update fetchReports to handle the new structure
  const fetchReports = async () => {
    setLoading(true);
    try {
      const [
        fillLevelTrendsResponse,
        analyticsResponse,
        wasteTypeAnalyticsResponse,
        areaStatusOverviewResponse,
        collectionEfficiencyResponse,
      ] = await Promise.all([
        api.get<FillLevelTrends[]>(`/analytics/fill-level-trends?timeRange=${timeRange}`),
        api.get<Analytics>(`/analytics/analytics?timeRange=${timeRange}`),
        api.get<WasteTypeAnalytics>(`/analytics/waste-type?timeRange=${timeRange}`),
        api.get<AreaStatusOverview[]>(`/analytics/area-status?timeRange=${timeRange}`),
        api.get<CollectionEfficiencyData[]>(`/analytics/collection-efficiency-bin-utilization?timeRange=${timeRange}`),
      ]);

      // Transform fillLevelTrends to match the frontend's needs
      const transformedTrends = fillLevelTrendsResponse.data.reduce((acc, trend) => {
        acc[trend.area] = trend.trends.map(({ date, averageFillLevel }) => ({
          date,
          averageFillLevel,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return acc;
      }, {} as Record<string, { date: string; averageFillLevel: number }[]>);

      setFillLevelTrends(transformedTrends);
      setAnalytics(analyticsResponse.data);
      setWasteTypeAnalytics(wasteTypeAnalyticsResponse.data);
      setAreaStatusOverview(areaStatusOverviewResponse.data);
      setCollectionEfficiencyData(collectionEfficiencyResponse.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Function to fetch AI insights
  const fetchAIInsights = async () => {
    setAILoading(true);
    setAIError(null);
    try {
      const requestData = {
        fillLevelTrends,
        analytics,
        wasteTypeAnalytics,
        areaStatusOverview,
        collectionEfficiencyData,
      };
      console.log("Request Data for AI Insights:", requestData); // Debugging

      const response = await api.post<{ insights: string }>("/ai/insights", requestData);
      setAIInsights(response.data.insights);
    } catch (err: any) {
      console.error("Error fetching AI insights:", err);
      setAIError("Failed to fetch AI insights. Please try again.");
    } finally {
      setAILoading(false);
    }
  };

  const exportReports = async () => {
    const doc = new jsPDF();

    // Add a title
    doc.setFontSize(16);
    doc.text("Admin Reports", 105, 10, { align: "center" }); // Center the title

    // Add AI Insights
    doc.setFontSize(14);
    doc.text("AI Insights:", 105, 20, { align: "center" }); // Center the AI Insights header

    if (aiInsights) {
      // Parse the JSON insights into a readable format
      const insights = aiInsights
        .split(/\d+\.\s+/) // Split insights by numbered points
        .filter((insight) => insight.trim() !== ""); // Remove empty lines

      let yOffset = 30; // Start position for the insights
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10; // Left and right margin
      const maxWidth = pageWidth - margin * 2; // Maximum width for text

      insights.forEach((insight, index) => {
        // Wrap the text to fit within the page width
        const wrappedText: string[] = doc.splitTextToSize(`${index + 1}. ${insight.trim()}`, maxWidth);

        // Check if the text fits on the current page, otherwise add a new page
        if (yOffset + wrappedText.length * 10 > 280) {
          doc.addPage();
          yOffset = 20; // Reset yOffset for the new page
        }

        // Add the wrapped text to the PDF
        wrappedText.forEach((line) => {
          doc.text(line, margin, yOffset);
          yOffset += 10; // Add spacing between lines
        });
      });
    } else {
      doc.text("No AI insights available.", 105, 30, { align: "center" }); // Center the fallback text
    }

    // Add a page for charts
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Charts:", 105, 10, { align: "center" }); // Center the Charts header

    // Capture all unique charts as images
    const chartContainers = document.querySelectorAll(".chart-container");
    const processedCharts = new Set(); // Track processed chart containers
    let yOffset = 20;

    for (const chartContainer of chartContainers) {
      const chartId = chartContainer.getAttribute("data-chart-id"); // Use a unique identifier for each chart
      if (!chartId || processedCharts.has(chartId)) {
        continue; // Skip if the chart has already been processed
      }

      processedCharts.add(chartId); // Mark the chart as processed

      const canvas = await html2canvas(chartContainer as HTMLElement);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 180; // Adjust width as needed
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (yOffset + imgHeight > 280) {
        // Add a new page if the image doesn't fit
        doc.addPage();
        yOffset = 20;
      }

      doc.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10; // Add spacing between charts
    }

    // Save the PDF
    doc.save("Admin_Reports.pdf");
  };

  // Prepare data for charts
  const fillLevelTrendsData = {
    labels: Object.keys(fillLevelTrends).length > 0
      ? Object.values(fillLevelTrends)[0].map((trend) =>
          new Date(trend.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        )
      : [],
    datasets: Object.keys(fillLevelTrends).map((areaName, index) => ({
      label: areaName,
      data: fillLevelTrends[areaName].map((trend) => trend.averageFillLevel),
      borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4],
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4],
      tension: 0.3,
    })),
  };

  const wasteTypeAnalyticsData = {
    labels: Object.keys(wasteTypeAnalytics),
    datasets: [
      {
        label: "Bins Needing Collection",
        data: Object.values(wasteTypeAnalytics).map((data) => data.needsCollection),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
      },
    ],
  }

  const areaStatusData = {
    labels: areaStatusOverview.map((area) => area.name),
    datasets: [
      {
        label: "Critical Bins",
        data: areaStatusOverview.map((area) => area.criticalBins),
        backgroundColor: "#ef4444",
      },
      {
        label: "Scheduled Collections",
        data: areaStatusOverview.map((area) => area.scheduledCollections),
        backgroundColor: "#3b82f6",
      },
    ],
  }

  const collectionEfficiencyChartData = {
    labels: collectionEfficiencyData.map((data) => data.areaName),
    datasets: [
      {
        label: "Collection Efficiency (%)",
        data: collectionEfficiencyData.map((data) => data.collectionEfficiency),
        backgroundColor: "#3b82f6",
      },
    ],
  }

  const binUtilizationChartData = {
    labels: collectionEfficiencyData.map((data) => data.areaName),
    datasets: [
      {
        data: collectionEfficiencyData.map((data) => data.binUtilization),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 1,
      },
    ],
  }

  console.log("fillLevelTrends:", fillLevelTrends);
  console.log("Object.keys(fillLevelTrends):", Object.keys(fillLevelTrends));
  console.log("fillLevelTrends[Object.keys(fillLevelTrends)[0]]:", fillLevelTrends[Object.keys(fillLevelTrends)[0]]);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and reports for waste management operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
          <Button size="sm" onClick={exportReports}>
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button onClick={fetchAIInsights} disabled={aiLoading} size="sm">
            {aiLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Fetching AI Insights...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate AI Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-3">Loading reports data...</span>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="areas">Area Analysis</TabsTrigger>
          <TabsTrigger value="waste">Waste Types</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Fill Level Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AreaChart className="h-5 w-5" />
                <span>Fill Level Trends</span>
              </CardTitle>
              <CardDescription>Trends of bin fill levels over time, grouped by area</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center chart-container" data-chart-id={`fill-level-trends`}>
              {Object.keys(fillLevelTrends).length > 0 ? (
                <div className="chart-container h-[300px] w-full">
                  <Line data={fillLevelTrendsData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: "Fill Level (%)",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Day",
                        },
                      },
                    },
                  }} />
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Area Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>Area Status Overview</span>
              </CardTitle>
              <CardDescription>Overview of critical bins and scheduled collections by area</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center chart-container" data-chart-id="area-status-overview">
              {areaStatusOverview.length > 0 ? (
                <Bar
                  data={areaStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Count",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Collection Efficiency and Bin Utilization */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Collection Efficiency</span>
                </CardTitle>
                <CardDescription>Average efficiency by area for the current {timeRange}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center chart-container" data-chart-id="collection-efficiency">
                {collectionEfficiencyData.length > 0 ? (
                  <div className="chart-container h-[300px] w-full">
                    <Bar data={collectionEfficiencyChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: "Efficiency (%)",
                          },
                        },
                      },
                    }} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Bin Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  <span>Bin Utilization</span>
                </CardTitle>
                <CardDescription>Distribution of bin fill levels across areas</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center chart-container" data-chart-id="bin-utilization">
                {collectionEfficiencyData.length > 0 ? (
                  <div className="chart-container h-[300px] w-full">
                    <Pie data={binUtilizationChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`,
                          },
                        },
                      },
                    }} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          {/* Waste Type Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>Area Performance Analysis</span>
              </CardTitle>
              <CardDescription>Detailed performance metrics for each collection area</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {Object.entries(analytics).map(([areaName, data]) => (
                    <Card key={areaName} className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{areaName}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Utilization:</span>
                          <span className="font-medium">{data.utilization}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collection Efficiency:</span>
                          <span className="font-medium">{data.collectionEfficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Delay:</span>
                          <span className="font-medium">{data.serviceDelay} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Bins:</span>
                          <span className="font-medium">{data.bins}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          {/* Waste Type Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                <span>Waste Type Analytics</span>
              </CardTitle>
              <CardDescription>Distribution of bins needing collection by waste type</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center chart-container" data-chart-id="waste-type-analytics">
              <Bar data={wasteTypeAnalyticsData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Number of Bins",
                    },
                  },
                },
              }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waste Type Details</CardTitle>
              <CardDescription>Detailed metrics for each waste type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Waste Type</th>
                      <th className="text-left py-2 px-4">Total Bins</th>
                      <th className="text-left py-2 px-4">Average Fill Level</th>
                      <th className="text-left py-2 px-4">Bins Needing Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(wasteTypeAnalytics).map(([wasteType, data]) => (
                      <tr key={wasteType} className="border-b">
                        <td className="py-2 px-4">{wasteType}</td>
                        <td className="py-2 px-4">{data.count}</td>
                        <td className="py-2 px-4">{data.averageFillLevel}%</td>
                        <td className="py-2 px-4">{data.needsCollection}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Efficiency Metrics</CardTitle>
              <CardDescription>Detailed efficiency and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex flex-col items-center justify-center space-y-6">
              {/* Collection Efficiency Chart */}
              <div className="w-full chart-container">
                <Bar
                  data={collectionEfficiencyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: "Efficiency (%)",
                        },
                      },
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: "Collection Efficiency by Area",
                      },
                    },
                  }}
                />
              </div>

              {/* Bin Utilization Chart */}
              <div className="w-full chart-container">
                <Bar
                  data={{
                    labels: collectionEfficiencyData.map((data) => data.areaName),
                    datasets: [
                      {
                        label: "Bin Utilization (%)",
                        data: collectionEfficiencyData.map((data) => data.binUtilization),
                        backgroundColor: "#10b981",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: "Utilization (%)",
                        },
                      },
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: "Bin Utilization by Area",
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights Section */}
      <div className="mt-4">
        <label htmlFor="ai-insights" className="block text-sm font-medium text-gray-700">
          AI Insights
        </label>
        <div className="mt-2 p-4 border rounded-md bg-gray-50">
          {aiInsights ? (
            <ul className="list-disc pl-5 space-y-2">
              {aiInsights
                .split(/\d+\.\s+/) // Split insights by numbered points
                .filter((insight) => insight.trim() !== "") // Remove empty lines
                .map((insight, index) => (
                  <li key={index} className="text-sm text-gray-800">
                    {insight.trim()}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">AI insights will appear here...</p>
          )}
        </div>
        {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
      </div>
    </div>
  );
}
