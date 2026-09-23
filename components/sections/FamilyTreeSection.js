'use client';

export default function FamilyTreeSection() {
  return (
    <section
      id="family-tree"
      className="relative block overflow-hidden bg-white"
      style={{
        paddingTop: 'clamp(2.5rem, 8vw, 4rem)',
        paddingBottom: 'clamp(2.5rem, 8vw, 4rem)',
      }}
    >
      {/* Mobile */}
      <div className="mx-auto max-w-lg px-4 sm:px-6 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family-tree/family-tree.png"
          alt="Perinba Vilas family tree"
          className="mx-auto h-auto w-full object-contain"
        />
      </div>

      {/* Tablet & desktop */}
      <div className="mx-auto hidden max-w-6xl px-6 lg:px-12 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family-tree/family-tree-md-lg.png"
          alt="Perinba Vilas family tree"
          className="mx-auto h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
