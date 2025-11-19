import { useState } from 'react';
import FileUploadZone from '../FileUploadZone';

export default function FileUploadZoneExample() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <FileUploadZone
      selectedFile={file}
      onFileSelect={setFile}
      onRemove={() => setFile(null)}
    />
  );
}
