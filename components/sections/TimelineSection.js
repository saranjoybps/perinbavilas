'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionDecor from '@/components/ui/SectionDecor';

gsap.registerPlugin(ScrollTrigger);

/**
 * Family journey cards (text only — no photos).
 * First entry = founding parents; rest = their seven children.
 */
const BRANCHES = [
  {
    id: 'root',
    role: 'The Founding Family',
    isRoot: true,
    name: 'Y. Perinbam Nadar',
    born: '1872',
    died: '16-05-1956',
    spouse: 'Annammal Perinbam',
    spouseBorn: '1886',
    spouseDied: '02-01-1949',
    children: 7,
  },
  {
    id: '1',
    role: 'Their Children',
    isRoot: false,
    name: 'C. Annamani Ammal',
    born: '1908',
    died: '1987',
    spouse: 'Chelliah Nadar',
    spouseRelation: 'Wife of',
    children: 4,
  },
  {
    id: '2',
    role: 'Their Children',
    isRoot: false,
    name: 'Annapoomani Ammal',
    born: '06-01-1910',
    died: '04-01-1993',
    spouse: 'Iyyadurai Nadar',
    spouseRelation: 'Wife of',
    children: 4,
  },
  {
    id: '3',
    role: 'Their Children',
    isRoot: false,
    name: 'P. Rajamani Abraham Nadar',
    born: '14-03-1913',
    died: '25-03-1972',
    spouse: 'R. Ranjitham Ammal',
    spouseRelation: 'Husband of',
    children: 5,
  },
  {
    id: '4',
    role: 'Their Children',
    isRoot: false,
    name: 'Jothirathinamani Ammal',
    born: '27-07-1916',
    died: '05-05-1982',
    spouse: 'Sathiavakku Nadar',
    spouseRelation: 'Wife of',
    children: 7,
  },
  {
    id: '5',
    role: 'Their Children',
    isRoot: false,
    name: 'P. Rajasigamani Nadar',
    born: '15-10-1917',
    died: '24-08-1981',
    spouse: 'R. Janaki Ammal & R. Alice Ammal',
    spouseRelation: 'Husband of',
    children: 6,
  },
  {
    id: '6',
    role: 'Their Children',
    isRoot: false,
    name: 'P. Palpandian Nadar',
    born: '22-11-1920',
    died: '10-08-1984',
    spouse: 'P. Suganthy Ammal',
    spouseRelation: 'Husband of',
    children: 9,
  },
  {
    id: '7',
    role: 'Their Children',
    isRoot: false,
    name: 'P. Duraipandian Nadar',
    born: '22-10-1922',
    died: '09-09-1997',
    spouse: 'D. Pushpam Ammal',
    spouseRelation: 'Husband of',
    children: 6,
  },
];

function BranchCard({ branch }) {
  const isRoot = branch.isRoot;

  const story = isRoot
    ? `${branch.name} was born in ${branch.born} and departed this life on ${branch.died}. Together with his beloved wife ${branch.spouse} — born in ${branch.spouseBorn} and laid to rest on ${branch.spouseDied} — they laid the foundation of the Perinba Vilas family and raised seven children who carried their name forward.`
    : `${branch.name} was born on ${branch.born} and passed away on ${branch.died}. ${
        branch.spouseRelation === 'Wife of'
          ? `She was the wife of ${branch.spouse}`
          : `He was the husband of ${branch.spouse}`
      }, and together they were blessed with ${branch.children} ${branch.children === 1 ? 'child' : 'children'}.`;

  return (
    <div
      className="glass-warm shadow-cloud p-7 sm:p-9 max-w-md w-full mx-auto md:mx-0"
      style={{
        borderLeft: isRoot
          ? '4px solid #0F2A1F'
          : '3px solid rgba(26, 61, 46, 0.45)',
        borderTop: '1px solid rgba(255,255,255,0.7)',
        background: isRoot
          ? 'linear-gradient(165deg, rgba(15,42,31,0.06) 0%, rgba(255,255,255,0.92) 55%)'
          : undefined,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: isRoot ? '#0F2A1F' : 'rgba(15,42,31,0.5)',
          display: 'block',
          marginBottom: '0.65rem',
        }}
      >
        {branch.role}
      </span>

      <h3
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: isRoot ? 'clamp(1.45rem, 3vw, 1.75rem)' : '1.45rem',
          fontWeight: 500,
          color: '#0F2A1F',
          marginBottom: '0.9rem',
          lineHeight: 1.25,
        }}
      >
        {branch.name}
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)',
          lineHeight: 1.7,
          color: 'rgba(15,42,31,0.72)',
          margin: 0,
        }}
      >
        {story}
      </p>
    </div>
  );
}

function TimelineItem({ branch, index }) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`timeline-item relative flex items-start gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}
    >
      <div className={`timeline-card flex-1 ${isEven ? 'md:flex md:justify-end' : ''}`}>
        <BranchCard branch={branch} />
      </div>

      <div
        className="timeline-node hidden md:flex items-center justify-center w-10 h-10 flex-shrink-0 z-10 self-start mt-8"
      >
        <div
          style={{
            width: branch.isRoot ? 18 : 14,
            height: branch.isRoot ? 18 : 14,
            borderRadius: '50%',
            background: '#1A3D2E',
            boxShadow: branch.isRoot
              ? '0 0 0 7px rgba(26, 61, 46,0.22), 0 0 24px rgba(26, 61, 46,0.35)'
              : '0 0 0 6px rgba(26, 61, 46,0.18), 0 0 20px rgba(26, 61, 46,0.3)',
          }}
        />
      </div>

      <div className="hidden md:block flex-1" />
    </div>
  );
}

export default function TimelineSection() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      lineRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 55%',
          end: 'bottom 85%',
          scrub: 1,
        },
      },
    );

    gsap.fromTo(
      '.timeline-header',
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.timeline-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      },
    );

    sectionRef.current.querySelectorAll('.timeline-item').forEach((item) => {
      const card = item.querySelector('.timeline-card');
      const node = item.querySelector('.timeline-node');

      gsap.fromTo(
        card,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
        },
      );

      if (node) {
        gsap.fromTo(
          node,
          { opacity: 0, scale: 0.7 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true,
            },
          },
        );
      }
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative overflow-hidden"
      style={{
        paddingTop: 'clamp(3.5rem, 8vw, 6.5rem)',
        paddingBottom: 'clamp(8.5rem, 28vw, 12rem)',
      }}
    >
      <SectionDecor
        position="bottom-left"
        size="lg"
        className="!w-[200px] sm:!w-[270px] md:!w-[320px] lg:!w-[400px] !bottom-0"
        style={{ transform: 'translate(-8%, 18%)', opacity: 0.58 }}
      />

      <div
        ref={lineRef}
        className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 5%, rgba(26, 61, 46,0.3) 20%, rgba(26, 61, 46,0.3) 80%, transparent 95%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12" style={{ zIndex: 1 }}>
        <div className="timeline-header mb-8 text-center sm:mb-12 md:mb-16">
          <h2
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
              fontWeight: 400,
              color: '#0F2A1F',
            }}
          >
            Our{' '}
            <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Journey</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              color: 'rgba(15,42,31,0.5)',
              maxWidth: 460,
              lineHeight: 1.7,
              margin: '1rem auto 0',
            }}
          >
            From the founding parents of Perinba Vilas to the seven children who carried their love and name into the years ahead.
          </p>
        </div>

        <div className="flex flex-col gap-7 sm:gap-10 md:gap-16">
          {BRANCHES.map((branch, i) => (
            <TimelineItem key={branch.id} branch={branch} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
