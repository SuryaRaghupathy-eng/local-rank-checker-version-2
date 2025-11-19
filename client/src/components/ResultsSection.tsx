import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResultsSectionProps {
  queriesProcessed: number;
  placesFound: number;
  onDownloadCSV: () => void;
  onDownloadMatches?: () => void;
  onProcessAnother?: () => void;
}

export default function ResultsSection({
  queriesProcessed,
  placesFound,
  onDownloadCSV,
  onDownloadMatches,
  onProcessAnother,
}: ResultsSectionProps) {
  return (
    <Card data-testid="card-results">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Processing Complete</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your data has been successfully processed
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Download Results</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onDownloadCSV} data-testid="button-download-csv">
              <Download className="w-4 h-4 mr-2" />
              All Data
            </Button>
            {onDownloadMatches && (
              <Button onClick={onDownloadMatches} data-testid="button-download-matches">
                <Download className="w-4 h-4 mr-2" />
                Matches Only
              </Button>
            )}
            {onProcessAnother && (
              <Button
                onClick={onProcessAnother}
                data-testid="button-process-another"
              >
                Process Another File
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              All results include brand matching data
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
