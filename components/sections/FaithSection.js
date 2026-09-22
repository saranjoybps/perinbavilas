'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FAITH_VIDEO =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/q_auto:eco/v1790078111/17782995-hd_1280_720_60fps_x3h7d9.mp4';
const FAITH_POSTER =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/so_2,w_1600,q_auto,f_jpg/v1790078111/17782995-hd_1280_720_60fps_x3h7d9.jpg';

export default function FaithSection() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    const tryPlay = () => {
      video.play().catch(() => {});
    };
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    return () => {
      video.removeEventListener('loadeddata', tryPlay);
      document.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  useGSAP(() => {
    gsap.from(contentRef.current, {
      scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      opacity: 0,
      y: 28,
      duration: 1.1,
      ease: 'power3.out',
      immediateRender: false,
    });
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
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0, pointerEvents: 'none' }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={FAITH_POSTER}
        aria-hidden="true"
      >
        <source src={FAITH_VIDEO} type="video/mp4" />
      </video>

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
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(0.58rem, 2vw, 0.68rem)',
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
            color: 'rgba(168,196,180,0.9)',
            marginBottom: '0.85rem',
          }}
        >
          Our Faith
        </p>
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
