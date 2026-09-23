import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AdminStats = () => {
  const [stats, setStats] = useState({ clients: 0, deckSets: 0, opponents: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [clients, deckSets, opponents] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('deck_sets').select('*', { count: 'exact', head: true }),
          supabase.from('opponents').select('*', { count: 'exact', head: true }),
        ]);
        if (!active) return;
        setStats({
          clients: clients.count ?? 0,
          deckSets: deckSets.count ?? 0,
          opponents: opponents.count ?? 0,
        });
      } catch (error) {
        console.error('[AdminStats] Failed to load stats', error);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const items = [
    { label: 'Clients', value: stats.clients, Icon: Users },
    { label: 'Deck Sets', value: stats.deckSets, Icon: FileText },
    { label: 'Opponents', value: stats.opponents, Icon: Target },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
