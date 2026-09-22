'use client';

export default function FamilyTreeSection() {
  return (
    <section
      id="family-tree"
      className="relative block overflow-hidden bg-white md:hidden"
      style={{
        paddingTop: 'clamp(2.5rem, 8vw, 4rem)',
        paddingBottom: 'clamp(2.5rem, 8vw, 4rem)',
      }}
    >
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family-tree/family-tree.png"
          alt="Perinba Vilas family tree"
          className="mx-auto h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
