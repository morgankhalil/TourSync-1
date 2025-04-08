import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, Building } from 'lucide-react';

export function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This would normally update the user profile via an API call
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
    
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <Tabs defaultValue="profile" className="w-full max-w-3xl">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Profile Details
              </CardTitle>
              <CardDescription>
                View and manage your personal information
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 py-2 border-b">
                    <div className="font-medium text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Name
                    </div>
                    <div className="col-span-2">{user.name}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2 border-b">
                    <div className="font-medium text-muted-foreground flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </div>
                    <div className="col-span-2">{user.email}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2 border-b">
                    <div className="font-medium text-muted-foreground flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      User Type
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="capitalize">
                        {user.userType}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <div className="font-medium text-muted-foreground flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Account Type
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="capitalize">
                        {user.userType}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleSubmit}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setLocation('/')}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <h3 className="text-lg font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Change your password to keep your account secure
                  </p>
                </div>
                
                <Button variant="outline">
                  Change Password
                </Button>
                
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" className="mt-4">
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

export default ProfilePage;