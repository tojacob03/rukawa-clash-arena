import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

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

interface AnalysisViewerProps {
  file: AnalysisFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisViewer({ file, isOpen, onClose }: AnalysisViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (file && isOpen) {
      loadFile();
    }
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    };
  }, [file, isOpen]);

  const loadFile = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('analysis-files')
        .download(file.file_path);

      if (error) {
        console.error('Error loading file:', error);
        toast({
          title: "Load failed",
          description: "Could not load the analysis file.",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(data);
      setFileUrl(url);
    } catch (err) {
      console.error('Error loading file:', err);
      toast({
        title: "Load failed",
        description: "An error occurred while loading the file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!file || !fileUrl) return;

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: `Downloading ${file.file_name}`,
    });
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="inset-0 m-4 sm:m-8 w-auto max-w-none h-auto p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {file.file_name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadFile}
                  disabled={!fileUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-[85vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analysis file...</p>
              </div>
            </div>
          ) : fileUrl ? (
            <div className="h-[85vh] border rounded-lg overflow-hidden">
              {(file.mime_type === 'application/pdf' || file.file_type === 'application/pdf' || file.file_type === 'pdf') ? (
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full rounded-lg border-0"
                  title={file.file_name}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p>Preview not available for this file type</p>
                    <p className="text-sm mt-2">Use the download button to view the file</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[85vh] text-muted-foreground">
              <p>Failed to load file</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}