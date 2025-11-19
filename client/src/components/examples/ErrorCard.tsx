import ErrorCard from '../ErrorCard';

export default function ErrorCardExample() {
  return (
    <ErrorCard
      message="The CSV file is missing required columns: Keywords, Brand, Branch. Please check your file format and try again."
      onRetry={() => console.log('Retry clicked')}
      onDownloadSample={() => console.log('Download sample')}
    />
  );
}
