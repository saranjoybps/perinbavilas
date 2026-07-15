'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CloudLayer from '@/components/clouds/CloudLayer';

gsap.registerPlugin(ScrollTrigger);

const QUOTE = 'More than a name, Perinba Vilas is a legacy carried forward with love and togetherness.';
const QUOTE_WORDS = QUOTE.split(' ');
const GOLD_WORDS  = new Set(['Perinba', 'Vilas']);

const goldStyle = {
  background: 'linear-gradient(90deg, #C49B1A, #D4AF37)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 500,
};

export default function LegacyStatement() {
  const sectionRef = useRef(null);
  const glowRef    = useRef(null);

  useGSAP(() => {
    const words = sectionRef.current.querySelectorAll('.word-token');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger:      sectionRef.current,
        start:        'top top',
        end:          '+=1000',
        scrub:        1.5,
        pin:          true,
        pinSpacing:   true,
        anticipatePin: 1,
      },
    });

    tl.from(glowRef.current, { scale: 0.6, opacity: 0, duration: 0.25 }, 0);

    tl.from(words, {
      opacity:  0,
      y:        32,
      filter:   'blur(8px)',
      stagger:  { each: 0.062 },
      duration: 0.4,
      ease:     'power3.out',
    }, 0.1);
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="legacy"
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFF7ED 0%, #FFF5E4 50%, #FFFBF7 100%)',
      }}
    >
      {/* Cloud layers behind text */}
      <div className="absolute inset-0 pointer-events-none opacity-50" aria-hidden="true">
        <CloudLayer depth="far" />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden="true">
        <CloudLayer depth="mid" />
      </div>

      {/* Sunlight glow */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none"
        style={{
          top: '5%', right: '15%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse 60% 55% at 55% 38%, rgba(255,215,80,0.18) 0%, rgba(255,190,40,0.08) 45%, transparent 70%)',
          filter: 'blur(48px)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative text-center px-6 max-w-3xl mx-auto"
        style={{ zIndex: 1 }}
      >
        {/* Opening mark */}
        <span
          style={{
            fontFamily:   'var(--font-cormorant)',
            fontSize:     '5rem',
            lineHeight:   0.8,
            color:        'rgba(212,175,55,0.3)',
            display:      'block',
            marginBottom: '1.5rem',
          }}
          aria-hidden="true"
        >
          &ldquo;
        </span>

        <blockquote
          style={{
            fontFamily:   'var(--font-cormorant)',
            fontSize:     'clamp(1.7rem, 4vw, 3rem)',
            fontWeight:   300,
            fontStyle:    'italic',
            color:        '#1A1008',
            lineHeight:   1.6,
            marginBottom: '2.5rem',
          }}
        >
          {QUOTE_WORDS.map((word, i) => {
            const bare   = word.replace(/[.,!?]/g, '');
            const isGold = GOLD_WORDS.has(bare);
            return (
              <span
                key={i}
                className="word-token"
                style={{ marginRight: '0.3em', ...(isGold ? goldStyle : {}) }}
              >
                {word}
              </span>
            );
          })}
        </blockquote>

        {/* Gold rule + attribution */}
        <div className="flex flex-col items-center gap-4">
          <span className="gold-rule" />
          <span
            style={{
              fontFamily:    'var(--font-inter)',
              fontSize:      '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color:         'rgba(26,16,8,0.38)',
            }}
          >
            The Perinba Vilas Family
          </span>
        </div>
      </div>
    </section>
  );
}
