import DetailedErrorCard from '../DetailedErrorCard';

export default function DetailedErrorCardExample() {
  const mockErrors = [
    {
      row: 3,
      column: 'Brand',
      message: 'Missing required column "Brand". This column is required for brand matching.',
      type: 'error' as const,
    },
    {
      row: 7,
      column: 'Keywords',
      message: 'Empty value in required field. Keywords cannot be blank.',
      type: 'error' as const,
    },
    {
      row: 12,
      column: 'Branch',
      message: 'Value contains special characters that may affect matching accuracy.',
      type: 'warning' as const,
    },
  ];

  return (
    <DetailedErrorCard
      title="CSV Validation Failed"
      errors={mockErrors}
      onRetry={() => console.log('Retry clicked')}
      onDownloadSample={() => console.log('Download sample')}
    />
  );
}
