import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title: string;
}

const PDFViewer = ({ isOpen, onClose, pdfUrl, title }: PDFViewerProps) => {
  const [error, setError] = useState(false);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center gap-2">
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-0">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-muted-foreground mb-4">No PDF available yet</div>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF to display here
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-destructive mb-4">Failed to load PDF</div>
                <Button onClick={() => setError(false)} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border"
              title={title}
              onError={() => setError(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;