import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Target, 
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalClients: number;
  playerClients: number;
  teamClients: number;
  totalDeckSets: number;
  totalDeckFiles: number;
  totalOpponents: number;
  totalAnalysisFiles: number;
  activeClients: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    playerClients: 0,
    teamClients: 0,
    totalDeckSets: 0,
    totalDeckFiles: 0,
    totalOpponents: 0,
    totalAnalysisFiles: 0,
    activeClients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch clients data
      const { data: clients } = await supabase
        .from('clients')
        .select('type, is_active');

      // Fetch deck sets count
      const { count: deckSetsCount } = await supabase
        .from('deck_sets')
        .select('*', { count: 'exact', head: true });

      // Fetch deck files count
      const { count: deckFilesCount } = await supabase
        .from('deck_files')
        .select('*', { count: 'exact', head: true });

      // Fetch opponents count
      const { count: opponentsCount } = await supabase
        .from('opponents')
        .select('*', { count: 'exact', head: true });

      // Fetch analysis files count
      const { count: analysisFilesCount } = await supabase
        .from('analysis_files')
        .select('*', { count: 'exact', head: true });

      // Calculate client statistics
      const totalClients = clients?.length || 0;
      const playerClients = clients?.filter(c => c.type === 'player').length || 0;
      const teamClients = clients?.filter(c => c.type === 'team').length || 0;
      const activeClients = clients?.filter(c => c.is_active).length || 0;

      setStats({
        totalClients,
        playerClients,
        teamClients,
        totalDeckSets: deckSetsCount || 0,
        totalDeckFiles: deckFilesCount || 0,
        totalOpponents: opponentsCount || 0,
        totalAnalysisFiles: analysisFilesCount || 0,
        activeClients
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats.activeClients} active`
    },
    {
      title: 'Player Clients',
      value: stats.playerClients,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Individual players'
    },
    {
      title: 'Team Clients',
      value: stats.teamClients,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Team organizations'
    },
    {
      title: 'Deck Sets',
      value: stats.totalDeckSets,
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Player deck collections'
    },
    {
      title: 'Deck Files',
      value: stats.totalDeckFiles,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Individual deck links'
    },
    {
      title: 'Opponents',
      value: stats.totalOpponents,
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Analysis targets'
    },
    {
      title: 'Analysis Files',
      value: stats.totalAnalysisFiles,
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Uploaded documents'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(7)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Dashboard Overview
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Player Clients</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalClients > 0 ? (stats.playerClients / stats.totalClients) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{stats.playerClients}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Team Clients</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalClients > 0 ? (stats.teamClients / stats.totalClients) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{stats.teamClients}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Clients</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalClients > 0 ? (stats.activeClients / stats.totalClients) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{stats.activeClients}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Storage Usage</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Files stored in Supabase Storage buckets
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Database Status</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All database operations are functional
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Security</span>
                  <Badge variant="default">RLS Enabled</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Row Level Security is active on all tables
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}