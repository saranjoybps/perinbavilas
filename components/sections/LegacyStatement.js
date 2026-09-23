'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LazyVideo from '@/components/ui/LazyVideo';
import { cloudinaryPoster, cloudinaryVideo } from '@/lib/media';

gsap.registerPlugin(ScrollTrigger);

const LEGACY_PATH = 'v1790077273/7316616-uhd_3840_2160_25fps_hefohj.mp4';
const LEGACY_VIDEO = cloudinaryVideo(LEGACY_PATH, 1280);
const LEGACY_POSTER = cloudinaryPoster(LEGACY_PATH, 1400);

const QUOTE = 'More than a name, Perinba Vilas is a legacy carried forward with love and togetherness.';
const QUOTE_WORDS = QUOTE.split(' ');
const ACCENT_WORDS = new Set(['Perinba', 'Vilas']);

const accentStyle = {
  color: '#A8C4B4',
  fontWeight: 500,
};

export default function LegacyStatement() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = section.querySelectorAll('.word-token');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=1000',
        scrub: 1.2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Match pin-spacer to section so scroll-back never flashes white/empty green
        onRefresh: (self) => {
          const spacer = self.pin?.parentNode;
          if (spacer && spacer.classList?.contains('pin-spacer')) {
            spacer.style.background = '#0F2A1F';
          }
        },
      },
    });

    tl.from(
      words,
      {
        opacity: 0,
        y: 24,
        stagger: { each: 0.055 },
        duration: 0.35,
        ease: 'power2.out',
      },
      0.05,
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="legacy"
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        minHeight: '100svh',
        background: '#0F2A1F',
        zIndex: 5,
      }}
    >
      <LazyVideo
        src={LEGACY_VIDEO}
        poster={LEGACY_POSTER}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(10,28,20,0.72) 0%, rgba(10,28,20,0.55) 45%, rgba(10,28,20,0.78) 100%)',
        }}
        aria-hidden="true"
      />

      <div
        className="relative text-center px-6 max-w-3xl mx-auto"
        style={{ zIndex: 2 }}
      >
        <span
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '5rem',
            lineHeight: 0.8,
            color: 'rgba(168,196,180,0.35)',
            display: 'block',
            marginBottom: '1.5rem',
          }}
          aria-hidden="true"
        >
          &ldquo;
        </span>

        <blockquote
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(1.35rem, 4vw, 3rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#FFF7ED',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            textShadow: '0 2px 28px rgba(0,0,0,0.35)',
          }}
        >
          {QUOTE_WORDS.map((word, i) => {
            const bare = word.replace(/[.,!?]/g, '');
            const isAccent = ACCENT_WORDS.has(bare);
            return (
              <span
                key={i}
                className="word-token"
                style={{ marginRight: '0.3em', ...(isAccent ? accentStyle : {}) }}
              >
                {word}
              </span>
            );
          })}
        </blockquote>

        <div className="flex flex-col items-center gap-4">
          <span
            style={{
              display: 'block',
              width: 56,
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(168,196,180,0.85), transparent)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(255,247,237,0.55)',
            }}
          >
            The Perinba Vilas Family
          </span>
        </div>
      </div>
    </section>
  );
}
