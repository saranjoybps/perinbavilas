import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign In — Perinba Vilas' };

export default function LoginPage() {
  return (
    <div
      className="glass-warm shadow-cloud p-8 sm:p-10"
      style={{ backdropFilter: 'blur(24px)' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', fontWeight: 400, color: '#C49B1A' }}>
            Perinba Vilas
          </span>
        </Link>
        <span className="gold-rule block mx-auto mb-4" />
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 400, color: '#1A1008', marginBottom: '0.35rem' }}>
          Family Portal
        </h1>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.45)', letterSpacing: '0.05em' }}>
          Sign in to access the family space
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
