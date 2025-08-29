import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, FileText, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DeckItem } from '@/components/deck/DeckItem';
import { OpponentCard } from '@/components/opponent/OpponentCard';
import { AnalysisViewer } from '@/components/opponent/AnalysisViewer';
import { withTimeout, withSupabaseTimeout } from '@/lib/withTimeout';
import { safeStorage } from '@/lib/safeStorage';

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
  login_code: string;
  is_active: boolean;
  sessionToken: string;
}

interface DeckSet {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  deck_files: DeckFile[];
}

interface DeckFile {
  id: string;
  deck_name: string;
  deck_link: string;
  deck_number: number;
  card_ids?: any; // JSON from database
}

interface AnalysisFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface Opponent {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  analysis_files: AnalysisFile[];
}

const ClientPortal = () => {
  const [loginCode, setLoginCode] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [deckSets, setDeckSets] = useState<DeckSet[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedAnalysisFile, setSelectedAnalysisFile] = useState<AnalysisFile | null>(null);
  const [showAnalysisViewer, setShowAnalysisViewer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDeckSets, setLoadingDeckSets] = useState(false);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [error, setError] = useState('');

  const fetchDeckSets = async (sessionToken: string) => {
    setLoadingDeckSets(true);
    console.log('[ClientPortal] Fetching deck sets...');

    try {
      console.log('[ClientPortal] Calling get_client_deck_sets_secure...');
      const deckSetsResult = await withSupabaseTimeout(
        async () => await supabase.rpc('get_client_deck_sets_secure', { session_token_param: sessionToken }),
        15000,
        'deck sets fetch'
      );

      if (deckSetsResult.error) {
        console.error('[ClientPortal] Error fetching deck sets:', deckSetsResult.error);
        setError('Failed to load deck sets. Please try again.');
        return;
      }

      const deckFilesResult = await withSupabaseTimeout(
        async () => await supabase.rpc('get_client_deck_files_secure', { session_token_param: sessionToken }),
        15000,
        'deck files fetch'
      );

      if (deckFilesResult.error) {
        console.error('[ClientPortal] Error fetching deck files:', deckFilesResult.error);
        setError('Failed to load deck files. Please try again.');
        return;
      }

      const deckSetsWithFiles = (deckSetsResult.data || []).map((deckSet: any) => ({
        ...deckSet,
        deck_files: (deckFilesResult.data || []).filter((file: any) => file.deck_set_id === deckSet.id)
      }));

      setDeckSets(deckSetsWithFiles);
      console.log(`[ClientPortal] Successfully loaded ${deckSetsWithFiles.length} deck sets`);
    } catch (err: any) {
      console.error('[ClientPortal] Exception fetching deck sets:', err);
      if (err.name === 'TimeoutError') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError('Failed to load deck sets. Please try again.');
      }
    } finally {
      setLoadingDeckSets(false);
    }
  };

  const fetchOpponents = async (sessionToken: string) => {
    setLoadingOpponents(true);
    console.log('[ClientPortal] Fetching opponents...');

    try {
      console.log('[ClientPortal] Calling get_client_opponents_secure...');
      const opponentsResult = await withSupabaseTimeout(
        async () => await supabase.rpc('get_client_opponents_secure', { session_token_param: sessionToken }),
        15000,
        'opponents fetch'
      );

      if (opponentsResult.error) {
        console.error('[ClientPortal] Error fetching opponents:', opponentsResult.error);
        setError('Failed to load opponents. Please try again.');
        return;
      }

      const analysisResult = await withSupabaseTimeout(
        async () => await supabase.rpc('get_client_analysis_files_secure', { session_token_param: sessionToken }),
        15000,
        'analysis files fetch'
      );

      if (analysisResult.error) {
        console.error('[ClientPortal] Error fetching analysis files:', analysisResult.error);
        setError('Failed to load analysis files. Please try again.');
        return;
      }

      const opponentsWithFiles = (opponentsResult.data || []).map((opponent: any) => ({
        ...opponent,
        analysis_files: (analysisResult.data || []).filter((file: any) => file.opponent_id === opponent.id)
      }));

      setOpponents(opponentsWithFiles);
      console.log(`[ClientPortal] Successfully loaded ${opponentsWithFiles.length} opponents`);
    } catch (err: any) {
      console.error('[ClientPortal] Exception fetching opponents:', err);
      if (err.name === 'TimeoutError') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError('Failed to load opponents. Please try again.');
      }
    } finally {
      setLoadingOpponents(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[ClientPortal] Starting login attempt with code:', loginCode.trim());

    try {
      console.log('[ClientPortal] Calling authenticate_client_secure...');
      const authResult = await withSupabaseTimeout(
        async () => await supabase.rpc('authenticate_client_secure', { 
          login_code_param: loginCode.trim(),
          ip_address_param: null,
          user_agent_param: navigator.userAgent 
        }),
        15000,
        'client authentication'
      );

      if (authResult.error) {
        console.error('[ClientPortal] Authentication error:', authResult.error);
        if (authResult.error.message?.includes('Too many failed')) {
          setError('Too many failed login attempts. Please try again later.');
        } else if (authResult.error.message?.includes('Invalid login code')) {
          setError('Invalid login code or inactive client.');
        } else {
          setError('Login failed. Please check your code and try again.');
        }
        return;
      }

      if (!authResult.data || (authResult.data as any[]).length === 0) {
        setError('Invalid login code or client not active');
        return;
      }

      const clientData = (authResult.data as any[])[0];
      console.log(`[ClientPortal] Login successful for client:`, clientData.client_name, clientData.client_type);
      
      const clientObject = {
        id: clientData.client_id,
        name: clientData.client_name,
        type: clientData.client_type,
        is_active: clientData.is_active,
        login_code: loginCode.trim(),
        sessionToken: clientData.session_token
      };

      setClient(clientObject);
      
      // Store session token securely
      sessionStorage.setItem('client_session_token', clientData.session_token);
      
      // Fetch data using the session token
      if (clientData.client_type === 'player') {
        await fetchDeckSets(clientData.session_token);
      } else if (clientData.client_type === 'team') {
        await fetchOpponents(clientData.session_token);
      }
    } catch (err: any) {
      console.error('[ClientPortal] Login exception:', err);
      
      if (err.name === 'TimeoutError') {
        setError('Login timeout. Please check your connection and try again.');
      } else if (err.message?.includes('Too many failed')) {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear session token from storage
    sessionStorage.removeItem('client_session_token');
    
    setClient(null);
    setDeckSets([]);
    setOpponents([]);
    setLoginCode('');
    setError('');
    setSelectedAnalysisFile(null);
    setShowAnalysisViewer(false);
  };

  // Reset portal session and reload
  const handleResetPortalSession = () => {
    console.log('[ClientPortal] Resetting portal session...');
    safeStorage.resetSupabaseSession();
    window.location.reload();
  };

  const handleViewAnalysis = (file: AnalysisFile) => {
    setSelectedAnalysisFile(file);
    setShowAnalysisViewer(true);
  };

  const handleCloseAnalysisViewer = () => {
    setShowAnalysisViewer(false);
    setSelectedAnalysisFile(null);
  };


  if (client) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
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

                {client.type === 'player' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Deck Sets</h3>
                      {loadingDeckSets && <div className="text-sm text-muted-foreground">Loading...</div>}
                    </div>
                    
                    {deckSets.length === 0 && !loadingDeckSets ? (
                      <div className="p-4 border rounded-lg text-center">
                        <p className="text-muted-foreground">No deck sets available</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {deckSets.map((deckSet) => (
                          <Card
                            key={deckSet.id}
                            className="relative overflow-hidden border shadow-card hover:shadow-glow transition-all duration-300 hover-scale animate-fade-in border-l-4 border-primary"
                          >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-transparent" />
                            <CardHeader className="pb-3 bg-primary/5">
                              <CardTitle className="text-lg">{deckSet.name}</CardTitle>
                              {deckSet.description && (
                                <p className="text-sm text-muted-foreground">{deckSet.description}</p>
                              )}
                            </CardHeader>
                            <CardContent className="bg-muted/40 rounded-b-lg">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Decks ({deckSet.deck_files?.length || 0}/4)</span>
                                  <Badge variant="secondary">
                                    {new Date(deckSet.created_at).toLocaleDateString()}
                                  </Badge>
                                </div>
                                
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {deckSet.deck_files && deckSet.deck_files.length > 0 ? (
                                    deckSet.deck_files.map((deckFile) => (
                                      <DeckItem key={deckFile.id} deckFile={deckFile} />
                                    ))
                                  ) : (
                                    <div className="col-span-full text-center p-4 text-muted-foreground">
                                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>No decks available in this set</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {client.type === 'team' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Opponent Analysis</h3>
                      </div>
                      {loadingOpponents && <div className="text-sm text-muted-foreground">Loading...</div>}
                    </div>
                    
                    {opponents.length === 0 && !loadingOpponents ? (
                      <div className="p-4 border rounded-lg text-center">
                        <p className="text-muted-foreground">No opponents available</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {opponents.map((opponent) => (
                          <OpponentCard
                            key={opponent.id}
                            opponent={opponent}
                            onViewAnalysis={handleViewAnalysis}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Viewer Modal */}
          <AnalysisViewer
            file={selectedAnalysisFile}
            isOpen={showAnalysisViewer}
            onClose={handleCloseAnalysisViewer}
            sessionToken={client.sessionToken}
          />
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

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleResetPortalSession}
            >
              Portal-Session zurücksetzen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortal;