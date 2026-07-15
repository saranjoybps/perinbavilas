import HeroSection       from '@/components/sections/HeroSection';
import ValuesSection     from '@/components/sections/ValuesSection';
import TimelineSection   from '@/components/sections/TimelineSection';
import GallerySection    from '@/components/sections/GallerySection';
import LegacyStatement   from '@/components/sections/LegacyStatement';
import ContactSection    from '@/components/sections/ContactSection';
import Footer            from '@/components/sections/Footer';

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <ValuesSection />
      <TimelineSection />
      <GallerySection />
      <LegacyStatement />
      <ContactSection />
      <Footer />
    </main>
  );
}
