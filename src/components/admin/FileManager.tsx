import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Plus,
  Users,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
}

interface DeckSet {
  id: string;
  name: string;
  description: string;
  client_id: string;
  client?: Client;
}

interface DeckFile {
  id: string;
  deck_name: string;
  deck_link: string;
  deck_number: number;
  deck_set_id: string;
  deck_set?: DeckSet;
}

interface Opponent {
  id: string;
  name: string;
  description: string;
  client_id: string;
  client?: Client;
}

interface AnalysisFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  opponent_id: string;
  opponent?: Opponent;
}

export function FileManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [deckSets, setDeckSets] = useState<DeckSet[]>([]);
  const [deckFiles, setDeckFiles] = useState<DeckFile[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [analysisFiles, setAnalysisFiles] = useState<AnalysisFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form states
  const [showDeckSetForm, setShowDeckSetForm] = useState(false);
  const [showDeckFileForm, setShowDeckFileForm] = useState(false);
  const [showOpponentForm, setShowOpponentForm] = useState(false);
  const [showAnalysisUpload, setShowAnalysisUpload] = useState(false);

  const [deckSetForm, setDeckSetForm] = useState({
    name: '',
    description: '',
    client_id: ''
  });

  const [deckFileForm, setDeckFileForm] = useState({
    deck_name: '',
    deck_link: '',
    deck_number: 1,
    deck_set_id: ''
  });

  const [opponentForm, setOpponentForm] = useState({
    name: '',
    description: '',
    client_id: ''
  });

  const [analysisUpload, setAnalysisUpload] = useState({
    opponent_id: '',
    selectedFile: null as File | null
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      // Fetch deck sets with client info
      const { data: deckSetsData } = await supabase
        .from('deck_sets')
        .select(`
          *,
          clients (id, name, type)
        `)
        .order('created_at', { ascending: false });

      // Fetch deck files with deck set info
      const { data: deckFilesData } = await supabase
        .from('deck_files')
        .select(`
          *,
          deck_sets (
            id, name, client_id,
            clients (id, name, type)
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch opponents with client info
      const { data: opponentsData } = await supabase
        .from('opponents')
        .select(`
          *,
          clients (id, name, type)
        `)
        .order('name');

      // Fetch analysis files with opponent info
      const { data: analysisFilesData } = await supabase
        .from('analysis_files')
        .select(`
          *,
          opponents (
            id, name, client_id,
            clients (id, name, type)
          )
        `)
        .order('created_at', { ascending: false });

      setClients(clientsData || []);
      setDeckSets(deckSetsData || []);
      setDeckFiles(deckFilesData || []);
      setOpponents(opponentsData || []);
      setAnalysisFiles(analysisFilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeckSet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('deck_sets')
        .insert([deckSetForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deck set created successfully",
      });

      setDeckSetForm({ name: '', description: '', client_id: '' });
      setShowDeckSetForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating deck set:', error);
      toast({
        title: "Error",
        description: "Failed to create deck set",
        variant: "destructive",
      });
    }
  };

  const createDeckFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('deck_files')
        .insert([deckFileForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deck file created successfully",
      });

      setDeckFileForm({ deck_name: '', deck_link: '', deck_number: 1, deck_set_id: '' });
      setShowDeckFileForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating deck file:', error);
      toast({
        title: "Error",
        description: "Failed to create deck file",
        variant: "destructive",
      });
    }
  };

  const createOpponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('opponents')
        .insert([opponentForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opponent created successfully",
      });

      setOpponentForm({ name: '', description: '', client_id: '' });
      setShowOpponentForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating opponent:', error);
      toast({
        title: "Error",
        description: "Failed to create opponent",
        variant: "destructive",
      });
    }
  };

  const uploadAnalysisFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisUpload.selectedFile) return;

    setUploadLoading(true);
    try {
      const fileExt = analysisUpload.selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${analysisUpload.opponent_id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('analysis-files')
        .upload(filePath, analysisUpload.selectedFile);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('analysis_files')
        .insert([{
          file_name: analysisUpload.selectedFile.name,
          file_path: filePath,
          file_type: analysisUpload.selectedFile.type,
          opponent_id: analysisUpload.opponent_id
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Analysis file uploaded successfully",
      });

      setAnalysisUpload({ opponent_id: '', selectedFile: null });
      setShowAnalysisUpload(false);
      fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload analysis file",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const playerClients = clients.filter(c => c.type === 'player');
  const teamClients = clients.filter(c => c.type === 'team');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">File Management</h2>
      </div>

      <Tabs defaultValue="decks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="decks">Deck Management</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Files</TabsTrigger>
        </TabsList>

        <TabsContent value="decks" className="space-y-6">
          {/* Deck Sets Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Deck Sets</CardTitle>
                <Button onClick={() => setShowDeckSetForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deck Set
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showDeckSetForm && (
                <form onSubmit={createDeckSet} className="space-y-4 mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deckSetName">Name</Label>
                      <Input
                        id="deckSetName"
                        value={deckSetForm.name}
                        onChange={(e) => setDeckSetForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deckSetClient">Player Client</Label>
                      <Select
                        value={deckSetForm.client_id}
                        onValueChange={(value) => setDeckSetForm(prev => ({ ...prev, client_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player client" />
                        </SelectTrigger>
                        <SelectContent>
                          {playerClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deckSetDescription">Description</Label>
                    <Textarea
                      id="deckSetDescription"
                      value={deckSetForm.description}
                      onChange={(e) => setDeckSetForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Deck Set</Button>
                    <Button type="button" variant="outline" onClick={() => setShowDeckSetForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {deckSets.map(deckSet => (
                  <div key={deckSet.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{deckSet.name}</h3>
                      <p className="text-sm text-muted-foreground">{deckSet.description}</p>
                      <Badge variant="secondary">{deckSet.client?.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deck Files Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Deck Files</CardTitle>
                <Button onClick={() => setShowDeckFileForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deck File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showDeckFileForm && (
                <form onSubmit={createDeckFile} className="space-y-4 mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deckFileName">Deck Name</Label>
                      <Input
                        id="deckFileName"
                        value={deckFileForm.deck_name}
                        onChange={(e) => setDeckFileForm(prev => ({ ...prev, deck_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deckFileNumber">Deck Number</Label>
                      <Input
                        id="deckFileNumber"
                        type="number"
                        min="1"
                        max="4"
                        value={deckFileForm.deck_number}
                        onChange={(e) => setDeckFileForm(prev => ({ ...prev, deck_number: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deckFileLink">Clash Royale Deck Link</Label>
                    <Input
                      id="deckFileLink"
                      value={deckFileForm.deck_link}
                      onChange={(e) => setDeckFileForm(prev => ({ ...prev, deck_link: e.target.value }))}
                      placeholder="clashroyale://copyDeck?deck=..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deckFileSet">Deck Set</Label>
                    <Select
                      value={deckFileForm.deck_set_id}
                      onValueChange={(value) => setDeckFileForm(prev => ({ ...prev, deck_set_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deck set" />
                      </SelectTrigger>
                      <SelectContent>
                        {deckSets.map(deckSet => (
                          <SelectItem key={deckSet.id} value={deckSet.id}>
                            {deckSet.name} ({deckSet.client?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Deck File</Button>
                    <Button type="button" variant="outline" onClick={() => setShowDeckFileForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {deckFiles.map(deckFile => (
                  <div key={deckFile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{deckFile.deck_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Deck #{deckFile.deck_number} in {deckFile.deck_set?.name}
                      </p>
                      <Badge variant="secondary">{deckFile.deck_set?.client?.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Opponents Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Opponents</CardTitle>
                <Button onClick={() => setShowOpponentForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opponent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showOpponentForm && (
                <form onSubmit={createOpponent} className="space-y-4 mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opponentName">Opponent Name</Label>
                      <Input
                        id="opponentName"
                        value={opponentForm.name}
                        onChange={(e) => setOpponentForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="opponentClient">Team Client</Label>
                      <Select
                        value={opponentForm.client_id}
                        onValueChange={(value) => setOpponentForm(prev => ({ ...prev, client_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team client" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="opponentDescription">Description</Label>
                    <Textarea
                      id="opponentDescription"
                      value={opponentForm.description}
                      onChange={(e) => setOpponentForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Opponent</Button>
                    <Button type="button" variant="outline" onClick={() => setShowOpponentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {opponents.map(opponent => (
                  <div key={opponent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{opponent.name}</h3>
                      <p className="text-sm text-muted-foreground">{opponent.description}</p>
                      <Badge variant="secondary">{opponent.client?.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Files Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analysis Files</CardTitle>
                <Button onClick={() => setShowAnalysisUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Analysis File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAnalysisUpload && (
                <form onSubmit={uploadAnalysisFile} className="space-y-4 mb-6 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="analysisOpponent">Opponent</Label>
                    <Select
                      value={analysisUpload.opponent_id}
                      onValueChange={(value) => setAnalysisUpload(prev => ({ ...prev, opponent_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select opponent" />
                      </SelectTrigger>
                      <SelectContent>
                        {opponents.map(opponent => (
                          <SelectItem key={opponent.id} value={opponent.id}>
                            {opponent.name} ({opponent.client?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="analysisFile">Analysis File</Label>
                    <Input
                      id="analysisFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setAnalysisUpload(prev => ({ 
                        ...prev, 
                        selectedFile: e.target.files?.[0] || null 
                      }))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploadLoading}>
                      {uploadLoading ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAnalysisUpload(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="grid gap-4">
                {analysisFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{file.file_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {file.opponent?.name} ({file.opponent?.client?.name})
                      </p>
                      <Badge variant="outline">{file.file_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}