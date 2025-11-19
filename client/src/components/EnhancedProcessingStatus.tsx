import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Activity, Clock, Zap } from 'lucide-react';

interface ProcessingStats {
  currentQuery?: string;
  totalQueries: number;
  processedQueries: number;
  queriesPerSecond: number;
  estimatedTimeRemaining: number; // in seconds
  apiCallsMade: number;
  currentPage?: number;
}

interface EnhancedProcessingStatusProps {
  progress: number;
  stats: ProcessingStats;
}

export default function EnhancedProcessingStatus({ progress, stats }: EnhancedProcessingStatusProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card data-testid="card-enhanced-processing">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-base font-medium text-foreground" data-testid="text-processing-message">
                Processing your file...
              </p>
              {stats.totalQueries > 0 && (
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-query-counter">
                  Processing query {stats.processedQueries} of {stats.totalQueries}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
