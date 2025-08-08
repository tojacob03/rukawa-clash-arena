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
  Upload,
  LogIn
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClientManager } from '@/components/admin/ClientManager';
import { FileManager } from '@/components/admin/FileManager';
import { AdminStats } from '@/components/admin/AdminStats';
import type { User, Session } from '@supabase/supabase-js';

const AdminPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check if current user is admin
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking admin status for user:', userId);
      
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: userId });

      console.log('Admin check result:', { data, error });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Exception checking admin status:', error);
      return false;
    }
  };

  // Handle admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        const adminStatus = await checkAdminStatus(data.user.id);
        if (!adminStatus) {
          setError('Access denied. Admin privileges required.');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      setError('Authentication failed');
    }
    
    setAuthLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('AdminPanel: Starting initialization');
    let isMounted = true;
    let adminStatusChecked = false;
    let isWindowFocused = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Getting current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('Current session user:', session?.user?.id || 'None');

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('Checking admin status...');
            const adminStatus = await checkAdminStatus(session.user.id);
            console.log('Admin status result:', adminStatus);
            if (isMounted) {
              setIsAdmin(adminStatus);
              adminStatusChecked = true;
            }
          } else {
            if (isMounted) setIsAdmin(false);
          }
          
          console.log('Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (isMounted) setLoading(false);
      }
    };

    // Handle window focus/blur to prevent issues when switching between apps
    const handleFocus = () => {
      console.log('Window focused');
      isWindowFocused = true;
    };
    
    const handleBlur = () => {
      console.log('Window blurred');
      isWindowFocused = false;
    };

    // Set up auth state listener - only when window is focused
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id || 'No user', 'Window focused:', isWindowFocused);
        
        if (!isMounted || !isWindowFocused) return;
        
        // Only handle actual sign in/out events, ignore token refresh
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Only check admin status if not already checked or on sign in/out (not token refresh)
          if (session?.user && (event === 'SIGNED_IN' || !adminStatusChecked)) {
            const adminStatus = await checkAdminStatus(session.user.id);
            console.log('Admin status from auth change:', adminStatus);
            setIsAdmin(adminStatus);
            adminStatusChecked = true;
          } else if (!session?.user) {
            setIsAdmin(false);
            adminStatusChecked = false;
          }
          
          setLoading(false);
        }
      }
    );

    // Add focus/blur listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initialize
    initializeAuth();

    return () => {
      console.log('Cleaning up AdminPanel auth subscription');
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      subscription.unsubscribe();
    };
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <p className="text-muted-foreground">
              Sign in with admin credentials to access management panel
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={authLoading}>
                <LogIn className="h-4 w-4 mr-2" />
                {authLoading ? 'Signing in...' : 'Sign In'}
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