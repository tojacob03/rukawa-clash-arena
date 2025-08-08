import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  type: 'player' | 'team';
  login_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'player' as 'player' | 'team',
    login_code: '',
    is_active: true
  });
  const { toast } = useToast();

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false };
  }, []);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (isMountedRef.current) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive",
        });
        return;
      }

      if (isMountedRef.current) setClients(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const generateLoginCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData(prev => ({ ...prev, login_code: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            type: formData.type,
            login_code: formData.login_code,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name,
            type: formData.type,
            login_code: formData.login_code,
            is_active: formData.is_active
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client created successfully",
        });
      }

      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      type: client.type,
      login_code: client.login_code,
      is_active: client.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated data.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'player',
      login_code: '',
      is_active: true
    });
    setEditingClient(null);
    setShowForm(false);
  };

  const toggleClientStatus = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          is_active: !client.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client ${!client.is_active ? 'activated' : 'deactivated'} successfully`,
      });

      fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Client Management</h2>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingClient ? 'Edit Client' : 'Create New Client'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Client Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'player' | 'team') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login_code">Login Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="login_code"
                    value={formData.login_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, login_code: e.target.value }))}
                    placeholder="Enter login code"
                    required
                  />
                  <Button type="button" onClick={generateLoginCode} variant="outline">
                    Generate
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit">
                  {editingClient ? 'Update Client' : 'Create Client'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading clients...</div>
            </CardContent>
          </Card>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No clients found. Create your first client to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{client.name}</h3>
                      <Badge variant={client.type === 'player' ? 'default' : 'secondary'}>
                        {client.type}
                      </Badge>
                      <Badge variant={client.is_active ? 'default' : 'destructive'}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Login Code:</strong> {client.login_code}
                    </div>
                    {client.created_at && (
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleClientStatus(client)}
                      className="flex items-center gap-1"
                    >
                      {client.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}