'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GALLERY_ITEMS = [
  { id: 1, label: 'Family Gatherings', color: ['#E8D8C0', '#D4C4A8'] },
  { id: 2, label: 'Celebrations',      color: ['#D8E8F0', '#C4D8E8'] },
  { id: 3, label: 'Milestones',        color: ['#E8EAD0', '#D4D6B8'] },
  { id: 4, label: 'Heritage',          color: ['#F0E0D0', '#E0CCBA'] },
  { id: 5, label: 'Traditions',        color: ['#D8E4D8', '#C4D0C4'] },
  { id: 6, label: 'Memories',          color: ['#EAE0F0', '#D6CCDC'] },
];

function GalleryCard({ item, index }) {
  return (
    <div
      className="gallery-card gallery-card-init relative overflow-hidden group cursor-pointer"
      style={{ aspectRatio: index === 0 || index === 3 ? '1 / 1.3' : '1 / 1' }}
    >
      {/* Placeholder gradient tile */}
      <div
        className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-108"
        style={{
          background: `linear-gradient(135deg, ${item.color[0]} 0%, ${item.color[1]} 100%)`,
          minHeight: 180,
          transform: 'scale(1)',
          transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      />

      {/* Hover gold overlay */}
      <motion.div
        className="absolute inset-0 flex items-end p-5 opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(to top, rgba(212,175,55,0.18) 0%, transparent 60%)',
          transition: 'opacity 0.4s ease',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(26,16,8,0.55)',
          }}
        >
          {item.label}
        </span>
      </motion.div>

      {/* Lock badge */}
      <div
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full opacity-50 group-hover:opacity-90 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(6px)' }}
        aria-label="Members only"
      >
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
          <rect x="1" y="5.5" width="9" height="7" rx="1.5" stroke="#C49B1A" strokeWidth="1.2" />
          <path d="M3.5 5.5V3.5a2 2 0 014 0v2" stroke="#C49B1A" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function GallerySection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);

  useGSAP(() => {
    // Header
    gsap.from(headRef.current, {
      scrollTrigger: { trigger: headRef.current, start: 'top 82%' },
      opacity: 0,
      y: 40,
      duration: 1.1,
      ease: 'power3.out',
      immediateRender: false,
    });

    // Batch stagger on cards
    ScrollTrigger.batch(
      sectionRef.current.querySelectorAll('.gallery-card'),
      {
        start: 'top 88%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity:  1,
            y:        0,
            scale:    1,
            stagger:  { each: 0.09 },
            duration: 1.0,
            ease:     'power3.out',
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
      style={{ background: '#FFFBF7', paddingTop: '7rem', paddingBottom: '8rem' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div ref={headRef} className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="gold-rule" />
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#C49B1A' }}
            >
              Visual Memory
            </span>
            <span className="gold-rule" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 400,
              color: '#1A1008',
              marginBottom: '1.2rem',
            }}
          >
            Moments That{' '}
            <em style={{ fontStyle: 'italic', color: '#C49B1A' }}>Matter</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'rgba(26,16,8,0.5)',
              maxWidth: 400,
              lineHeight: 1.75,
              margin: '0 auto',
            }}
          >
            A glimpse into the family gallery — full access for members.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-14">
          {GALLERY_ITEMS.map((item, i) => (
            <GalleryCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase transition-all duration-300"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(196,155,26,0.5)',
                color: '#C49B1A',
                letterSpacing: '0.12em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#C49B1A';
                e.currentTarget.style.color = '#FFF7ED';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#C49B1A';
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
