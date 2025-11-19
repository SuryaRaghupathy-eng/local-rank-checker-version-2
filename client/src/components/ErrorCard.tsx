import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
  showSample?: boolean;
  onDownloadSample?: () => void;
}

export default function ErrorCard({ message, onRetry, showSample = true, onDownloadSample }: ErrorCardProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5" data-testid="card-error">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-base font-medium text-destructive">
                Processing Error
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-error-message">
                {message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onRetry} data-testid="button-retry">
              Try Again
            </Button>
            {showSample && onDownloadSample && (
              <Button variant="secondary" onClick={onDownloadSample} data-testid="button-sample">
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
