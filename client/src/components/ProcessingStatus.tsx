import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  progress: number;
  message?: string;
}

export default function ProcessingStatus({ progress, message = 'Processing your file...' }: ProcessingStatusProps) {
  return (
    <Card data-testid="card-processing">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <p className="text-base font-medium text-foreground" data-testid="text-processing-message">
              {message}
            </p>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
            <p className="text-sm text-muted-foreground text-right" data-testid="text-progress-percent">
              {progress}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
