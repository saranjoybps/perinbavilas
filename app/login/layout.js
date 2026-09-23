export default function LoginLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 18%, rgba(168, 196, 180, 0.28) 0%, transparent 58%), linear-gradient(180deg, #F4F7F5 0%, #E7EFEA 48%, #F7FAF8 100%)',
      }}
    >
      {/* Soft forest washes */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          top: '-12%',
          left: '-8%',
          width: 520,
          height: 420,
          background:
            'radial-gradient(ellipse 60% 55% at 40% 40%, rgba(15, 42, 31, 0.07) 0%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          bottom: '-10%',
          right: '-6%',
          width: 560,
          height: 460,
          background:
            'radial-gradient(ellipse 55% 50% at 60% 55%, rgba(168, 196, 180, 0.32) 0%, transparent 68%)',
          filter: 'blur(36px)',
        }}
      />

      {/* Brand decor — same language as welcome gate */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/decorative-2.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          top: '-2%',
          right: '-3%',
          width: 'min(42vw, 340px)',
          opacity: 0.22,
          transform: 'rotate(8deg)',
        }}
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/decorative-2.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          bottom: '-4%',
          left: '-4%',
          width: 'min(38vw, 300px)',
          opacity: 0.18,
          transform: 'rotate(-12deg) scaleX(-1)',
        }}
        decoding="async"
      />

      <div
        className="relative z-10 w-full max-w-md mx-auto px-4"
        style={{ paddingTop: '5rem', paddingBottom: '3rem' }}
      >
        {children}
      </div>
    </div>
  );
}
