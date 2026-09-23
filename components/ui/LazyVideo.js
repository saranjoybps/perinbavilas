'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Background looping video that only loads when near the viewport.
 * Keeps poster visible until playback can start.
 */
export default function LazyVideo({
  src,
  poster,
  className,
  style,
  preloadDistance = '400px',
}) {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || shouldLoad) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: preloadDistance, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad, preloadDistance]);

  useEffect(() => {
    if (!shouldLoad) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    video.muted = true;
    video.playsInline = true;
    const tryPlay = () => {
      video.play().catch(() => {});
    };
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    return () => video.removeEventListener('loadeddata', tryPlay);
  }, [shouldLoad, src]);

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      autoPlay={shouldLoad}
      muted
      loop
      playsInline
      preload={shouldLoad ? 'metadata' : 'none'}
      poster={poster}
      aria-hidden="true"
    >
      {shouldLoad ? <source src={src} type="video/mp4" /> : null}
    </video>
  );
}
