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
import { withTimeout, withSupabaseTimeout } from '@/lib/withTimeout';
import { safeStorage } from '@/lib/safeStorage';
import type { User, Session } from '@supabase/supabase-js';

const AdminPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check if current user is admin with robust timeout
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('[AdminPanel] Checking admin status for user:', userId);
      
      const result = await withSupabaseTimeout(
        async () => await supabase.rpc('is_admin', { user_id: userId }),
        10000,
        'admin status check'
      );

      console.log('[AdminPanel] Admin check result:', result);

      if (result.error) {
        console.error('[AdminPanel] Error checking admin status:', result.error);
        return false;
      }

      return result.data === true;
    } catch (error: any) {
      console.error('[AdminPanel] Exception checking admin status:', error);
      return false;
    }
  };

  // Handle admin login with robust timeout handling
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setIsAuthenticating(true);
    setError('');

    console.log('[AdminPanel] Starting login attempt for:', email);

    try {
      console.log('[AdminPanel] Calling signInWithPassword...');
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await withTimeout(loginPromise, 15000, 'admin login');

      if (error) {
        console.error('[AdminPanel] Auth error:', error);
        setError(error.message || 'Login failed. Please check your credentials.');
      } else if (data.user) {
        console.log('[AdminPanel] User authenticated, checking admin status...');
        
        const adminStatus = await checkAdminStatus(data.user.id);
        console.log('[AdminPanel] Admin check result:', adminStatus);
        
        if (!adminStatus) {
          setError('Access denied. Admin privileges required.');
          console.log('[AdminPanel] Not admin, signing out...');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.error('[AdminPanel] Login timeout:', error.message);
        setError('Login timeout. Please check your connection and try again.');
      } else {
        console.error('[AdminPanel] Login exception:', error);
        setError('Authentication failed. Please try again.');
      }
    }
    
    setAuthLoading(false);
    setIsAuthenticating(false);
  };

  // Reset session and reload
  const handleResetSession = () => {
    console.log('[AdminPanel] Resetting session...');
    safeStorage.resetSupabaseSession();
    window.location.reload();
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
        console.log('[AdminPanel] Getting current session...');
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await withTimeout(sessionPromise, 10000, 'session retrieval');
        
        if (error) {
          console.error('[AdminPanel] Error getting session:', error);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('[AdminPanel] Current session user:', session?.user?.id || 'None');

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('[AdminPanel] Checking admin status...');
            const adminStatus = await checkAdminStatus(session.user.id);
            console.log('[AdminPanel] Admin status result:', adminStatus);
            if (isMounted) {
              setIsAdmin(adminStatus);
              adminStatusChecked = true;
            }
          } else {
            if (isMounted) setIsAdmin(false);
          }
          
          console.log('[AdminPanel] Setting loading to false');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('[AdminPanel] Error in initializeAuth:', error);
        if (error.name === 'TimeoutError') {
          console.error('[AdminPanel] Session retrieval timeout:', error.message);
        }
        if (isMounted) setLoading(false);
      }
    };

    // Set up auth state listener - removed focus-gating for reliability
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AdminPanel] Auth state change:', event, session?.user?.id || 'No user');
        
        if (!isMounted) return;
        
        // Handle all auth events consistently
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Defer admin status check to prevent deadlock
          if (session?.user && (event === 'SIGNED_IN' || !adminStatusChecked)) {
            setTimeout(async () => {
              try {
                const adminStatus = await checkAdminStatus(session.user.id);
                console.log('[AdminPanel] Admin status from auth change:', adminStatus);
                if (isMounted) {
                  setIsAdmin(adminStatus);
                  adminStatusChecked = true;
                }
              } catch (error) {
                console.error('[AdminPanel] Error checking admin status in auth change:', error);
                if (isMounted) setIsAdmin(false);
              }
            }, 0);
          } else if (!session?.user) {
            setIsAdmin(false);
            adminStatusChecked = false;
          }
          
          setLoading(false);
        }
      }
    );

    // Initialize
    initializeAuth();

    return () => {
      console.log('[AdminPanel] Cleaning up auth subscription');
      isMounted = false;
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={authLoading}
                onClick={() => setIsAuthenticating(true)}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {authLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleResetSession}
              >
                Reset Session
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