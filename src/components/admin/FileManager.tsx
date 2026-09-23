import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisFileRow {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export const FileManager = () => {
  const [files, setFiles] = useState<AnalysisFileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('analysis_files')
        .select('id, file_name, file_type, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!active) return;
      if (error) console.error('[FileManager] load failed', error);
      setFiles((data as AnalysisFileRow[]) ?? []);
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
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm">{file.file_name}</span>
                </div>
                <Badge variant="secondary">{file.file_type}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManager;
