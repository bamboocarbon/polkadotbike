import affiliates from '@/data/affiliates.json';

export default function AADSUnit() {
  return (
    <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
      <iframe
        data-aa={affiliates.aads.unitId}
        src={`${affiliates.aads.src}`}
        style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
      />
    </div>
  );
}
