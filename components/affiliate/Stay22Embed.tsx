export default function Stay22Embed({ src }: { src: string }) {
  // JSX requires frameBorder, not frameborder — wrong casing means React
  // silently drops the attribute rather than erroring.
  return (
    <iframe
      src={src}
      width="100%"
      frameBorder="0"
      loading="lazy"
      className="stay22-frame"
      style={{ borderRadius: 12, display: 'block' }}
    />
  );
}
