'use client';

import { motion } from 'framer-motion';

const HERITAGE_PHOTOS = [
  {
    src: '/gallery/old-generation-2.jpeg',
    alt: 'Perinba Vilas family — olden days photograph',
    orientation: 'landscape',
  },
  {
    src: '/gallery/old-generation-1.jpeg',
    alt: 'Perinba Vilas family — olden days photograph',
    orientation: 'portrait',
  },
];

const PHOTO_1965_ROWS = [
  {
    label: 'Standing L to R',
    names:
      'C. Selvaraj, C. Thangadurai, S. Chandra, C. Santhosha Pandian, C. Sinnadurai',
  },
  {
    label: 'Sitting',
    names:
      'S. Leela, T. Regina, C. Annamani Ammal, Thayammal, Hand. S. Jacob Arputharaj, Devakirubai Ammal, G. Subathra, S. Grace, C. Jeba Anandharaj (Hand)',
  },
  {
    label: 'Ground',
    names:
      'S. Arulraj, S. Thangaraj, S. Jebaraj, S. Mangaraj, S. Thangaraj, S. Julie, S. Indira Jebakumar',
  },
];

export default function HeritagePhotosSection() {
  return (
    <section
      id="heritage-photos"
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        paddingTop: 'clamp(2rem, 5vw, 3.5rem)',
        paddingBottom: 'clamp(3rem, 8vw, 5.5rem)',
      }}
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-center">
          {HERITAGE_PHOTOS.map((photo, i) => (
            <motion.div
              key={photo.src}
              className="flex justify-center"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.65,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                style={{
                  display: 'block',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight:
                    photo.orientation === 'portrait'
                      ? 'min(70vh, 520px)'
                      : 'min(55vh, 380px)',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* 1965 group photo */}
        <motion.figure
          className="m-0 mx-auto mt-10 sm:mt-14"
          style={{ maxWidth: 860 }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(15, 42, 31, 0.55)',
              textAlign: 'center',
              margin: '0 0 1rem',
            }}
          >
            Photo Taken on 27-12-1965
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gallery/old-generation-3.jpeg"
            alt="Perinba Vilas family photograph, 27 December 1965"
            loading="lazy"
            decoding="async"
            className="mx-auto h-auto w-full"
            style={{
              display: 'block',
              objectFit: 'contain',
              maxHeight: 'min(75vh, 640px)',
            }}
          />

          <figcaption className="mx-auto mt-6 max-w-3xl space-y-4 text-left sm:mt-8">
            {PHOTO_1965_ROWS.map((row) => (
              <div key={row.label}>
                <p
                  className="text-[0.62rem] uppercase tracking-[0.22em]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: '#0F2A1F',
                    margin: 0,
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'clamp(0.8rem, 1.8vw, 0.92rem)',
                    lineHeight: 1.6,
                    color: 'rgba(15,42,31,0.58)',
                    margin: '0.35rem 0 0',
                  }}
                >
                  {row.names}
                </p>
              </div>
            ))}
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
