'use client';

import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Values',   href: '#values'   },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Gallery',  href: '#gallery'  },
  { label: 'Legacy',   href: '#legacy'   },
  { label: 'Contact',  href: '#contact'  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: '#F0E8D8',
        borderTop: '1px solid rgba(212,175,55,0.18)',
        paddingTop: '4rem',
        paddingBottom: '2.5rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="block mb-4" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.7rem',
                  fontWeight: 400,
                  color: '#C49B1A',
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
                  color: 'rgba(26,16,8,0.4)',
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
                color: 'rgba(26,16,8,0.5)',
                lineHeight: 1.8,
                maxWidth: 240,
              }}
            >
              A living legacy of unity, warmth, and tradition — shared across generations.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(196,155,26,0.7)',
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
                      color: 'rgba(26,16,8,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = '#C49B1A')}
                    onMouseLeave={(e) => (e.target.style.color = 'rgba(26,16,8,0.5)')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(196,155,26,0.7)',
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
                      color: 'rgba(26,16,8,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = '#C49B1A')}
                    onMouseLeave={(e) => (e.target.style.color = 'rgba(26,16,8,0.5)')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Motto */}
            <div style={{ borderLeft: '2px solid rgba(212,175,55,0.35)', paddingLeft: '1rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  color: 'rgba(196,155,26,0.75)',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Together in roots, united in spirit.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(212,175,55,0.15)' }}
        >
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.35)' }}>
            © {year} Perinba Vilas Family Heritage. All rights reserved.
          </p>
          <span className="gold-rule" style={{ width: 40 }} />
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.28)' }}>
            A family, forever connected.
          </p>
        </div>
      </div>
    </footer>
  );
}
