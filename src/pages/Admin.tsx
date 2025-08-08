import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Upload, FileText, BarChart3, Trash2, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
  login_code: string;
  is_active: boolean;
  created_at: string;
}

interface DeckSet {
  id: string;
  name: string;
  description: string;
  client: { name: string };
  deck_files: Array<{ id: string; file_name: string; deck_number: number }>;
}

interface Opponent {
  id: string;
  name: string;
  description: string;
  client: { name: string };
  analysis_files: Array<{ id: string; file_name: string; file_type: string }>;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [deckSets, setDeckSets] = useState<DeckSet[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [newClient, setNewClient] = useState({
    name: "",
    type: "player" as 'player' | 'team',
    login_code: "",
  });
  const [newDeckSet, setNewDeckSet] = useState({
    client_id: "",
    name: "",
    description: "",
  });
  const [newOpponent, setNewOpponent] = useState({
    client_id: "",
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated (you can enhance this with proper session management)
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleAdminLogin = async () => {
    // Simple password check - in production, use proper authentication
    if (password === "rukawa2024") {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadData();
      toast({
        title: "Welcome",
        description: "Successfully logged into admin panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin password",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      setClients(clientsData || []);

      // Load deck sets
      const { data: deckSetsData } = await supabase
        .from('deck_sets')
        .select(`
          id,
          name,
          description,
          client:clients(name),
          deck_files(id, file_name, deck_number)
        `)
        .order('created_at', { ascending: false });
      setDeckSets(deckSetsData || []);

      // Load opponents
      const { data: opponentsData } = await supabase
        .from('opponents')
        .select(`
          id,
          name,
          description,
          client:clients(name),
          analysis_files(id, file_name, file_type)
        `)
        .order('created_at', { ascending: false });
      setOpponents(opponentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLoginCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createClient = async () => {
    if (!newClient.name || !newClient.login_code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('clients').insert([newClient]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Client created successfully",
      });

      setNewClient({ name: "", type: "player", login_code: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const createDeckSet = async () => {
    if (!newDeckSet.client_id || !newDeckSet.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('deck_sets').insert([newDeckSet]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Deck set created successfully",
      });

      setNewDeckSet({ client_id: "", name: "", description: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create deck set",
        variant: "destructive",
      });
    }
  };

  const createOpponent = async () => {
    if (!newOpponent.client_id || !newOpponent.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('opponents').insert([newOpponent]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Opponent created successfully",
      });

      setNewOpponent({ client_id: "", name: "", description: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create opponent",
        variant: "destructive",
      });
    }
  };

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 gradient-primary rounded-lg shadow-glow w-fit">
              <Settings className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <p className="text-muted-foreground">
              Enter admin password to access management panel
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Access Admin Panel
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
              <Settings className="w-6 h-6 text-clash-purple" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Client & File Management</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem('admin_authenticated');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="decksets">Deck Sets</TabsTrigger>
            <TabsTrigger value="opponents">Opponents</TabsTrigger>
            <TabsTrigger value="files">File Management</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Name</Label>
                    <Input
                      id="clientName"
                      placeholder="Client name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientType">Type</Label>
                    <Select
                      value={newClient.type}
                      onValueChange={(value: 'player' | 'team') => 
                        setNewClient({ ...newClient, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Individual Player</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginCode">Login Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="loginCode"
                        placeholder="Login code"
                        value={newClient.login_code}
                        onChange={(e) => setNewClient({ ...newClient, login_code: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewClient({ ...newClient, login_code: generateLoginCode() })}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={createClient}>Create Client</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Existing Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium">{client.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={client.type === 'player' ? 'default' : 'secondary'}>
                            {client.type}
                          </Badge>
                          <Badge variant={client.is_active ? 'default' : 'destructive'}>
                            {client.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Code: {client.login_code}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal?code=${client.login_code}`)}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant={client.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleClientStatus(client.id, client.is_active)}
                        >
                          {client.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decksets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Deck Set
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deckSetClient">Player</Label>
                    <Select
                      value={newDeckSet.client_id}
                      onValueChange={(value) => setNewDeckSet({ ...newDeckSet, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.filter(c => c.type === 'player' && c.is_active).map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deckSetName">Deck Set Name</Label>
                    <Input
                      id="deckSetName"
                      placeholder="e.g., Tournament Decks v1"
                      value={newDeckSet.name}
                      onChange={(e) => setNewDeckSet({ ...newDeckSet, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deckSetDescription">Description</Label>
                  <Textarea
                    id="deckSetDescription"
                    placeholder="Optional description"
                    value={newDeckSet.description}
                    onChange={(e) => setNewDeckSet({ ...newDeckSet, description: e.target.value })}
                  />
                </div>
                <Button onClick={createDeckSet}>Create Deck Set</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Existing Deck Sets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deckSets.map((deckSet) => (
                    <div key={deckSet.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{deckSet.name}</h4>
                        <Badge>{deckSet.client.name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{deckSet.description}</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((num) => {
                          const hasFile = deckSet.deck_files.some(f => f.deck_number === num);
                          return (
                            <Badge key={num} variant={hasFile ? "default" : "secondary"}>
                              Deck {num} {hasFile ? '✓' : '✗'}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opponents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Opponent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opponentClient">Team</Label>
                    <Select
                      value={newOpponent.client_id}
                      onValueChange={(value) => setNewOpponent({ ...newOpponent, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.filter(c => c.type === 'team' && c.is_active).map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opponentName">Opponent Name</Label>
                    <Input
                      id="opponentName"
                      placeholder="e.g., Team Alpha"
                      value={newOpponent.name}
                      onChange={(e) => setNewOpponent({ ...newOpponent, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opponentDescription">Description</Label>
                  <Textarea
                    id="opponentDescription"
                    placeholder="Optional description"
                    value={newOpponent.description}
                    onChange={(e) => setNewOpponent({ ...newOpponent, description: e.target.value })}
                  />
                </div>
                <Button onClick={createOpponent}>Create Opponent</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Existing Opponents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opponents.map((opponent) => (
                    <div key={opponent.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{opponent.name}</h4>
                        <Badge>{opponent.client.name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{opponent.description}</p>
                      <div className="flex gap-2">
                        <Badge variant={opponent.analysis_files.some(f => f.file_type === 'match_analysis') ? "default" : "secondary"}>
                          Match Analysis {opponent.analysis_files.some(f => f.file_type === 'match_analysis') ? '✓' : '✗'}
                        </Badge>
                        <Badge variant={opponent.analysis_files.some(f => f.file_type === 'player_analysis') ? "default" : "secondary"}>
                          Player Analysis {opponent.analysis_files.some(f => f.file_type === 'player_analysis') ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  File Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  File upload interface will be implemented here. This would include:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Upload files for deck sets (assign to specific deck numbers)</li>
                  <li>Upload analysis files for opponents (match/player analysis)</li>
                  <li>Bulk upload functionality</li>
                  <li>File preview and management</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;