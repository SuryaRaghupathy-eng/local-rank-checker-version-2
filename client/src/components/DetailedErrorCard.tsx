import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationError {
  row?: number;
  column?: string;
  message: string;
  type: 'error' | 'warning';
}

interface DetailedErrorCardProps {
  title: string;
  errors: ValidationError[];
  onRetry: () => void;
  onDownloadSample?: () => void;
  showSample?: boolean;
}

export default function DetailedErrorCard({
  title,
  errors,
  onRetry,
  onDownloadSample,
  showSample = true,
}: DetailedErrorCardProps) {
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  return (
    <Card className="border-destructive/50 bg-destructive/5" data-testid="card-detailed-error">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base text-destructive mb-1">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {errorCount > 0 && (
                <Badge variant="secondary" className="bg-destructive/20 text-destructive text-xs">
                  {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs">
                  {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-auto">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className="p-3 bg-background rounded-md border border-border"
              data-testid={`error-item-${idx}`}
            >
              <div className="flex items-start gap-2">
                <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  error.type === 'error' ? 'text-destructive' : 'text-yellow-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {error.message}
                  </p>
                  {(error.row || error.column) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {error.row && `Row ${error.row}`}
                      {error.row && error.column && ' • '}
                      {error.column && `Column: ${error.column}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onRetry} data-testid="button-retry-detailed">
            Try Again
          </Button>
          {showSample && onDownloadSample && (
            <Button variant="secondary" onClick={onDownloadSample} data-testid="button-sample-detailed">
              <Download className="w-4 h-4 mr-2" />
              Download Sample CSV
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
