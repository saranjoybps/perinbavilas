'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionDecor from '@/components/ui/SectionDecor';

gsap.registerPlugin(ScrollTrigger);

const GALLERY_ITEMS = [
  { id: 1, label: 'Family Gatherings', src: '/gallery/gatherings.jpg' },
  { id: 2, label: 'Celebrations',      src: '/gallery/celebrations.jpg' },
  { id: 3, label: 'Milestones',        src: '/gallery/milestones.jpg' },
  { id: 4, label: 'Heritage',          src: '/gallery/heritage.jpg' },
  { id: 5, label: 'Traditions',        src: '/gallery/traditions.jpg' },
  { id: 6, label: 'Memories',          src: '/gallery/memories.jpg' },
];

function GalleryCard({ item, index }) {
  return (
    <div
      className="gallery-card gallery-card-init relative overflow-hidden group"
      style={{ aspectRatio: index === 0 || index === 3 ? '1 / 1.3' : '1 / 1' }}
    >
      <img
        src={item.src}
        alt={item.label}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      <div
        className="absolute inset-0 flex items-end p-4 sm:p-5"
        style={{
          background: 'linear-gradient(to top, rgba(26,16,8,0.55) 0%, transparent 55%)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: '#FFF7ED',
          }}
        >
          {item.label}
        </span>
      </div>

      <div
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
        style={{ background: 'rgba(255,251,245,0.82)', backdropFilter: 'blur(6px)' }}
        aria-label="Members only"
      >
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
          <rect x="1" y="5.5" width="9" height="7" rx="1.5" stroke="#0F2A1F" strokeWidth="1.2" />
          <path d="M3.5 5.5V3.5a2 2 0 014 0v2" stroke="#0F2A1F" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function GallerySection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);

  useGSAP(() => {
    gsap.from(headRef.current, {
      scrollTrigger: { trigger: headRef.current, start: 'top 82%' },
      opacity: 0,
      y: 28,
      duration: 0.9,
      ease: 'power2.out',
      immediateRender: false,
    });

    ScrollTrigger.batch(
      sectionRef.current.querySelectorAll('.gallery-card'),
      {
        start: 'top 90%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity:  1,
            y:        0,
            scale:    1,
            stagger:  { each: 0.08 },
            duration: 0.85,
            ease:     'power2.out',
            overwrite: true,
          }),
        once: true,
      },
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3.5rem, 8vw, 6.5rem)',
        paddingBottom: 'clamp(10rem, 32vw, 11rem)',
      }}
    >
      <SectionDecor position="bottom-left" src="/decorative-2.png" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12" style={{ zIndex: 1 }}>
        <div ref={headRef} className="mb-8 text-center sm:mb-12 md:mb-14">
          <div className="mb-3 flex items-center justify-center gap-4 sm:mb-5">
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#0F2A1F' }}
            >
              Visual Memory
            </span>
          </div>

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
              maxWidth: 400,
              lineHeight: 1.75,
              margin: '0 auto',
            }}
          >
            A glimpse into the family gallery — full access for members.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-12">
          {GALLERY_ITEMS.map((item, i) => (
            <GalleryCard key={item.id} item={item} index={i} />
          ))}
        </div>

        <div className="text-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(15, 42, 31,0.5)',
                color: '#0F2A1F',
                letterSpacing: '0.12em',
              }}
            >
              Access Family Gallery
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
