import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Download, Users, User, FileText, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
  login_code: string;
}

interface DeckSet {
  id: string;
  name: string;
  description: string;
  deck_files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    deck_number: number;
    file_size: number;
  }>;
}

interface Opponent {
  id: string;
  name: string;
  description: string;
  analysis_files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
  }>;
}

const Portal = () => {
  const [searchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [deckSets, setDeckSets] = useState<DeckSet[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLoginCode(code);
      handleLogin(code);
    }
  }, [searchParams]);

  const handleLogin = async (code = loginCode) => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a login code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find client by login code
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('login_code', code.trim())
        .eq('is_active', true)
        .single();

      if (clientError || !clientData) {
        toast({
          title: "Access Denied",
          description: "Invalid login code or access has been disabled",
          variant: "destructive",
        });
        return;
      }

      setClient(clientData);
      setIsAuthenticated(true);

      // Create session tracking
      await supabase.from('client_sessions').insert({
        client_id: clientData.id,
        login_code: code.trim(),
        ip_address: null, // Could be enhanced with actual IP detection
        user_agent: navigator.userAgent,
      });

      if (clientData.type === 'player') {
        await loadDeckSets(clientData.id);
      } else {
        await loadOpponents(clientData.id);
      }

      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${clientData.name}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDeckSets = async (clientId: string) => {
    const { data, error } = await supabase
      .from('deck_sets')
      .select(`
        id,
        name,
        description,
        deck_files (
          id,
          file_name,
          file_path,
          deck_number,
          file_size
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deck sets:', error);
      return;
    }

    setDeckSets(data || []);
  };

  const loadOpponents = async (clientId: string) => {
    const { data, error } = await supabase
      .from('opponents')
      .select(`
        id,
        name,
        description,
        analysis_files (
          id,
          file_name,
          file_path,
          file_type,
          file_size
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading opponents:', error);
      return;
    }

    setOpponents(data || []);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const bucket = client?.type === 'player' ? 'deck-files' : 'analysis-files';
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 gradient-primary rounded-lg shadow-glow w-fit">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Client Portal Access</CardTitle>
            <p className="text-muted-foreground">
              Enter your login code to access your analysis files
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginCode">Login Code</Label>
              <Input
                id="loginCode"
                type="text"
                placeholder="Enter your access code"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              onClick={() => handleLogin()} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Access Portal"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {client?.type === 'player' ? (
                <User className="w-6 h-6 text-clash-blue" />
              ) : (
                <Users className="w-6 h-6 text-clash-purple" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{client?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {client?.type === 'player' ? 'Player Portal' : 'Team Portal'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setClient(null);
                setDeckSets([]);
                setOpponents([]);
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {client?.type === 'player' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-clash-blue" />
              <h2 className="text-xl font-semibold">Your Deck Sets</h2>
            </div>

            {deckSets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No deck sets available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {deckSets.map((deckSet) => (
                  <Card key={deckSet.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {deckSet.name}
                      </CardTitle>
                      {deckSet.description && (
                        <p className="text-muted-foreground">{deckSet.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((deckNumber) => {
                          const deckFile = deckSet.deck_files.find(f => f.deck_number === deckNumber);
                          return (
                            <div key={deckNumber} className="border border-border rounded-lg p-4">
                              <h4 className="font-medium mb-2">Deck {deckNumber}</h4>
                              {deckFile ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground truncate">
                                    {deckFile.file_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(deckFile.file_size)}
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => downloadFile(deckFile.file_path, deckFile.file_name)}
                                    className="w-full"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No file uploaded</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-clash-purple" />
              <h2 className="text-xl font-semibold">Opponent Analysis</h2>
            </div>

            {opponents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No opponent analysis available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {opponents.map((opponent) => (
                  <Card key={opponent.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {opponent.name}
                      </CardTitle>
                      {opponent.description && (
                        <p className="text-muted-foreground">{opponent.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Match Analysis</h4>
                          <div className="space-y-2">
                            {opponent.analysis_files
                              .filter(f => f.file_type === 'match_analysis')
                              .map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                                  <div>
                                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.file_size)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(file.file_path, file.file_name)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            {opponent.analysis_files.filter(f => f.file_type === 'match_analysis').length === 0 && (
                              <p className="text-sm text-muted-foreground">No match analysis files</p>
                            )}
                          </div>
                        </div>

                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Player Analysis</h4>
                          <div className="space-y-2">
                            {opponent.analysis_files
                              .filter(f => f.file_type === 'player_analysis')
                              .map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                                  <div>
                                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.file_size)}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(file.file_path, file.file_name)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            {opponent.analysis_files.filter(f => f.file_type === 'player_analysis').length === 0 && (
                              <p className="text-sm text-muted-foreground">No player analysis files</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portal;