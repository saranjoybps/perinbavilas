'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MILESTONES = [
  {
    year:  'Origins',
    label: 'The Beginning',
    desc:  'Deep in the Tamil heartland, the Perinba Vilas family took root — a name built on faith, hard work, and deep community bonds.',
    color: '#EBF7FD',
  },
  {
    year:  'Growth',
    label: 'Branching Out',
    desc:  'Sons and daughters ventured into new cities and trades, carrying the family spirit wherever they settled, planting new roots.',
    color: '#F0F9FF',
  },
  {
    year:  'Expansion',
    label: 'Across the Land',
    desc:  'Marriages, celebrations, and milestones wove a rich tapestry — the family grew not just in number but in depth and story.',
    color: '#FFF7ED',
  },
  {
    year:  'Today',
    label: 'Modern Legacy',
    desc:  'Engineers, doctors, artists, farmers — one family across many professions, united by shared values and a common name.',
    color: '#F8FAFC',
  },
  {
    year:  'Future',
    label: 'Carrying Forward',
    desc:  'The next generation inherits not just a name, but a living legacy of resilience, love, and belonging.',
    color: '#FFFBF7',
  },
];

function TimelineItem({ m, index }) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`timeline-item relative flex items-start gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}
    >
      {/* Content card — even items right-align within their flex-1 to sit near centre line */}
      <div className={`timeline-card flex-1 ${isEven ? 'md:flex md:justify-end' : ''}`}>
        <div
          className="glass-warm shadow-cloud p-7 sm:p-9 max-w-md w-full mx-auto md:mx-0"
          style={{
            borderLeft: '3px solid rgba(212,175,55,0.5)',
            borderTop: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.7rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#C49B1A',
              display: 'block',
              marginBottom: '0.6rem',
            }}
          >
            {m.year}
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: '#1A1008',
              marginBottom: '0.75rem',
            }}
          >
            {m.label}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: 'rgba(26,16,8,0.58)',
            }}
          >
            {m.desc}
          </p>
        </div>
      </div>

      {/* Center node */}
      <div
        className="timeline-node hidden md:flex items-center justify-center w-10 h-10 flex-shrink-0 z-10 self-start mt-8"
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#D4AF37',
            boxShadow: '0 0 0 6px rgba(212,175,55,0.18), 0 0 20px rgba(212,175,55,0.3)',
          }}
        />
      </div>

      {/* Spacer */}
      <div className="hidden md:block flex-1" />
    </div>
  );
}

export default function TimelineSection() {
  const sectionRef = useRef(null);
  const lineRef    = useRef(null);

  useGSAP(() => {
    // Vertical line draw — scrubbed to section scroll progress
    gsap.from(lineRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start:   'top 55%',
        end:     'bottom 85%',
        scrub:   1.2,
      },
      scaleY:          0,
      transformOrigin: 'top center',
      ease:            'none',
      immediateRender: false,
    });

    // Header fade-up
    gsap.from('.timeline-header', {
      scrollTrigger: { trigger: '.timeline-header', start: 'top 82%' },
      opacity: 0,
      y: 40,
      duration: 1.1,
      ease: 'power3.out',
      immediateRender: false,
    });

    // Each item: alternating slide-in cards + node pop
    sectionRef.current.querySelectorAll('.timeline-item').forEach((item) => {
      const card = item.querySelector('.timeline-card');
      const node = item.querySelector('.timeline-node');

      gsap.from(card, {
        scrollTrigger: { trigger: item, start: 'top 86%' },
        y:               24,
        opacity:         0,
        duration:        0.85,
        ease:            'power2.out',
        immediateRender: false,
      });

      if (node) {
        gsap.from(node, {
          scrollTrigger:   { trigger: item, start: 'top 80%' },
          scale:           0,
          duration:        0.7,
          delay:           0.15,
          ease:            'back.out(2.5)',
          immediateRender: false,
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative overflow-hidden"
      style={{
        background:    '#FFF8F0',
        paddingTop:    '6.5rem',
        paddingBottom: '7rem',
      }}
    >
      {/* Vertical timeline line — desktop only, drawn via GSAP scrub */}
      <div
        ref={lineRef}
        className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 5%, rgba(212,175,55,0.3) 20%, rgba(212,175,55,0.3) 80%, transparent 95%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="timeline-header text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#C49B1A' }}
            >
              Through Time
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
              fontWeight: 400,
              color: '#1A1008',
            }}
          >
            Our{' '}
            <em style={{ fontStyle: 'italic', color: '#C49B1A' }}>Journey</em>
          </h2>
        </div>

        {/* Timeline items */}
        <div className="flex flex-col gap-10 md:gap-16">
          {MILESTONES.map((m, i) => (
            <TimelineItem key={m.year} m={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
