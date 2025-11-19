import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onRemove?: () => void;
}

export default function FileUploadZone({ onFileSelect, selectedFile, onRemove }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  if (selectedFile) {
    return (
      <div className="border border-border bg-card rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-foreground truncate" data-testid="text-filename">
              {selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-filesize">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              data-testid="button-remove-file"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors max-w-lg mx-auto ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover-elevate'
      }`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      data-testid="dropzone-upload"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Upload className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Accepts .csv files up to 10MB
          </p>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          data-testid="input-file"
        />
        <label htmlFor="file-upload">
          <Button asChild size="sm" data-testid="button-browse">
            <span>Upload File</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
