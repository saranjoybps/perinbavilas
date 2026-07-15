import CloudLayer from '@/components/clouds/CloudLayer';

export default function LoginLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #B8DFF8 0%, #D8F0FB 30%, #F4FAFE 60%, #FFF7ED 100%)' }}
    >
      {/* Cloud bg */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <CloudLayer depth="far" />
        <CloudLayer depth="mid" />
      </div>

      {/* Sunlight glow */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          top: '-8%', right: '5%',
          width: 600, height: 500,
          background: 'radial-gradient(ellipse 60% 50% at 55% 38%, rgba(255,224,80,0.18) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-auto px-4"
        style={{ paddingTop: '5rem', paddingBottom: '3rem' }}
      >
        {children}
      </div>
    </div>
  );
}
