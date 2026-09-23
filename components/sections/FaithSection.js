'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyVideo from '@/components/ui/LazyVideo';
import { cloudinaryPoster, cloudinaryVideo } from '@/lib/media';

gsap.registerPlugin(ScrollTrigger);

const FAITH_PATH = 'v1790078111/17782995-hd_1280_720_60fps_x3h7d9.mp4';
const FAITH_VIDEO = cloudinaryVideo(FAITH_PATH, 1280);
const FAITH_POSTER = cloudinaryPoster(FAITH_PATH, 1400);

export default function FaithSection() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          toggleActions: 'play none none none',
          once: true,
        },
      },
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="faith"
      className="relative w-full overflow-hidden"
      style={{
        height: 'min(88svh, 820px)',
        minHeight: 420,
        background: '#0F2A1F',
      }}
    >
      <LazyVideo
        src={FAITH_VIDEO}
        poster={FAITH_POSTER}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(10,28,20,0.55) 0%, rgba(10,28,20,0.28) 40%, rgba(10,28,20,0.62) 100%)',
        }}
        aria-hidden="true"
      />

      <div
        ref={contentRef}
        className="relative flex h-full flex-col items-center justify-end text-center"
        style={{
          zIndex: 2,
          paddingLeft: 'max(1.25rem, env(safe-area-inset-left))',
          paddingRight: 'max(1.25rem, env(safe-area-inset-right))',
          paddingBottom: 'clamp(2.5rem, 8vw, 4.5rem)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(2rem, 6vw, 3.4rem)',
            fontWeight: 300,
            color: '#FFF7ED',
            lineHeight: 1.15,
            maxWidth: '16ch',
            textShadow: '0 2px 28px rgba(0,0,0,0.35)',
          }}
        >
          Held in prayer,{' '}
          <em style={{ fontStyle: 'italic', color: '#A8C4B4' }}>rooted in grace</em>
        </h2>
      </div>
    </section>
  );
}
