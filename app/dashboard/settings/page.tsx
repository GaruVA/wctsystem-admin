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
import { Save, Upload } from "lucide-react"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="collection">Collection Settings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
            <TabsTrigger value="optimization">Route Optimization</TabsTrigger>
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
                  <Label htmlFor="organization-name">Organization Name</Label>
                  <Input id="organization-name" defaultValue="City Waste Management Department" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@wctsystem.com" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="notifications">Enable System Notifications</Label>
                  <Switch id="notifications" defaultChecked />
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="flex gap-2">
                    <Input id="logo-upload" type="file" />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
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
              <CardHeader>
                <CardTitle>Collection Settings</CardTitle>
                <CardDescription>Configure waste collection zones and collection parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Bins Per Route</Label>
                  <Select defaultValue="20">
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum bins per route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Bins</SelectItem>
                      <SelectItem value="15">15 Bins</SelectItem>
                      <SelectItem value="20">20 Bins</SelectItem>
                      <SelectItem value="25">25 Bins</SelectItem>
                      <SelectItem value="30">30 Bins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Collection Start Time</Label>
                  <Input type="time" defaultValue="08:00" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Capacity (kg)</Label>
                  <Input type="number" defaultValue="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Service Time Per Bin (minutes)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="weekend-collection">Enable Weekend Collections</Label>
                  <Switch id="weekend-collection" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="automatic-scheduling">Automatic Route Scheduling</Label>
                  <Switch id="automatic-scheduling" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Collection Settings
                </Button>
              </CardFooter>
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
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="dashboard-alerts">Dashboard Alerts</Label>
                  <Switch id="dashboard-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="collector-notifications">Driver Mobile Notifications</Label>
                  <Switch id="collector-notifications" defaultChecked />
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="alert-emails">Additional Alert Recipients</Label>
                  <Input id="alert-emails" placeholder="Email addresses separated by commas" />
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
          
          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Optimization Settings</CardTitle>
                <CardDescription>Configure routing engine and optimization parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Routing API Key</Label>
                  <Input id="api-key" type="password" defaultValue="••••••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select defaultValue="garbage-truck">
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="garbage-truck">Garbage Truck</SelectItem>
                      <SelectItem value="pickup-truck">Pickup Truck</SelectItem>
                      <SelectItem value="compact-vehicle">Compact Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Route Optimization Strategy</Label>
                  <Select defaultValue="distance">
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">Minimize Distance</SelectItem>
                      <SelectItem value="time">Minimize Time</SelectItem>
                      <SelectItem value="balanced">Balanced Approach</SelectItem>
                      <SelectItem value="fill-priority">Fill Level Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="avoid-tolls">Avoid Toll Roads</Label>
                  <Switch id="avoid-tolls" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="avoid-highways">Avoid Highways</Label>
                  <Switch id="avoid-highways" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="real-time-traffic">Consider Real-time Traffic</Label>
                  <Switch id="real-time-traffic" defaultChecked />
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Max Route Duration (hours)</Label>
                  <Input type="number" defaultValue="8" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Optimization Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}