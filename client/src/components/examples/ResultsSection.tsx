import ResultsSection from '../ResultsSection';

export default function ResultsSectionExample() {
  return (
    <ResultsSection
      queriesProcessed={3}
      placesFound={172}
      onDownloadCSV={() => console.log('Download CSV')}
      onDownloadJSON={() => console.log('Download JSON')}
      onDownloadExcel={() => console.log('Download Excel')}
      onDownloadMatches={() => console.log('Download Matches')}
    />
  );
}
