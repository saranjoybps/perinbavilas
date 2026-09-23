import HeroSection           from '@/components/sections/HeroSection';
import IntroductionSection   from '@/components/sections/IntroductionSection';
import GroupPhotoSection     from '@/components/sections/GroupPhotoSection';
import HeritagePhotosSection from '@/components/sections/HeritagePhotosSection';
import FamilyTreeSection     from '@/components/sections/FamilyTreeSection';
import ValuesSection         from '@/components/sections/ValuesSection';
import TimelineSection       from '@/components/sections/TimelineSection';
import GallerySection        from '@/components/sections/GallerySection';
import FaithSection          from '@/components/sections/FaithSection';
import LegacyStatement       from '@/components/sections/LegacyStatement';
import ContactSection        from '@/components/sections/ContactSection';
import Footer                from '@/components/sections/Footer';

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <IntroductionSection />
      <GroupPhotoSection />
      <HeritagePhotosSection />
      <FamilyTreeSection />
      <ValuesSection />
      <TimelineSection />
      <GallerySection />
      <LegacyStatement />
      <ContactSection />
      <FaithSection />
      <Footer />
    </main>
  );
}
