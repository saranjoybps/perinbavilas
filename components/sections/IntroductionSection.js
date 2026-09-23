'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function IntroductionSection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      '.intro-header, .intro-body, .intro-cta',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
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
      id="introduction"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3rem, 8vw, 6rem)',
        paddingBottom: 'clamp(5rem, 14vw, 9rem)',
      }}
    >
      {/* Left floral — keep soft so body text stays readable */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/decorative-2.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-1 left-0 z-0 w-[145px] sm:w-[220px] md:w-[320px] lg:w-[390px]"
        style={{
          opacity: 0.35,
          transform: 'translate(-6%, -2%) scaleX(-1)',
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/book.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-0 right-0 z-0 w-[130px] sm:w-[200px] md:w-[260px] lg:w-[320px]"
        style={{
          opacity: 0.82,
          transform: 'translate(6%, 4%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-12" style={{ zIndex: 1 }}>
        <div className="intro-header mb-8 text-center sm:mb-10">
          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.85rem, 4.5vw, 3.2rem)',
              fontWeight: 400,
              color: '#0F2A1F',
              lineHeight: 1.18,
            }}
          >
            A Family{' '}
            <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Introduction</em>
          </h2>
        </div>

        <div
          className="intro-body space-y-5 text-center sm:space-y-6"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)',
            lineHeight: 1.75,
            color: 'rgba(15,42,31,0.62)',
          }}
        >
          <p>
            Yesuvadiyan Nadar (b. 1845) lived in Semmarikulam near Megnanapuram,
            Tuticorin. Around 1875, after embracing Christianity, he settled in
            Adayal — a name drawn from <em>adaithal</em>, meaning settlement —
            where a church was raised and faith took root.
          </p>
          <p>
            He had three children: Perinbam Nadar (born Perumal Nadar), Packiam
            Ammal, and Abraham Nadar. This family record follows the line of
            Perinbam Nadar, whose wife Annammal was the daughter of Abraham
            Vathiar of Adayal.
          </p>
          <p>
            Together with Manickavasagam Nadar, they built YPM — Yesuvadiyan,
            Perinbam &amp; Manickavasagam — a respected paper and stationery
            house in Colombo. The same spirit later grew into the Perinba Vilas
            family of today, rooted in one home, one church, and one shared name.
          </p>
        </div>

        <div className="intro-cta relative mt-10 flex justify-center sm:mt-12" style={{ zIndex: 2 }}>
          <Link
            href="/introduction"
            className="inline-block px-8 py-3.5 text-xs tracking-widest uppercase transition-all duration-300"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid rgba(15, 42, 31, 0.5)',
              color: '#0F2A1F',
              textDecoration: 'none',
              letterSpacing: '0.14em',
              background: 'rgba(255,255,255,0.92)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0F2A1F';
              e.currentTarget.style.color = '#FFF7ED';
              e.currentTarget.style.borderColor = '#0F2A1F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
              e.currentTarget.style.color = '#0F2A1F';
              e.currentTarget.style.borderColor = 'rgba(15, 42, 31, 0.5)';
            }}
          >
            Read Full Introduction
          </Link>
        </div>
      </div>
    </section>
  );
}
