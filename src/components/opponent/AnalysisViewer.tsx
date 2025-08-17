import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

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
      console.log('Loading file:', file.file_path);
      const { data, error } = await supabase.storage
        .from('analysis-files')
        .download(file.file_path);

      if (error) {
        console.error('Supabase error loading file:', error);
        toast({
          title: "Load failed",
          description: "Could not load the analysis file.",
          variant: "destructive",
        });
        return;
      }

      console.log('File data received, size:', data.size, 'type:', data.type);
      const url = URL.createObjectURL(data);
      console.log('Blob URL created:', url);
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

  const openInNewTab = () => {
    if (!fileUrl) return;
    
    window.open(fileUrl, '_blank');
    toast({
      title: "Opening PDF",
      description: "PDF will open in a new tab",
    });
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
      <DialogContent className="w-screen max-w-[96vw] sm:max-w-[1200px] h-[85vh] p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-lg font-semibold">
              {file.file_name}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading analysis file...</p>
                </div>
              </div>
            ) : fileUrl ? (
              <div className="h-full border rounded-lg overflow-hidden bg-muted/20">
                 {file.file_name.toLowerCase().endsWith('.pdf') ? (
                   <iframe
                     src={fileUrl}
                     className="w-full h-full border-0"
                     title={file.file_name}
                     onLoad={() => console.log('PDF iframe loaded successfully')}
                     onError={(e) => {
                       console.error('PDF iframe error:', e);
                       toast({
                         title: "Display Error",
                         description: "Could not display PDF in browser. Try downloading the file.",
                         variant: "destructive",
                       });
                     }}
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
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Failed to load file</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}