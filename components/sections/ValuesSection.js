'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CloudLayer from '@/components/clouds/CloudLayer';

gsap.registerPlugin(ScrollTrigger);

const VALUES = [
  {
    number: '01',
    name:   'Unity',
    desc:   'Every branch of our family tree grows stronger because it stays connected to its roots.',
    icon:   '⬡',
    accent: '#D4AF37',
  },
  {
    number: '02',
    name:   'Growth',
    desc:   'Each generation builds upon the wisdom and sacrifice of those who came before.',
    icon:   '◇',
    accent: '#C49B1A',
  },
  {
    number: '03',
    name:   'Tradition',
    desc:   'Our rituals, stories, and celebrations are the threads that weave us into one.',
    icon:   '◈',
    accent: '#D4AF37',
  },
  {
    number: '04',
    name:   'Strength',
    desc:   'In times of hardship, we have always stood together — our resilience is our legacy.',
    icon:   '◉',
    accent: '#C49B1A',
  },
  {
    number: '05',
    name:   'Future',
    desc:   'We honour the past while nurturing the next generation to carry our legacy forward.',
    icon:   '◆',
    accent: '#D4AF37',
  },
];

export default function ValuesSection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Header fades up
    gsap.from('.values-header', {
      scrollTrigger: { trigger: '.values-header', start: 'top 82%' },
      opacity: 0,
      y: 44,
      duration: 1.1,
      ease: 'power3.out',
      immediateRender: false,
    });

    // Each card gets its own ScrollTrigger — true one-by-one cascade
    sectionRef.current.querySelectorAll('.value-cascade-card').forEach((card, i) => {
      const fromLeft = i % 2 === 0;
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        x:               fromLeft ? -90 : 90,
        opacity:         0,
        scale:           0.93,
        filter:          'blur(6px)',
        duration:        1.0,
        ease:            'power3.out',
        immediateRender: false,
      });
      const bar = card.querySelector('.value-accent-bar');
      if (bar) {
        gsap.from(bar, {
          scrollTrigger: { trigger: card, start: 'top 85%' },
          scaleY:          0,
          transformOrigin: 'top center',
          duration:        0.9,
          delay:           0.28,
          ease:            'expo.out',
          immediateRender: false,
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="values"
      className="relative overflow-hidden"
      style={{ background: '#F8FAFC', paddingTop: '7rem', paddingBottom: '8rem' }}
    >
      {/* Soft cloud wisps in background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true">
        <CloudLayer depth="far" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" style={{ zIndex: 1 }}>
        {/* Section header */}
        <div className="values-header text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="gold-rule" />
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#C49B1A' }}
            >
              What We Stand For
            </span>
            <span className="gold-rule" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 400,
              color: '#1A1008',
              lineHeight: 1.18,
            }}
          >
            Our Family{' '}
            <em style={{ fontStyle: 'italic', color: '#C49B1A' }}>Values</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              color: 'rgba(26,16,8,0.5)',
              maxWidth: 460,
              lineHeight: 1.75,
              margin: '1.25rem auto 0',
            }}
          >
            Five principles passed down through generations — the invisible threads that hold
            the Perinba Vilas family together across time.
          </p>
        </div>

        {/* Cascading cards — each fires its own ScrollTrigger as it enters viewport */}
        <div className="flex flex-col gap-5">
          {VALUES.map((v, i) => {
            const fromLeft = i % 2 === 0;
            return (
              <div
                key={v.name}
                className="value-cascade-card glass-warm shadow-cloud"
                style={{
                  display:     'flex',
                  alignItems:  'stretch',
                  borderTop:   `2px solid ${v.accent}33`,
                  marginLeft:  fromLeft ? 0 : 'clamp(0px, 5vw, 72px)',
                  marginRight: fromLeft ? 'clamp(0px, 5vw, 72px)' : 0,
                }}
              >
                {/* Animated gold accent bar */}
                <div
                  className="value-accent-bar hidden sm:block flex-shrink-0"
                  style={{
                    width:      3,
                    background: `linear-gradient(to bottom, ${v.accent}, ${v.accent}44)`,
                  }}
                />

                {/* Large background number */}
                <div
                  className="hidden md:flex items-center justify-center flex-shrink-0"
                  style={{ width: 110, paddingLeft: 24, paddingRight: 24 }}
                >
                  <span
                    style={{
                      fontFamily:  'var(--font-cormorant)',
                      fontSize:    '5rem',
                      fontWeight:  300,
                      lineHeight:  1,
                      color:       `${v.accent}28`,
                      userSelect:  'none',
                    }}
                  >
                    {v.number}
                  </span>
                </div>

                <div
                  className="hidden md:block w-px flex-shrink-0 self-stretch my-8"
                  style={{ background: `${v.accent}1A` }}
                />

                {/* Icon + name */}
                <div
                  className="flex flex-col justify-center flex-shrink-0 px-8 py-8"
                  style={{ minWidth: 'clamp(130px, 16vw, 200px)' }}
                >
                  <span style={{ fontSize: 20, color: v.accent, marginBottom: 10 }}>
                    {v.icon}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize:   'clamp(1.25rem, 2.2vw, 1.65rem)',
                      fontWeight: 600,
                      color:      '#1A1008',
                      lineHeight: 1.2,
                    }}
                  >
                    {v.name}
                  </h3>
                  {/* Number visible on mobile */}
                  <span
                    className="md:hidden mt-2"
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize:   '2rem',
                      fontWeight: 300,
                      color:      `${v.accent}38`,
                      lineHeight: 1,
                    }}
                  >
                    {v.number}
                  </span>
                </div>

                <div
                  className="hidden sm:block w-px flex-shrink-0 self-stretch my-8"
                  style={{ background: `${v.accent}1A` }}
                />

                {/* Description */}
                <div className="flex items-center flex-1 px-8 py-8">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize:   'clamp(0.875rem, 1.3vw, 1rem)',
                      lineHeight: 1.85,
                      color:      'rgba(26,16,8,0.6)',
                      maxWidth:   560,
                    }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
