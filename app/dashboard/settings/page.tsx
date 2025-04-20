"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, ArrowDownToLine, Settings, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSettings, updateSettings, Settings as SettingsType } from "@/lib/api/settings"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // System settings state
  const [systemName, setSystemName] = useState("WCT Waste Collection System");
  const [adminEmail, setAdminEmail] = useState("admin@wctsystem.com");
  
  // Notification settings state
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [criticalThreshold, setCriticalThreshold] = useState(85);
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  useEffect(() => {
    // Load settings on component mount
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getSettings();
      
      // Update system settings
      setSystemName(settings.systemName);
      setAdminEmail(settings.adminEmail);
      
      // Update notification settings
      if (settings.notifications) {
        setEnableNotifications(settings.notifications.enabled);
        setCriticalThreshold(settings.notifications.criticalThreshold);
        setWarningThreshold(settings.notifications.warningThreshold);
        setEmailAlerts(settings.notifications.emailAlerts);
        setSmsAlerts(settings.notifications.smsAlerts);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Create settings object
      const settingsData: Partial<SettingsType> = {
        systemName,
        adminEmail,
        notifications: {
          enabled: enableNotifications,
          criticalThreshold,
          warningThreshold,
          emailAlerts,
          smsAlerts
        }
      };
      
      // Save settings via API
      await updateSettings(settingsData);
      
      // Show success message
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      
      // Dispatch a custom event for the sidebar to pick up the system name change
      const event = new CustomEvent('system-name-changed', { detail: systemName });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <>
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>Configure your waste collection system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input 
                  id="system-name" 
                  value={systemName} 
                  onChange={(e) => setSystemName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input 
                  id="admin-email" 
                  type="email" 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <div>
                  <Label htmlFor="enable-notifications" className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Turn on/off all system notifications and alerts</p>
                </div>
                <Switch 
                  id="enable-notifications" 
                  checked={enableNotifications} 
                  onCheckedChange={setEnableNotifications} 
                />
              </div>

              {/* Notification Settings - conditionally rendered */}
              {enableNotifications && (
                <div className="border p-4 rounded-md space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Critical Fill Level Threshold</Label>
                      <span className="text-sm">{criticalThreshold}%</span>
                    </div>
                    <Slider 
                      value={[criticalThreshold]} 
                      max={100} 
                      step={5} 
                      onValueChange={(value) => setCriticalThreshold(value[0])} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Warning Fill Level Threshold</Label>
                      <span className="text-sm">{warningThreshold}%</span>
                    </div>
                    <Slider 
                      value={[warningThreshold]} 
                      max={100} 
                      step={5} 
                      onValueChange={(value) => setWarningThreshold(value[0])} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-0 pt-2">
                    <Label htmlFor="email-alerts">Email Alerts</Label>
                    <Switch 
                      id="email-alerts" 
                      checked={emailAlerts} 
                      onCheckedChange={setEmailAlerts} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-y-0 hidden">
                    <Label htmlFor="sms-alerts">SMS Alerts</Label>
                    <Switch 
                      id="sms-alerts" 
                      checked={smsAlerts}
                      onCheckedChange={setSmsAlerts} 
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
}