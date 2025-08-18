import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type?: string;
  created_at: string;
}

interface Opponent {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  analysis_files: AnalysisFile[];
}

interface OpponentCardProps {
  opponent: Opponent;
  onViewAnalysis: (file: AnalysisFile) => void;
}

export function OpponentCard({ opponent, onViewAnalysis }: OpponentCardProps) {
  const { toast } = useToast();

  const downloadFile = async (file: AnalysisFile) => {
    try {
      // Get session token from sessionStorage (set by ClientPortal)
      const sessionToken = sessionStorage.getItem('client_session_token');
      if (!sessionToken) {
        toast({
          title: "Authentication required",
          description: "Please log in again to download files.",
          variant: "destructive",
        });
        return;
      }

      // Use the secure edge function to get signed URL
      const { data, error } = await supabase.functions.invoke('get-client-file', {
        body: {
          sessionToken,
          filePath: file.file_path,
          bucket: 'analysis-files'
        }
      });

      if (error) {
        console.error('Error getting file URL:', error);
        toast({
          title: "Download failed", 
          description: "Could not access the analysis file.",
          variant: "destructive",
        });
        return;
      }

      // Download using the signed URL
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${file.file_name}`,
      });
    } catch (err) {
      console.error('Error downloading file:', err);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {opponent.name}
            </CardTitle>
            {opponent.description && (
              <p className="text-sm text-muted-foreground">{opponent.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(opponent.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Analysis</span>
          </div>

          {(() => {
            const matchFiles = (opponent.analysis_files || []).filter(f => f.file_type === 'match_analysis');
            const playerFiles = (opponent.analysis_files || []).filter(f => f.file_type === 'player_analysis');

            return (
              <>
                {(!matchFiles.length && !playerFiles.length) ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No analysis files available</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {matchFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Match Analysis</h4>
                        <div className="space-y-2">
                          {matchFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{file.file_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewAnalysis(file)}
                                  className="h-8 w-8 p-0"
                                  title="View Analysis"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadFile(file)}
                                  className="h-8 w-8 p-0"
                                  title="Download File"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {playerFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Player Analysis</h4>
                        <div className="space-y-2">
                          {playerFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{file.file_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewAnalysis(file)}
                                  className="h-8 w-8 p-0"
                                  title="View Analysis"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadFile(file)}
                                  className="h-8 w-8 p-0"
                                  title="Download File"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}