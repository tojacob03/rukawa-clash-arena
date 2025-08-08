import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  FileText, 
  Target, 
  Plus, 
  Settings,
  BarChart3,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClientManager } from '@/components/admin/ClientManager';
import { FileManager } from '@/components/admin/FileManager';
import { AdminStats } from '@/components/admin/AdminStats';

const AdminPanel = () => {
  const [adminCode, setAdminCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple admin authentication (in production, use proper auth)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple admin code check (you can enhance this with proper auth)
    if (adminCode === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      setError('Invalid admin code');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminCode('');
    localStorage.removeItem('adminAuth');
  };

  // Check if admin is already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <p className="text-muted-foreground">
              Enter admin code to access management panel
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminCode">Admin Code</Label>
                <Input
                  id="adminCode"
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin code"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Access Admin Panel'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">
                  Clash Royale Coaching Management System
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminStats />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManager />
          </TabsContent>

          <TabsContent value="files">
            <FileManager />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Storage Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Deck Files Bucket:</span>
                        <Badge variant="secondary" className="ml-2">deck-files</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Analysis Files Bucket:</span>
                        <Badge variant="secondary" className="ml-2">analysis-files</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Security</h3>
                    <p className="text-sm text-muted-foreground">
                      All file operations are secured with Row Level Security (RLS).
                      Only authenticated admin users can manage files and clients.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;