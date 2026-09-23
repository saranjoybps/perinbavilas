/** Soft floral corner for white homepage sections. */
export default function SectionDecor({
  position = 'top-right',
  src = '/decorative-1.png',
  className = '',
  size = 'md',
  style: styleProp,
}) {
  const widths = {
    topRight: {
      md: 'w-[220px] sm:w-[260px] md:w-[300px] lg:w-[360px]',
      lg: 'w-[260px] sm:w-[300px] md:w-[360px] lg:w-[420px]',
    },
    bottomRight: {
      md: 'w-[150px] sm:w-[210px] md:w-[280px] lg:w-[340px]',
      lg: 'w-[200px] sm:w-[260px] md:w-[340px] lg:w-[400px]',
    },
    bottomLeft: {
      md: 'w-[120px] sm:w-[180px] md:w-[260px] lg:w-[320px]',
      lg: 'w-[180px] sm:w-[240px] md:w-[320px] lg:w-[400px]',
    },
  };

  const sizeKey = size === 'lg' ? 'lg' : 'md';

  if (position === 'top-right') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute top-1 right-0 ${widths.topRight[sizeKey]} ${className}`}
        style={{ zIndex: 0, opacity: 0.45, ...styleProp }}
      />
    );
  }

  if (position === 'bottom-right') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute bottom-2 right-0 ${widths.bottomRight[sizeKey]} ${className}`}
        style={{
          zIndex: 0,
          opacity: size === 'lg' ? 0.55 : 0.45,
          transform: 'translate(4%, 4%)',
          ...styleProp,
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none absolute bottom-2 left-0 ${widths.bottomLeft[sizeKey]} ${className}`}
      style={{
        zIndex: 0,
        opacity: size === 'lg' ? 0.52 : 0.42,
        transform: 'translate(-4%, 4%)',
        ...styleProp,
      }}
    />
  );
}
