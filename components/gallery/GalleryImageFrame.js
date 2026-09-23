'use client';

/**
 * Displays the full image without crop or stretch.
 * No border / frame — photo only (optional caption below).
 */
export default function GalleryImageFrame({
  src,
  alt = '',
  caption,
  className = '',
  style = {},
  maxHeight = 'min(70vh, 520px)',
  fullWidth = false,
}) {
  return (
    <figure
      className={className}
      style={{
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: fullWidth ? 'stretch' : 'center',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          display: 'block',
          maxWidth: '100%',
          width: fullWidth ? '100%' : 'auto',
          maxHeight,
          height: 'auto',
          objectFit: 'contain',
        }}
      />
      {caption ? (
        <figcaption
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: 'rgba(15, 42, 31, 0.55)',
            padding: '0.65rem 0.25rem 0',
            lineHeight: 1.45,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
