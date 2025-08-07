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
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{selectedTitle || title}</span>
            <div className="flex items-center gap-2">
              {selectedPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBackToSelection}
                  className="gap-2"
                >
                  ← Back
                </Button>
              )}
              {(selectedPdf || pdfUrl) && (
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
          {showSelection && !selectedPdf ? (
            // Selection Screen
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Button
                variant="outline"
                className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 p-8 hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
                onClick={() => selectPdf(matchAnalysisUrl, "Match Analysis Sample")}
                disabled={!matchAnalysisUrl}
              >
                <BarChart3 className="w-16 h-16 text-primary" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Match Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed breakdown of team strategies, meta analysis, and match predictions
                  </p>
                </div>
                {!matchAnalysisUrl && (
                  <span className="text-xs text-muted-foreground">Upload PDF to enable</span>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 p-8 hover:bg-secondary/50 transition-all duration-300 hover:scale-105"
                onClick={() => selectPdf(playerAnalysisUrl, "Player Analysis Sample")}
                disabled={!playerAnalysisUrl}
              >
                <FileText className="w-16 h-16 text-primary" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Player Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Individual player performance breakdowns and improvement recommendations
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
              className="w-full h-full rounded-lg border"
              title={selectedTitle || title}
              onError={() => setError(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;