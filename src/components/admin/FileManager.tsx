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
import { parseDeckLink } from '@/utils/deckParser';

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
  const [opLoading, setOpLoading] = useState(false);

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
    deck_number: 1 as number,
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
    console.log('🔥 FileManager: Starting fetchData... loading:', loading, 'opLoading:', opLoading);
    
    // Prevent multiple concurrent fetchData calls
    if (loading) {
      console.log('🔥 fetchData already running, skipping...');
      return;
    }
    
    setLoading(true);
    console.log('🔥 fetchData: setLoading(true) called');
    
    try {
      // Fetch clients first and wait for completion
      console.log('Fetching clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        throw clientsError;
      }
      console.log('Clients fetched:', clientsData?.length || 0);
      
      // Immediately set clients to prevent undefined errors
      const safeClientsData = clientsData || [];
      setClients(safeClientsData);

      // Fetch deck sets
      console.log('Fetching deck sets...');
      const { data: deckSetsData, error: deckSetsError } = await supabase
        .from('deck_sets')
        .select('*')
        .order('created_at', { ascending: false });

      const safeDeckSetsData = deckSetsData || [];
      if (deckSetsError) {
        console.error('Error fetching deck sets:', deckSetsError);
        setDeckSets([]);
      } else {
        console.log('Deck sets fetched:', safeDeckSetsData.length);
        // Simple mapping without complex nesting
        const deckSetsWithClients = safeDeckSetsData.map(deckSet => ({
          ...deckSet,
          client: safeClientsData.find(c => c.id === deckSet.client_id)
        }));
        setDeckSets(deckSetsWithClients);
      }

      // Fetch deck files
      console.log('Fetching deck files...');
      const { data: deckFilesData, error: deckFilesError } = await supabase
        .from('deck_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (deckFilesError) {
        console.error('Error fetching deck files:', deckFilesError);
        setDeckFiles([]);
      } else {
        const safeDeckFilesData = deckFilesData || [];
        console.log('Deck files fetched:', safeDeckFilesData.length);
        
        // Simple safe mapping
        const deckFilesWithRelations = safeDeckFilesData.map(deckFile => {
          const deckSet = safeDeckSetsData.find(ds => ds.id === deckFile.deck_set_id);
          const client = safeClientsData.find(c => c.id === deckSet?.client_id);
          
          return {
            ...deckFile,
            deck_set: deckSet ? { 
              id: deckSet.id,
              name: deckSet.name,
              description: deckSet.description || '',
              client_id: deckSet.client_id,
              client: client || undefined
            } : undefined
          };
        });
        setDeckFiles(deckFilesWithRelations);
      }

      // Fetch opponents
      console.log('Fetching opponents...');
      const { data: opponentsData, error: opponentsError } = await supabase
        .from('opponents')
        .select('*')
        .order('name');

      const safeOpponentsData = opponentsData || [];
      if (opponentsError) {
        console.error('Error fetching opponents:', opponentsError);
        setOpponents([]);
      } else {
        console.log('Opponents fetched:', safeOpponentsData.length);
        const opponentsWithClients = safeOpponentsData.map(opponent => ({
          ...opponent,
          client: safeClientsData.find(c => c.id === opponent.client_id)
        }));
        setOpponents(opponentsWithClients);
      }

      // Fetch analysis files
      console.log('Fetching analysis files...');
      const { data: analysisFilesData, error: analysisFilesError } = await supabase
        .from('analysis_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (analysisFilesError) {
        console.error('Error fetching analysis files:', analysisFilesError);
        setAnalysisFiles([]);
      } else {
        const safeAnalysisFilesData = analysisFilesData || [];
        console.log('Analysis files fetched:', safeAnalysisFilesData.length);
        
        const analysisFilesWithRelations = safeAnalysisFilesData.map(file => {
          const opponent = safeOpponentsData.find(o => o.id === file.opponent_id);
          const client = safeClientsData.find(c => c.id === opponent?.client_id);
          
          return {
            ...file,
            opponent: opponent ? { 
              id: opponent.id,
              name: opponent.name,
              description: opponent.description || '',
              client_id: opponent.client_id,
              client: client || undefined
            } : undefined
          };
        });
        setAnalysisFiles(analysisFilesWithRelations);
      }

      console.log('FileManager: fetchData completed successfully');
    } catch (error) {
      console.error('FileManager: Critical error in fetchData:', error);
      // Reset all state to prevent crashes
      setClients([]);
      setDeckSets([]);
      setDeckFiles([]);
      setOpponents([]);
      setAnalysisFiles([]);
      
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
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

    console.log('🔥 createDeckFile called, opLoading:', opLoading);
    
    if (opLoading) {
      console.log('🔥 Operation already in progress, returning early');
      return;
    }
    
    console.log('🔥 Setting opLoading to true');
    setOpLoading(true);
    
    console.log('Creating deck file with form data:', deckFileForm);
    
    // Validate form data
    if (!deckFileForm.deck_name.trim()) {
      toast({ title: "Error", description: "Deck name is required", variant: "destructive" });
      setOpLoading(false);
      return;
    }

    if (!deckFileForm.deck_set_id) {
      toast({ title: "Error", description: "Please select a deck set", variant: "destructive" });
      setOpLoading(false);
      return;
    }

    // Validate deck link and extract card IDs
    const parsedDeck = parseDeckLink(deckFileForm.deck_link);
    console.log('Parsed deck:', parsedDeck);
    if (!parsedDeck.isValid) {
      toast({ title: "Error", description: "Invalid deck link. Please provide a valid Clash Royale deck link.", variant: "destructive" });
      setOpLoading(false);
      return;
    }

    // Ensure deck_number is a valid integer
    const deckNumber = parseInt(deckFileForm.deck_number.toString(), 10);
    if (isNaN(deckNumber) || deckNumber < 1) {
      toast({ title: "Error", description: "Deck number must be a positive integer", variant: "destructive" });
      setOpLoading(false);
      return;
    }

    // Check for duplicate deck numbers in the same deck set
    const existingDeckWithNumber = deckFiles.find(deck => 
      deck.deck_set_id === deckFileForm.deck_set_id && deck.deck_number === deckNumber
    );
    if (existingDeckWithNumber) {
      toast({ title: "Error", description: `Deck number ${deckNumber} already exists in this deck set`, variant: "destructive" });
      setOpLoading(false);
      return;
    }

    try {
      // Ensure card_ids are clean integers (parseDeckLink already returns numbers)
      const cardIds = parsedDeck.cards.map(id => Math.round(id));

      const deckData = {
        deck_name: deckFileForm.deck_name.trim(),
        deck_link: deckFileForm.deck_link.trim(),
        deck_number: deckNumber,
        deck_set_id: deckFileForm.deck_set_id,
        card_ids: cardIds, // Integer array for PostgreSQL
      };

      console.log('Inserting deck data:', deckData);

      const { error } = await supabase.from('deck_files').insert([deckData]);
      if (error) throw error;

      console.log('🔥 Deck file created successfully, calling fetchData...');
      toast({ title: "Success", description: "Deck file created successfully" });

      // Reset form properly
      setDeckFileForm({ deck_name: '', deck_link: '', deck_number: 1, deck_set_id: '' });
      setShowDeckFileForm(false);
      
      console.log('🔥 About to call fetchData after deck creation');
      await fetchData();
      console.log('🔥 fetchData completed after deck creation');
    } catch (error) {
      console.error('🔥 Error creating deck file:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create deck file", variant: "destructive" });
    } finally {
      console.log('🔥 Setting opLoading to false');
      setOpLoading(false);
    }
  };

  const deleteDeckFile = async (deckFileId: string, deckName: string) => {
    console.log('🔥 deleteDeckFile called, opLoading:', opLoading);
    
    if (opLoading) {
      console.log('🔥 Delete operation blocked - already in progress');
      return;
    }
    
    console.log('🔥 Setting opLoading to true for delete');
    setOpLoading(true);

    try {
      console.log('Deleting deck file:', deckFileId, deckName);
      
      const { error } = await supabase
        .from('deck_files')
        .delete()
        .eq('id', deckFileId);

      if (error) throw error;

      console.log('🔥 Deck file deleted successfully, calling fetchData...');
      toast({
        title: "Success",
        description: `Deck "${deckName}" deleted successfully`,
      });

      console.log('🔥 About to call fetchData after deletion');
      await fetchData();
      console.log('🔥 fetchData completed after deletion');
    } catch (error) {
      console.error('🔥 Error deleting deck file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete deck file",
        variant: "destructive",
      });
    } finally {
      console.log('🔥 Setting opLoading to false after delete');
      setOpLoading(false);
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
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 1 : parseInt(value, 10) || 1;
                          setDeckFileForm(prev => ({ ...prev, deck_number: numValue }));
                        }}
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
                      required
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
                    <Button type="submit" disabled={opLoading}>
                      {opLoading ? "Creating..." : "Create Deck File"}
                    </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDeckFile(deckFile.id, deckFile.deck_name)}
                      className="text-destructive hover:text-destructive"
                      disabled={opLoading}
                    >
                      {opLoading ? "Deleting..." : <Trash2 className="h-4 w-4" />}
                    </Button>
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