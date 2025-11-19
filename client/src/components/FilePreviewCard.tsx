import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface FilePreviewCardProps {
  fileName: string;
  fileSize: number;
  previewData: string[][];
  onProcess: () => void;
  onRemove: () => void;
  isProcessing?: boolean;
}

export default function FilePreviewCard({
  fileName,
  fileSize,
  previewData,
  onProcess,
  onRemove,
  isProcessing = false,
}: FilePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalKeywords = previewData.length > 0 ? previewData.length - 1 : 0;
  const displayData = isExpanded ? previewData.slice(1) : previewData.slice(1, 6);
  const hasMoreData = totalKeywords > 5;

  return (
    <Card data-testid="card-file-preview">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg" data-testid="text-preview-filename">{fileName}</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="text-preview-filesize">
              {(fileSize / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Preview</h3>
            <p className="text-sm text-muted-foreground">
              {totalKeywords} {totalKeywords === 1 ? 'keyword' : 'keywords'} uploaded
            </p>
          </div>
          <div className="border border-border rounded-md overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {previewData[0]?.map((header, i) => (
                    <TableHead key={i} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="font-mono text-sm">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasMoreData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 w-full"
              data-testid="button-toggle-preview"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show More ({totalKeywords - 5} more)
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onProcess}
            disabled={isProcessing}
            data-testid="button-process"
          >
            {isProcessing ? 'Checking Rankings...' : 'Check Rankings'}
          </Button>
          <Button
            variant="secondary"
            onClick={onRemove}
            disabled={isProcessing}
            data-testid="button-remove"
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
