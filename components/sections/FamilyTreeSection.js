'use client';

export default function FamilyTreeSection() {
  return (
    <section
      id="family-tree"
      className="relative hidden overflow-hidden lg:block"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(3.5rem, 7vw, 5.5rem)',
        paddingBottom: 'clamp(3.5rem, 7vw, 5.5rem)',
      }}
    >
      <div className="mx-auto max-w-6xl px-8 xl:px-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family-tree/lg_screen.png"
          alt="Perinba Vilas family tree"
          className="mx-auto h-auto w-full max-w-5xl object-contain"
        />
      </div>
    </section>
  );
}
