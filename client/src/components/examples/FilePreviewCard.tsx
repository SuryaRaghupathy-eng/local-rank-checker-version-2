import FilePreviewCard from '../FilePreviewCard';

export default function FilePreviewCardExample() {
  const mockData = [
    ['Keywords', 'Brand', 'Branch'],
    ['estate agents in belfast', 'Property People', 'Belfast'],
    ['lawyers in london', 'Smith & Co', 'London'],
    ['dentists in manchester', 'Dental Care', 'Manchester'],
  ];

  return (
    <FilePreviewCard
      fileName="queries.csv"
      fileSize={2048}
      previewData={mockData}
      onProcess={() => console.log('Process clicked')}
      onRemove={() => console.log('Remove clicked')}
    />
  );
}
