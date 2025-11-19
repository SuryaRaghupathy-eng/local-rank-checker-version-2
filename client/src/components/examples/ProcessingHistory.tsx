import ProcessingHistory from '../ProcessingHistory';

export default function ProcessingHistoryExample() {
  const mockHistory = [
    {
      id: '1',
      fileName: 'queries.csv',
      processedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed' as const,
      queriesProcessed: 3,
      placesFound: 172,
    },
    {
      id: '2',
      fileName: 'locations.csv',
      processedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'completed' as const,
      queriesProcessed: 5,
      placesFound: 284,
    },
    {
      id: '3',
      fileName: 'test_data.csv',
      processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'failed' as const,
      queriesProcessed: 0,
      placesFound: 0,
    },
  ];

  return (
    <ProcessingHistory
      history={mockHistory}
      onDownload={(id, format) => console.log(`Download ${id} as ${format}`)}
    />
  );
}
