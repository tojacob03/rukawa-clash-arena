import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
  login_code: string;
  is_active: boolean;
}

const ClientPortal = () => {
  const [loginCode, setLoginCode] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('login_code', loginCode.trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Invalid login code or client not active');
        return;
      }

      setClient(data);
    } catch (err) {
      setError('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setClient(null);
    setLoginCode('');
    setError('');
  };

  if (client) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Client Portal</h1>
                <p className="text-muted-foreground">Welcome, {client.name}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Client Information</h3>
                  <p><strong>Name:</strong> {client.name}</p>
                  <p><strong>Type:</strong> {client.type === 'player' ? 'Player' : 'Team'}</p>
                  <p><strong>Status:</strong> Active</p>
                </div>

                {client.type === 'player' && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Deck Sets</h3>
                    <p className="text-muted-foreground">Your deck sets will be displayed here (implemented in Phase 3)</p>
                  </div>
                )}

                {client.type === 'team' && (
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Opponent Analysis</h3>
                    <p className="text-muted-foreground">Your opponent analyses will be displayed here (implemented in Phase 4)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <p className="text-muted-foreground">
            Enter your login code
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginCode">Login Code</Label>
              <Input
                id="loginCode"
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="Your login code"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortal;