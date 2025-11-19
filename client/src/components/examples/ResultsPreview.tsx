import ResultsPreview from '../ResultsPreview';

export default function ResultsPreviewExample() {
  const mockData = [
    {
      title: 'Property People Estate & Letting Agents Belfast',
      address: '223 Antrim Rd, Belfast BT15 2GY',
      rating: 4.1,
      category: 'Estate Agent',
      query: 'estate agents in belfast',
      brand: 'Property People',
      brand_match: true,
      query_result_number: 56,
    },
    {
      title: 'GOC Estate Agents Ltd',
      address: '147 Stranmillis Rd, Belfast BT9 5AJ',
      rating: 4.7,
      category: 'Estate Agent',
      query: 'estate agents in belfast',
      brand: 'Property People',
      brand_match: false,
      query_result_number: 1,
    },
    {
      title: 'Piney Estate Agency',
      address: '42 Stranmillis Rd, Belfast BT9 5AA',
      rating: 4.9,
      category: 'Property Rental Agency',
      query: 'estate agents in belfast',
      brand: 'Property People',
      brand_match: false,
      query_result_number: 2,
    },
  ];

  return <ResultsPreview data={mockData} totalRows={172} />;
}
