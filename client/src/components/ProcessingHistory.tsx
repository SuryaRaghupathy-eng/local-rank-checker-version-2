import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HistoryItem {
  id: string;
  fileName: string;
  processedAt: Date;
  status: 'completed' | 'failed';
  queriesProcessed: number;
  placesFound: number;
}

interface ProcessingHistoryProps {
  history: HistoryItem[];
  onDownload: (id: string, format: 'csv' | 'json' | 'xlsx' | 'matches') => void;
}

export default function ProcessingHistory({ history, onDownload }: ProcessingHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-history">
      <CardHeader>
        <CardTitle className="text-lg">Processing History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg hover-elevate"
              data-testid={`history-item-${item.id}`}
            >
              <div className="flex-shrink-0">
                {item.status === 'completed' ? (
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate" data-testid="text-history-filename">
                  {item.fileName}
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(item.processedAt, { addSuffix: true })}
                  </span>
                  {item.status === 'completed' && (
                    <>
                      <span>•</span>
                      <span>{item.queriesProcessed} queries</span>
                      <span>•</span>
                      <span>{item.placesFound} places</span>
                    </>
                  )}
                </div>
              </div>

              {item.status === 'completed' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload(item.id, 'csv')}
                    data-testid="button-history-csv"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload(item.id, 'json')}
                    data-testid="button-history-json"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload(item.id, 'xlsx')}
                    data-testid="button-history-xlsx"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Excel
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  Failed
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
