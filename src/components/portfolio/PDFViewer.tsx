import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, FileText, BarChart3 } from "lucide-react";

// Import the actual PDFs
import matchAnalysisPdf from "@/assets/match-analysis.pdf";
import playerAnalysisPdf from "@/assets/player-analysis.pdf";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title: string;
  showSelection?: boolean;
}

const PDFViewer = ({ isOpen, onClose, pdfUrl, title, showSelection = false }: PDFViewerProps) => {
  const [error, setError] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  // Use the imported PDF files
  const matchAnalysisUrl = matchAnalysisPdf;
  const playerAnalysisUrl = playerAnalysisPdf;

  const handleDownload = () => {
    const currentPdfUrl = selectedPdf || pdfUrl;
    const currentTitle = selectedTitle || title;
    if (currentPdfUrl) {
      const link = document.createElement('a');
      link.href = currentPdfUrl;
      link.download = `${currentTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const selectPdf = (url: string, pdfTitle: string) => {
    setSelectedPdf(url);
    setSelectedTitle(pdfTitle);
    setError(false);
  };

  const goBackToSelection = () => {
    setSelectedPdf(null);
    setSelectedTitle("");
    setError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] sm:h-[85vh] p-1 flex flex-col">
        <DialogHeader className="p-3 pb-1 relative flex-shrink-0">
          <DialogTitle className="pr-12">
            <span className="truncate text-sm sm:text-base">{selectedTitle || title}</span>
          </DialogTitle>
          
          {/* Absolutely positioned buttons to avoid overlap with close button */}
          <div className="absolute top-3 right-12 flex items-center gap-1">
            {selectedPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={goBackToSelection}
                className="gap-1 text-xs px-2 py-1"
              >
                ← <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            {(selectedPdf || pdfUrl) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1 text-xs px-2 py-1"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className={`flex-1 ${showSelection && !selectedPdf ? 'p-3' : 'p-1'}`}>
          {showSelection && !selectedPdf ? (
            // Selection Screen
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
              <Button
                variant="outline"
                className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 p-3 sm:p-4 hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
                onClick={() => selectPdf(matchAnalysisUrl, "Match Analysis Sample")}
                disabled={!matchAnalysisUrl}
              >
                <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-primary flex-shrink-0" />
                <div className="text-center max-w-full">
                  <h3 className="text-base sm:text-lg font-semibold mb-1 break-words">Match Analysis</h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Team strategies & predictions
                  </p>
                </div>
                {!matchAnalysisUrl && (
                  <span className="text-xs text-muted-foreground">Upload PDF to enable</span>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 p-3 sm:p-4 hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
                onClick={() => selectPdf(playerAnalysisUrl, "Player Analysis Sample")}
                disabled={!playerAnalysisUrl}
              >
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-primary flex-shrink-0" />
                <div className="text-center max-w-full">
                  <h3 className="text-base sm:text-lg font-semibold mb-1 break-words">Player Analysis</h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Performance & recommendations
                  </p>
                </div>
                {!playerAnalysisUrl && (
                  <span className="text-xs text-muted-foreground">Upload PDF to enable</span>
                )}
              </Button>
            </div>
          ) : !selectedPdf && !pdfUrl ? (
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
              src={selectedPdf || pdfUrl}
              className="w-full h-full rounded-lg border-0"
              title={selectedTitle || title}
              onLoad={() => console.log('Portfolio PDF iframe loaded successfully')}
              onError={(e) => {
                console.error('Portfolio PDF iframe error:', e);
                setError(true);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;