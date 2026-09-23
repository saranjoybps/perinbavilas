'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GalleryImageFrame from '@/components/gallery/GalleryImageFrame';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gallery?status=approved');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(168, 196, 180, 0.2) 0%, transparent 55%), linear-gradient(180deg, #F7FAF8 0%, #EEF3F0 50%, #F7FAF8 100%)',
      }}
    >
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12"
        style={{ paddingTop: '6.5rem', paddingBottom: '4.5rem' }}
      >
        <Link
          href="/#gallery"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(15, 42, 31, 0.55)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: '2rem',
          }}
        >
          ← Back to home
        </Link>

        <div className="text-center mb-10 sm:mb-14">
          <h1
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 400,
              color: '#0F2A1F',
              marginBottom: '1rem',
            }}
          >
            Family Gallery
          </h1>
          <span className="gold-rule block mx-auto mb-4" />
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.05rem',
              color: 'rgba(15,42,31,0.52)',
              maxWidth: 440,
              lineHeight: 1.75,
              margin: '0 auto',
            }}
          >
            Moments shared by the family — every photo shown in full, without cropping.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid rgba(15, 42, 31,0.2)',
                borderTopColor: '#0F2A1F',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.8rem',
                color: '#1A3D2E',
                marginBottom: '0.75rem',
              }}
            >
              ▣
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                color: 'rgba(15,42,31,0.45)',
              }}
            >
              No published photos yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {items.map((item) => (
              <GalleryImageFrame
                key={item.id}
                src={item.url}
                alt={item.caption || 'Family gallery photo'}
                caption={item.caption}
                maxHeight="min(65vh, 480px)"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
