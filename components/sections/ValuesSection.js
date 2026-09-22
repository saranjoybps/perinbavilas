'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionDecor from '@/components/ui/SectionDecor';
gsap.registerPlugin(ScrollTrigger);

const VALUES = [
  {
    number: '01',
    name:   'Unity',
    desc:   'Every branch of our family tree grows stronger because it stays connected to its roots.',
    icon:   '⬡',
    accent: '#1A3D2E',
  },
  {
    number: '02',
    name:   'Growth',
    desc:   'Each generation builds upon the wisdom and sacrifice of those who came before.',
    icon:   '◇',
    accent: '#0F2A1F',
  },
  {
    number: '03',
    name:   'Tradition',
    desc:   'Our rituals, stories, and celebrations are the threads that weave us into one.',
    icon:   '◈',
    accent: '#1A3D2E',
  },
  {
    number: '04',
    name:   'Strength',
    desc:   'In times of hardship, we have always stood together — our resilience is our legacy.',
    icon:   '◉',
    accent: '#0F2A1F',
  },
  {
    number: '05',
    name:   'Future',
    desc:   'We honour the past while nurturing the next generation to carry our legacy forward.',
    icon:   '◆',
    accent: '#1A3D2E',
  },
];

export default function ValuesSection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.from('.values-header', {
      scrollTrigger: { trigger: '.values-header', start: 'top 82%' },
      opacity: 0,
      y: 44,
      duration: 1.1,
      ease: 'power3.out',
      immediateRender: false,
    });

    sectionRef.current.querySelectorAll('.value-cascade-card').forEach((card) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%' },
        y: 28,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        immediateRender: false,
      });
      const bar = card.querySelector('.value-accent-bar');
      if (bar) {
        gsap.from(bar, {
          scrollTrigger: { trigger: card, start: 'top 85%' },
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 0.9,
          delay: 0.28,
          ease: 'expo.out',
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
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3rem, 8vw, 6.5rem)',
        paddingBottom: 'clamp(3rem, 8vw, 7rem)',
      }}
    >
      <SectionDecor position="top-right" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12" style={{ zIndex: 1 }}>
        <div className="values-header mb-8 text-center sm:mb-12 md:mb-16">
          <div className="mb-3 flex items-center justify-center gap-4 sm:mb-5">
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#0F2A1F' }}
            >
              What We Stand For
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.85rem, 4.5vw, 3.4rem)',
              fontWeight: 400,
              color: '#0F2A1F',
              lineHeight: 1.18,
            }}
          >
            Our Family{' '}
            <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Values</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(0.88rem, 2.4vw, 1.05rem)',
              color: 'rgba(15,42,31,0.55)',
              maxWidth: 440,
              lineHeight: 1.65,
              margin: '0.85rem auto 0',
              paddingInline: '0.25rem',
            }}
          >
            Five principles passed down through generations — the invisible threads that hold
            the Perinba Vilas family together across time.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          {VALUES.map((v, i) => {
            const fromLeft = i % 2 === 0;
            return (
              <div
                key={v.name}
                className={[
                  'value-cascade-card glass-warm shadow-cloud flex flex-col sm:flex-row',
                  fromLeft ? 'sm:mr-10 md:mr-16 lg:mr-[72px]' : 'sm:ml-10 md:ml-16 lg:ml-[72px]',
                ].join(' ')}
                style={{
                  alignItems: 'stretch',
                  borderTop: `2px solid ${v.accent}33`,
                }}
              >
                <div
                  className="value-accent-bar hidden sm:block flex-shrink-0"
                  style={{
                    width: 3,
                    background: `linear-gradient(to bottom, ${v.accent}, ${v.accent}44)`,
                  }}
                />

                <div
                  className="hidden md:flex flex-shrink-0 items-center justify-center"
                  style={{ width: 110, paddingLeft: 24, paddingRight: 24 }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '5rem',
                      fontWeight: 300,
                      lineHeight: 1,
                      color: `${v.accent}28`,
                      userSelect: 'none',
                    }}
                  >
                    {v.number}
                  </span>
                </div>

                <div
                  className="my-8 hidden w-px flex-shrink-0 self-stretch md:block"
                  style={{ background: `${v.accent}1A` }}
                />

                {/* Title row — compact on mobile */}
                <div className="flex flex-shrink-0 flex-col justify-center px-5 pb-2 pt-5 sm:min-w-[130px] sm:px-8 sm:py-7 md:min-w-[200px]">
                  <div className="mb-1.5 flex items-center gap-3 sm:mb-2.5 sm:block">
                    <span
                      className="text-[18px] sm:mb-2.5 sm:block sm:text-[20px]"
                      style={{ color: v.accent }}
                    >
                      {v.icon}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)',
                        fontWeight: 600,
                        color: '#0F2A1F',
                        lineHeight: 1.2,
                      }}
                    >
                      {v.name}
                    </h3>
                    <span
                      className="ml-auto sm:hidden"
                      style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '1.35rem',
                        fontWeight: 300,
                        color: `${v.accent}40`,
                        lineHeight: 1,
                      }}
                    >
                      {v.number}
                    </span>
                  </div>
                </div>

                <div
                  className="my-8 hidden w-px flex-shrink-0 self-stretch sm:block"
                  style={{ background: `${v.accent}1A` }}
                />

                <div className="flex flex-1 items-center px-5 pb-5 pt-1 sm:px-8 sm:py-7">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'clamp(0.84rem, 1.3vw, 1rem)',
                      lineHeight: 1.7,
                      color: 'rgba(15,42,31,0.62)',
                      maxWidth: 560,
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
