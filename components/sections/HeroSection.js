'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HERO_VIDEO =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/q_auto:eco/v1790068368/11904662_1280_720_60fps_nhnbbv.mp4';
const HERO_POSTER =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/so_2,w_1600,q_auto,f_jpg/v1790068368/11904662_1280_720_60fps_nhnbbv.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.05, delay: 0.2 + i * 0.18, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HeroSection() {
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
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      gsap.to(contentRef.current, {
        y: '10%',
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    });
    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden"
      style={{
        height: '100svh',
        minHeight: 520,
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
        preload="auto"
        poster={HERO_POSTER}
        aria-hidden="true"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(10,28,20,0.62) 0%, rgba(10,28,20,0.28) 38%, rgba(10,28,20,0.38) 68%, rgba(10,28,20,0.55) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(10,28,20,0.08) 0%, rgba(10,28,20,0.45) 100%)',
        }}
        aria-hidden="true"
      />

      <div
        ref={contentRef}
        className="relative flex h-full flex-col items-center justify-center text-center"
        style={{
          zIndex: 3,
          paddingLeft: 'max(1.25rem, env(safe-area-inset-left))',
          paddingRight: 'max(1.25rem, env(safe-area-inset-right))',
          paddingTop: 'max(4.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(4rem, env(safe-area-inset-bottom))',
        }}
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4 md:mb-7"
        >
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: 28,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(168, 196, 180,0.85))',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(0.58rem, 2.4vw, 0.7rem)',
              letterSpacing: 'clamp(0.22em, 1.8vw, 0.46em)',
              textTransform: 'uppercase',
              color: 'rgba(168, 196, 180,0.95)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            A Family Legacy
          </p>
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: 28,
              height: 1,
              background: 'linear-gradient(90deg, rgba(168, 196, 180,0.85), transparent)',
            }}
          />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(2.65rem, 12vw, 7.2rem)',
            fontWeight: 300,
            color: '#FFFFFF',
            letterSpacing: '-0.015em',
            lineHeight: 1.02,
            textShadow: '0 4px 40px rgba(0,0,0,0.28)',
            maxWidth: '16ch',
          }}
        >
          Perinba{' '}
          <em style={{ fontStyle: 'italic', color: '#A8C4B4', fontWeight: 300 }}>Vilas</em>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(0.65rem, 2.2vw, 0.88rem)',
            color: 'rgba(255,247,237,0.82)',
            letterSpacing: 'clamp(0.12em, 1.5vw, 0.28em)',
            textTransform: 'uppercase',
            maxWidth: 'min(480px, 92vw)',
            lineHeight: 1.7,
            marginTop: 'clamp(1rem, 3vw, 1.4rem)',
            marginBottom: 'clamp(1.75rem, 5vw, 2.75rem)',
            paddingInline: '0.25rem',
          }}
        >
          Generations · Heritage · Home
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <Link
            href="/login"
            className="inline-flex items-center uppercase transition-all duration-300"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(0.62rem, 2vw, 0.7rem)',
              letterSpacing: '0.2em',
              border: '1px solid rgba(255,247,237,0.88)',
              color: '#FFF7ED',
              background: 'transparent',
              padding: '0.85rem 1.75rem',
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,247,237,0.1)';
              e.currentTarget.style.borderColor = '#A8C4B4';
              e.currentTarget.style.color = '#A8C4B4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,247,237,0.88)';
              e.currentTarget.style.color = '#FFF7ED';
            }}
          >
            Enter Portal
          </Link>
        </motion.div>

        <motion.div
          className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
          style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.9 }}
          aria-hidden="true"
        >
          <span
            className="text-[9px] uppercase tracking-[0.42em]"
            style={{ color: 'rgba(255,247,237,0.5)' }}
          >
            Scroll
          </span>
          <motion.div
            className="w-px"
            style={{
              height: 28,
              background: 'linear-gradient(to bottom, rgba(168, 196, 180,0), rgba(168, 196, 180,0.75))',
            }}
            animate={{ scaleY: [0.45, 1, 0.45] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
