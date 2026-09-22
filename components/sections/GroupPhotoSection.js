'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PHOTO_ROWS = [
  {
    label: 'Ground Sitting — L to R',
    names:
      'Leelavathy, C. Thangadurai, C. Selvaraj, J.P. Rathnavathy, R. Inbaraj, D. Jeyapaul, G. Padmavathy, R. Perinbaraj',
  },
  {
    label: 'Sitting',
    names:
      'P. Suganthy Ammal, R. Janaki Ammal, P. Annamamal Perinbam, Y. Perinbam Nadar, R. Ranjitham Ammal, D. Pushpam Ammal, S. Vimalavathy',
  },
  {
    label: 'Standing — L to R',
    names:
      'P. Palpandian Nadar, P. Devaraj, C. Annamani Ammal, P. Duraipandian Nadar',
  },
];

export default function GroupPhotoSection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      '.group-photo-block',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
          once: true,
        },
      },
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="group-photo"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3rem, 8vw, 5.5rem)',
        paddingBottom: 'clamp(3rem, 8vw, 5.5rem)',
      }}
    >
      <div className="group-photo-block relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-12">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-3 flex items-center justify-center gap-4 sm:mb-5">
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ fontFamily: 'var(--font-inter)', color: '#0F2A1F' }}
            >
              A Shared Memory
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.85rem, 4.5vw, 3.2rem)',
              fontWeight: 400,
              color: '#0F2A1F',
              lineHeight: 1.18,
            }}
          >
            Family{' '}
            <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Gathering</em>
          </h2>
        </div>

        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/group-photo.png"
            alt="Perinba Vilas family group photograph"
            className="mx-auto h-auto w-full object-contain"
            style={{ boxShadow: '0 12px 36px rgba(15, 42, 31, 0.1)' }}
          />

          <figcaption className="mx-auto mt-6 max-w-3xl space-y-4 text-left sm:mt-8">
            {PHOTO_ROWS.map((row) => (
              <div key={row.label}>
                <p
                  className="text-[0.62rem] uppercase tracking-[0.22em]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: '#0F2A1F',
                    margin: 0,
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'clamp(0.8rem, 1.8vw, 0.92rem)',
                    lineHeight: 1.6,
                    color: 'rgba(15,42,31,0.58)',
                    margin: '0.35rem 0 0',
                  }}
                >
                  {row.names}
                </p>
              </div>
            ))}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
