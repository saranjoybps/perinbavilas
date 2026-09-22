'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionDecor from '@/components/ui/SectionDecor';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const sectionRef = useRef(null);
  const leftRef    = useRef(null);
  const rightRef   = useRef(null);
  const [form,   setForm]   = useState({ name: '', email: '' });
  const [status, setStatus] = useState('idle');

  useGSAP(() => {
    gsap.from(Array.from(leftRef.current.children), {
      scrollTrigger: { trigger: leftRef.current, start: 'top 80%' },
      opacity: 0,
      y:       40,
      stagger: 0.12,
      duration: 1.0,
      ease:    'power3.out',
      immediateRender: false,
    });

    gsap.from(rightRef.current, {
      scrollTrigger: { trigger: rightRef.current, start: 'top 78%' },
      opacity: 0,
      y:       24,
      duration: 0.9,
      ease:    'power3.out',
      immediateRender: false,
    });
  }, { scope: sectionRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setStatus('sent');
      setForm({ name: '', email: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(26, 61, 46,0.22)',
    padding: '0.85rem 1rem',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.875rem',
    color: '#0F2A1F',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3.5rem, 7vw, 5.5rem)',
        paddingBottom: 'clamp(3.5rem, 7vw, 5.5rem)',
      }}
    >
      <SectionDecor position="top-right" />

      {/* Soft glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', left: '5%',
          width: 500, height: 400,
          background: 'radial-gradient(ellipse at 40% 40%, rgba(26, 61, 46,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <div
        ref={sectionRef}
        className="relative mx-auto max-w-7xl px-6 lg:px-12"
        style={{ zIndex: 1 }}
      >
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12 lg:items-stretch lg:gap-14">
          {/* Left copy */}
          <div ref={leftRef} className="flex h-full flex-col">
            <div className="mb-5 flex items-center gap-4 lg:mb-6">
              <span className="gold-rule" style={{ marginLeft: 0 }} />
              <span
                className="text-xs tracking-[0.4em] uppercase"
                style={{ fontFamily: 'var(--font-inter)', color: '#0F2A1F' }}
              >
                Connect
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
                fontWeight: 400,
                color: '#0F2A1F',
                lineHeight: 1.2,
                marginBottom: '1.15rem',
              }}
            >
              Get in{' '}
              <em style={{ fontStyle: 'italic', color: '#0F2A1F' }}>Touch</em>
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '1.05rem',
                color: 'rgba(15,42,31,0.52)',
                lineHeight: 1.75,
                marginBottom: '1.75rem',
              }}
            >
              Whether you&apos;re a family member looking to join the portal, or just reaching out
              to reconnect — we&apos;d love to hear from you.
            </p>

            {/* Member portal CTA */}
            <div className="glass-warm shadow-cloud mt-auto p-5 sm:p-6">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#0F2A1F',
                  marginBottom: '0.6rem',
                }}
              >
                Family Members
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.875rem',
                  color: 'rgba(15,42,31,0.6)',
                  marginBottom: '1.2rem',
                }}
              >
                Sign in to access the private family portal — photos, events, and more.
              </p>
              <Link
                href="/login"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  border: '1px solid rgba(15, 42, 31,0.45)',
                  color: '#0F2A1F',
                  background: 'transparent',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.65rem 1.25rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
              >
                Go to Portal
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right form — matches left column height on lg */}
          <div ref={rightRef} className="flex h-full">
            <div className="glass shadow-cloud flex h-full w-full flex-col justify-center p-7 sm:p-9 lg:p-10">
              {status === 'sent' ? (
                <div className="py-10 text-center">
                  <div
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '3rem',
                      color: '#1A3D2E',
                      marginBottom: '1rem',
                    }}
                  >
                    ◇
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '1.45rem',
                      color: '#0F2A1F',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Request Received
                  </p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(15,42,31,0.5)' }}>
                    We&apos;ll review your request and reach out soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {status === 'error' && (
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', margin: 0 }}>
                      Something went wrong. Please try again.
                    </p>
                  )}
                  <div>
                    <label
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(15,42,31,0.45)', display: 'block', marginBottom: '0.5rem' }}
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={inputStyle}
                      onFocus={(e)  => (e.target.style.borderColor = '#0F2A1F')}
                      onBlur={(e)   => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(15,42,31,0.45)', display: 'block', marginBottom: '0.5rem' }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={inputStyle}
                      onFocus={(e)  => (e.target.style.borderColor = '#0F2A1F')}
                      onBlur={(e)   => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
                      placeholder="you@example.com"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-3.5 text-sm tracking-widest uppercase"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      border: '1px solid rgba(15, 42, 31,0.45)',
                      color: '#0F2A1F',
                      background: 'transparent',
                      letterSpacing: '0.14em',
                      cursor: status === 'sending' ? 'wait' : 'pointer',
                      opacity: status === 'sending' ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={(e) => { if (status !== 'sending') { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; } }}
                    onMouseLeave={(e) => { if (status !== 'sending') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; } }}
                  >
                    {status === 'sending' ? 'Sending…' : status === 'error' ? 'Try Again' : 'Request Access'}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
