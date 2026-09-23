import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ClientRow {
  id: string;
  name: string;
  type: string;
  login_code: string;
  is_active: boolean;
  created_at?: string;
}

export const ClientManager = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, type, login_code, is_active, created_at')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) console.error('[ClientManager] load failed', error);
      setClients((data as ClientRow[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.type} · Code {client.login_code}
                  </p>
                </div>
                <Badge variant={client.is_active ? 'secondary' : 'outline'}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientManager;
