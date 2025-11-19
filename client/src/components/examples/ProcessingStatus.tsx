import ProcessingStatus from '../ProcessingStatus';

export default function ProcessingStatusExample() {
  return (
    <ProcessingStatus
      progress={65}
      message="Searching Google Places API..."
    />
  );
}
