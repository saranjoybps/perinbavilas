import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Reset Password — Perinba Vilas' };

export default function ForgotPasswordPage() {
  return (
    <div
      className="glass-warm shadow-cloud p-8 sm:p-10"
      style={{ backdropFilter: 'blur(24px)' }}
    >
      <div className="text-center mb-8">
        <Link href="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', fontWeight: 400, color: '#0F2A1F' }}>
            Perinba Vilas
          </span>
        </Link>
        <span className="gold-rule block mx-auto mb-4" />
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 400, color: '#1A1008', marginBottom: '0.35rem' }}>
          Reset Password
        </h1>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
