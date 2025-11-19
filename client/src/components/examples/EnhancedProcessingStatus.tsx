import EnhancedProcessingStatus from '../EnhancedProcessingStatus';

export default function EnhancedProcessingStatusExample() {
  const mockStats = {
    currentQuery: 'estate agents in belfast',
    totalQueries: 15,
    processedQueries: 8,
    queriesPerSecond: 2.3,
    estimatedTimeRemaining: 45,
    apiCallsMade: 24,
    currentPage: 3,
  };

  return <EnhancedProcessingStatus progress={53} stats={mockStats} />;
}
