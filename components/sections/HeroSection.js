'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CloudLayer from '@/components/clouds/CloudLayer';
import FloatingParticles from '@/components/clouds/FloatingParticles';

gsap.registerPlugin(ScrollTrigger);

const fadeUp = {
  hidden: { opacity: 0, y: 36, filter: 'blur(4px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.1, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef(null);
  const farRef     = useRef(null);
  const midRef     = useRef(null);
  const nearRef    = useRef(null);
  const sunRef     = useRef(null);
  const raysRef    = useRef(null);
  const contentRef = useRef(null);

  // Mouse parallax — x-axis only to avoid conflicting with scroll-based y parallax
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const xFar  = gsap.quickTo(farRef.current,  'x', { duration: 1.2, ease: 'power2.out' });
    const xMid  = gsap.quickTo(midRef.current,  'x', { duration: 0.9, ease: 'power2.out' });
    const xNear = gsap.quickTo(nearRef.current, 'x', { duration: 0.6, ease: 'power2.out' });

    const onMove = (e) => {
      const { left, width } = section.getBoundingClientRect();
      const xPct = ((e.clientX - left) / width - 0.5) * 2; // -1 to 1
      xFar(xPct * 18);
      xMid(xPct * 10);
      xNear(xPct * 5);
    };

    const onLeave = () => {
      xFar(0);
      xMid(0);
      xNear(0);
    };

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start:   'top top',
        end:     'bottom top',
        scrub:   1.4,
      },
    });

    // Parallax cloud layers — deeper depth = more travel
    tl.to(farRef.current,  { y: '-40%', ease: 'none' }, 0)
      .to(midRef.current,  { y: '-22%', ease: 'none' }, 0)
      .to(nearRef.current, { y: '-12%', ease: 'none' }, 0)
      .to(sunRef.current,   { y: '-20%', opacity: 0.5, ease: 'none' }, 0)
      .to(raysRef.current,   { y: '-20%', ease: 'none' }, 0)
      .to(contentRef.current, { y: '14%', opacity: 0.2, ease: 'none' }, 0);

    // Ambient scale breathing — runs on loop, no conflict with scroll y or mouse x
    gsap.to(farRef.current,  { scale: 1.08, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(midRef.current,  { scale: 1.05, duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    gsap.to(nearRef.current, { scale: 1.03, duration: 8,  ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
    gsap.to(sunRef.current,  { scale: 1.05, duration: 8,  ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
    // God rays slowly sweep ±8° to simulate shifting sunlight
    gsap.to(raysRef.current, { rotation: 8, duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -5 });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 680 }}
    >
      {/* ── Sky gradient background ── */}
      <div className="absolute inset-0 sky-gradient" />

      {/* ── Animated Sun ── */}
      <div
        ref={sunRef}
        className="absolute pointer-events-none"
        style={{ top: '7%', right: '13%', zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Outer atmospheric haze */}
        <div style={{
          position: 'absolute',
          width: 560, height: 560,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,100,0.18) 0%, rgba(255,200,50,0.10) 40%, transparent 70%)',
          filter: 'blur(48px)',
          animation: 'sunPulse 8s ease-in-out infinite',
        }} />
        {/* Mid corona */}
        <div style={{
          position: 'absolute',
          width: 220, height: 220,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,150,0.35) 0%, rgba(255,210,60,0.18) 55%, transparent 80%)',
          filter: 'blur(10px)',
          animation: 'sunPulse 8s ease-in-out infinite',
          animationDelay: '-1s',
        }} />
        {/* Rotating rays */}
        <div style={{
          position: 'absolute',
          width: 0, height: 0,
          top: '50%', left: '50%',
          animation: 'sunRaysSpin 60s linear infinite',
        }}>
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((deg, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 2,
              height: i % 2 === 0 ? 110 : 80,
              marginLeft: -1,
              marginTop: 52,
              transformOrigin: '50% 0%',
              transform: `rotate(${deg}deg)`,
              background: `linear-gradient(to bottom, rgba(255,220,60,${i % 2 === 0 ? '0.55' : '0.35'}), transparent)`,
              borderRadius: 2,
            }} />
          ))}
        </div>
        {/* Sun disc */}
        <div style={{
          position: 'absolute',
          width: 92, height: 92,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 38%, #FFFDE0 0%, #FFE040 35%, #FFC200 65%, #FFB300 100%)',
          animation: 'sunDiscGlow 8s ease-in-out infinite',
        }} />
      </div>

      {/* ── Cloud layers — oversized so parallax has travel room ── */}
      <div ref={farRef}  className="absolute pointer-events-none" style={{ top: '-20%', left: 0, right: 0, height: '140%', zIndex: 1 }}>
        <CloudLayer depth="far" />
      </div>

      {/* ── God rays — light shafts sweeping from sun through clouds ── */}
      <div
        ref={raysRef}
        className="absolute pointer-events-none"
        style={{ top: '7%', right: '13%', width: 0, height: 0, zIndex: 2 }}
        aria-hidden="true"
      >
        {[
          { angle: -44, w: 160, h: '118vh', op: 0.12, dur: 9  },
          { angle: -30, w:  85, h: '108vh', op: 0.08, dur: 12 },
          { angle: -16, w: 130, h: '112vh', op: 0.14, dur: 8  },
          { angle:  -4, w:  65, h:  '96vh', op: 0.09, dur: 13 },
          { angle:  10, w: 150, h: '115vh', op: 0.13, dur: 10 },
          { angle:  24, w:  80, h: '104vh', op: 0.08, dur: 14 },
          { angle:  40, w: 120, h: '110vh', op: 0.11, dur: 9  },
          { angle:  56, w:  55, h:  '90vh', op: 0.07, dur: 16 },
          { angle:  70, w:  95, h:  '98vh', op: 0.09, dur: 11 },
        ].map(({ angle, w, h, op, dur }, i) => (
          <div
            key={i}
            style={{
              position:        'absolute',
              width:           `${w}px`,
              height:          h,
              top:             0,
              left:            -w / 2,
              transformOrigin: 'top center',
              transform:       `rotate(${angle}deg)`,
              background:      `linear-gradient(to bottom, rgba(255,242,150,${(op * 2.2).toFixed(2)}) 0%, rgba(255,228,80,${op.toFixed(2)}) 18%, rgba(255,210,50,${(op * 0.4).toFixed(2)}) 55%, transparent 82%)`,
              filter:          'blur(24px)',
              animation:       `godRaySweep ${dur}s ease-in-out infinite`,
              animationDelay:  `${(i * -2.3).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      <div ref={midRef}  className="absolute pointer-events-none" style={{ top: '-15%', left: 0, right: 0, height: '130%', zIndex: 3 }}>
        <CloudLayer depth="mid" />
      </div>
      <div ref={nearRef} className="absolute pointer-events-none" style={{ top: '-10%', left: 0, right: 0, height: '120%', zIndex: 4 }}>
        <CloudLayer depth="near" />
      </div>

      {/* ── Floating dust particles ── */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        <FloatingParticles count={22} />
      </div>

      {/* ── Bottom fade-out gradient ── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '30%',
          background: 'linear-gradient(to bottom, transparent, rgba(248,250,252,0.94))',
          zIndex: 5,
        }}
        aria-hidden="true"
      />

      {/* ── Hero content ── */}
      <div
        ref={contentRef}
        className="relative flex flex-col items-center justify-center h-full text-center px-6"
        style={{ zIndex: 6 }}
      >
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="gold-rule" />
          <span
            className="text-xs tracking-[0.45em] uppercase"
            style={{ fontFamily: 'var(--font-inter)', color: '#C49B1A' }}
          >
            Est. Generations Past
          </span>
          <span className="gold-rule" />
        </motion.div>

        {/* Main title */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(3.2rem, 9vw, 8rem)',
            fontWeight: 300,
            color: '#1A1008',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
          }}
        >
          Perinba{' '}
          <em
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(135deg, #C49B1A 0%, #D4AF37 50%, #E8CA60 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Vilas
          </em>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
            color: 'rgba(26,16,8,0.55)',
            maxWidth: 480,
            lineHeight: 1.75,
            marginTop: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          A legacy carried through generations with unity, warmth, and tradition.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <motion.a
            href="#legacy"
            className="inline-flex items-center gap-3 px-8 py-3.5 text-sm tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              background: 'rgba(26,16,8,0.88)',
              color: '#FFF7ED',
              letterSpacing: '0.12em',
              backdropFilter: 'blur(8px)',
            }}
            whileHover={{ scale: 1.03, background: 'rgba(26,16,8,1)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            Explore Legacy
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.a>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(196,155,26,0.55)',
                color: '#C49B1A',
                letterSpacing: '0.12em',
                backdropFilter: 'blur(8px)',
                background: 'rgba(255,255,255,0.38)',
              }}
            >
              Member Login
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          aria-hidden="true"
        >
          <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: 'rgba(26,16,8,0.3)' }}>
            Scroll
          </span>
          <motion.div
            className="w-px bg-gradient-to-b from-transparent"
            style={{ height: 40, background: 'linear-gradient(to bottom, rgba(196,155,26,0), rgba(196,155,26,0.5))' }}
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
