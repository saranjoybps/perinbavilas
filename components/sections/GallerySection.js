'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionDecor from '@/components/ui/SectionDecor';
import GalleryImageFrame from '@/components/gallery/GalleryImageFrame';

gsap.registerPlugin(ScrollTrigger);
/**
 * Deferred refresh so Legacy's pin recalculates after gallery images
 * change layout — never during React's commit/reconcile.
 */
function scheduleScrollRefresh() {
  return setTimeout(() => {
    requestAnimationFrame(() => {
      try {
        ScrollTrigger.refresh();
      } catch {
        /* ignore mid-unmount races */
      }
    });
  }, 120);
}

export default function GallerySection() {
  const sectionRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gallery?status=approved&showOnHome=true');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !sectionRef.current) return undefined;

    let timer = scheduleScrollRefresh();
    const imgs = Array.from(sectionRef.current.querySelectorAll('img'));

    const onImageSettled = () => {
      clearTimeout(timer);
      timer = scheduleScrollRefresh();
    };

    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onImageSettled);
        img.addEventListener('error', onImageSettled);
      }
    });

    return () => {
      clearTimeout(timer);
      imgs.forEach((img) => {
        img.removeEventListener('load', onImageSettled);
        img.removeEventListener('error', onImageSettled);
      });
    };
  }, [loaded, items]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3.5rem, 8vw, 6.5rem)',
        paddingBottom: 'clamp(5.5rem, 16vw, 10rem)',
        zIndex: 0,
        isolation: 'isolate',
      }}
    >
      <SectionDecor
        position="bottom-right"
        src="/decorative-2.png"
        size="lg"
        className="md:!w-[260px] lg:!w-[320px] md:!translate-x-[4%] md:!translate-y-[6%] lg:!translate-x-[5%] lg:!translate-y-[8%]"
        style={{ opacity: 0.58 }}
      />

      <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <motion.div
          className="mb-8 text-center sm:mb-12 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
              fontWeight: 400,
              color: '#0F2A1F',
              marginBottom: '1rem',
            }}
          >
            Moments That{' '}
            <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Matter</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.05rem',
              color: 'rgba(15,42,31,0.52)',
              maxWidth: 420,
              lineHeight: 1.75,
              margin: '0 auto',
            }}
          >
            A glimpse of family moments — explore the full collection on the Gallery page.
          </p>
        </motion.div>

        {!loaded ? (
          <div className="flex justify-center py-16 mb-12">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1.5px solid rgba(15, 42, 31,0.2)',
                borderTopColor: '#0F2A1F',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center mb-12 py-10">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                color: 'rgba(15,42,31,0.45)',
              }}
            >
              Featured photos will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-12">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.65,
                  delay: Math.min(i * 0.06, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <GalleryImageFrame
                  src={item.url}
                  alt={item.caption || 'Family moment'}
                  caption={item.caption}
                  fullWidth
                  maxHeight="min(58vh, 420px)"
                />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(15, 42, 31,0.5)',
                color: '#0F2A1F',
                letterSpacing: '0.12em',
                background: '#FFFFFF',
              }}
            >
              View Full Gallery
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
