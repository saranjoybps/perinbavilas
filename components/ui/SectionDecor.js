/** Soft floral corner for white homepage sections. */
export default function SectionDecor({
  position = 'top-right',
  src = '/decorative-1.png',
}) {
  const isTopRight = position === 'top-right';

  if (isTopRight) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-1 right-0 w-[220px] sm:w-[260px] md:w-[300px] lg:w-[360px]"
        style={{ zIndex: 0, opacity: 0.58 }}
      />
    );
  }

  // bottom-left — larger on phones so the bouquet reads clearly
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none select-none absolute bottom-2 left-0 w-[210px] sm:w-[250px] md:w-[280px] lg:w-[340px]"
      style={{
        zIndex: 0,
        opacity: 0.62,
        transform: 'translate(-6%, 4%)',
      }}
    />
  );
}
