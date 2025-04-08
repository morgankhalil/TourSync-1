import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { 
  Settings, 
  Bell, 
  Moon, 
  Shield, 
  Lock,
  Globe,
  Building
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    collaborationRequests: true,
    tourUpdates: true,
    venueAlerts: true,
    marketingEmails: false
  });
  
  const [displaySettings, setDisplaySettings] = useState({
    darkMode: false,
    compactView: false,
    mapPreference: 'standard'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation('/login');
    return null;
  }

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDisplayChange = (key: keyof typeof displaySettings, value: any) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: typeof value === 'boolean' ? !prev[key] : value
    }));
  };

  const saveSettings = (settingsType: string) => {
    // This would typically make an API call to save user settings
    toast({
      title: `${settingsType} Settings Saved`,
      description: `Your ${settingsType.toLowerCase()} settings have been updated successfully.`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="account" className="w-full max-w-3xl">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select defaultValue="America/Chicago">
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en-US">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {user.userType === 'venue' && (
                <div className="grid gap-2 pt-4">
                  <Label className="text-base">Venue Settings</Label>
                  <Separator className="my-2" />
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Public Venue Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow your venue to be discovered by artists
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Accept Booking Inquiries</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow artists to send you booking inquiries
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button onClick={() => saveSettings('Account')}>
                Save Account Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="font-medium">
                  Email Notifications
                </div>
                <Switch 
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications')}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Email me about:</h3>
                
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm">
                    Collaboration requests
                  </div>
                  <Switch 
                    checked={notificationSettings.collaborationRequests}
                    onCheckedChange={() => handleNotificationChange('collaborationRequests')}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm">
                    Tour updates and alerts
                  </div>
                  <Switch 
                    checked={notificationSettings.tourUpdates}
                    onCheckedChange={() => handleNotificationChange('tourUpdates')}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm">
                    Venue availability alerts
                  </div>
                  <Switch 
                    checked={notificationSettings.venueAlerts}
                    onCheckedChange={() => handleNotificationChange('venueAlerts')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm">
                    Marketing and promotional emails
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={() => handleNotificationChange('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={() => saveSettings('Notification')}>
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Moon className="mr-2 h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the application looks for you
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="font-medium">
                  Dark Mode
                </div>
                <Switch 
                  checked={displaySettings.darkMode}
                  onCheckedChange={() => handleDisplayChange('darkMode', true)}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="font-medium">
                  Compact View
                </div>
                <Switch 
                  checked={displaySettings.compactView}
                  onCheckedChange={() => handleDisplayChange('compactView', true)}
                />
              </div>
              
              <div className="grid gap-2 pt-2">
                <Label htmlFor="mapPreference">Map Display Style</Label>
                <Select 
                  value={displaySettings.mapPreference}
                  onValueChange={(value) => handleDisplayChange('mapPreference', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select map style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="night">Night Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={() => saveSettings('Appearance')}>
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication methods
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Lock className="mr-2 h-4 w-4" />
                  Password
                </h3>
                <p className="text-sm text-muted-foreground">
                  Change your password to keep your account secure
                </p>
                <div className="pt-2">
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  Login Sessions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
                <div className="rounded-md border mt-2">
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-green-500 font-medium">
                      Active
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" className="text-destructive">
                    Sign Out All Devices
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 pt-2">
                <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <div className="pt-2">
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPage;