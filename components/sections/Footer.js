'use client';

import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Values',   href: '#values'   },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Gallery',  href: '#gallery'  },
  { label: 'Legacy',   href: '#legacy'   },
  { label: 'Contact',  href: '#contact'  },
  { label: 'Faith',    href: '#faith'    },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #0F2A1F 0%, #163528 55%, #1A3D2E 100%)',
        borderTop: '1px solid rgba(15, 42, 31,0.22)',
        paddingTop: '4rem',
        paddingBottom: '2.5rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/" className="block mb-4" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.7rem',
                  fontWeight: 400,
                  color: '#A8C4B4',
                  display: 'block',
                }}
              >
                Perinba Vilas
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,247,237,0.45)',
                  display: 'block',
                  marginTop: 4,
                }}
              >
                Family Legacy
              </span>
            </Link>
            <span className="gold-rule block mb-5" style={{ marginLeft: 0 }} />
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.825rem',
                color: 'rgba(255,247,237,0.62)',
                lineHeight: 1.8,
                maxWidth: 240,
              }}
            >
              A living legacy of unity, warmth, and tradition — shared across generations.
            </p>
          </div>

          <div>
            <h4
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(168, 196, 180,0.85)',
                marginBottom: '1.4rem',
              }}
            >
              Explore
            </h4>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: 'rgba(255,247,237,0.65)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = '#A8C4B4')}
                    onMouseLeave={(e) => (e.target.style.color = 'rgba(255,247,237,0.65)')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(168, 196, 180,0.85)',
                marginBottom: '1.4rem',
              }}
            >
              Family Members
            </h4>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                { label: 'Sign In',       href: '/login'            },
                { label: 'Dashboard',     href: '/dashboard'        },
                { label: 'Family Portal', href: '/dashboard/family' },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: 'rgba(255,247,237,0.65)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = '#A8C4B4')}
                    onMouseLeave={(e) => (e.target.style.color = 'rgba(255,247,237,0.65)')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div style={{ borderLeft: '2px solid rgba(168, 196, 180,0.4)', paddingLeft: '1rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  color: 'rgba(168, 196, 180,0.85)',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Together in roots, united in spirit.&rdquo;
              </p>
            </div>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(168, 196, 180,0.18)' }}
        >
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,247,237,0.4)' }}>
            © {year} Perinba Vilas Family Heritage. All rights reserved.
          </p>
          <span className="gold-rule" style={{ width: 40 }} />
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,247,237,0.35)' }}>
            A family, forever connected.
          </p>
        </div>
      </div>
    </footer>
  );
}
