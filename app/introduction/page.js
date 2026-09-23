import Link from 'next/link';
import SectionDecor from '@/components/ui/SectionDecor';

export const metadata = {
  title: 'Introduction — Perinba Vilas',
  description: 'Full family introduction and history of the Perinba Vilas family.',
};

const prose = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'clamp(0.92rem, 2.1vw, 1.05rem)',
  lineHeight: 1.8,
  color: 'rgba(15, 42, 31, 0.72)',
};

const h2Style = {
  fontFamily: 'var(--font-cormorant)',
  fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
  fontWeight: 400,
  color: '#0F2A1F',
  marginBottom: '1.25rem',
  marginTop: '2.75rem',
  letterSpacing: '0.02em',
};

const pStyle = { ...prose, marginBottom: '1.1rem' };

export default function IntroductionPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(168, 196, 180, 0.2) 0%, transparent 55%), linear-gradient(180deg, #F7FAF8 0%, #EEF3F0 50%, #F7FAF8 100%)',
      }}
    >
      <SectionDecor position="bottom-left" src="/decorative-3.png" className="mix-blend-multiply" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-10" style={{ paddingTop: '6.5rem', paddingBottom: '4rem', zIndex: 1 }}>
        <Link
          href="/#introduction"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(15, 42, 31, 0.55)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: '2rem',
          }}
        >
          ← Back to home
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 400,
            color: '#0F2A1F',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}
        >
          Introduction
        </h1>
        <span className="gold-rule block mb-10" style={{ marginLeft: 0 }} />

        <article>
          <h2 style={{ ...h2Style, marginTop: 0 }}>INTRODUCTION</h2>

          <p style={pStyle}>
            Yesuvadiyan Nadar (b. 1845) and his family lived in Semmarikulam near Megnanapuram, Tuticorin District. His original name and his wife name were not known. It is presumed that he should have embraced Christianity and therefore left Semmarikulam and moved to Adayal in around 1875. During that period many people in and around the area have started settling in Adayal. The place name was called Adayal because it means &apos;adaithal&apos; or settlement. A church was built in Adayal and the Christian people in Adayal started worshipping Jesus Christ.
          </p>

          <p style={pStyle}>
            He should has moved from semmarikulam after the birth of his eldest son. The eldest son name was Perumal Nadar, but after conversion his name was Perinbam Nadar. His sister and brother names were Christian names from the beginning.
          </p>

          <p style={pStyle}>
            Yesuvadiyan Nadar was born around 1845. He has got three children. 1. Perinbam Nadar (Perumal Nadar) 1872?-1956 2. Packiam Ammal (d) 3. Abraham Nadar (d)
          </p>

          <p style={pStyle}>
            Since, Perumal Nadar has become Christian, his name has changed from Perumal Nadar to Perinbam Nadar. The details of Perinbam Nadar family tree have only been incorporated in this book. However, the details of his brother and sister also have been collected and it is worth that those details are given here in short.
          </p>

          <p style={pStyle}>
            Packiam Ammal married Koilpillai Nadar of Mukuperi. They had 3 children, viz. 1. Rubavathy (d) m.Jesudoss (d) 2. Gnanamani (d) m. Roberts (d) 3. Packiamani (d) m.Moses (d)
          </p>

          <p style={pStyle}>
            Rubavathy had the following children. The places where they are living now are also indicated therein. 1. Packiathai (?) m.Wilson (?) USA 2. Wales (d) m.Sumathy USA 3. Stephen m.Rajakili (Washington, USA) 4. Suganthy ...? 5. Jeyaraj (d) 6. Kiruba ...?7. Joy ..... ?
          </p>

          <p style={pStyle}>
            Gnanamani had the following children. The places where they are living now are also indicated therein. 1. Florence m.Sundaraj (d.2015).. Palaniyappapuram 2. Vimala(d) m.John .Nazareth.Now lives with their daughter in Bangalore. 3. Radhabai (d?) before marriage expired. 4. Chandra (d?) m.Arunachalam Pillai of Srilanka and now in USA 5. Deboral (d.2015) m.Gunasingh (d.2014) lived with their son Rajkumar Gunasingh in Chennai 6. Robinson (d?) before marriage 7. Angela (d?) m.Mohandass (Retired HM) lives in Palayamkottai with their daughter Henrita Gnanam, Asst. Prof. in English in Sarah Tucker college. 8. Davidson m.Philomenal. Mr.Davidson is LIC Agent and Philomenal is staff nurse in JIPMER. Pondicherry. 9. Jesson Roberts m.Viji living in Washinton, USA. Their children are also settled in USA.
          </p>

          <p style={pStyle}>
            Packiamani ammal (d) married Moses (d) and they were having the following children: 1. Jesuran Ponraj m.Packiamani lives in Coimbatore Colombo Stores at Singanallur along with family. 2. Johnson Moses m.Jenilla Settled in USA 3. Joshua Moses (d) m.Ruth lives in Bangalore with family. 4. Jessen Moses m.Jasmine settled in USA 5. Joel Moses m.Julie lives in Bangalore with family. 6. Rani Moses m.Sugantha balan settled in USA
          </p>

          <p style={pStyle}>
            Abraham Nadar Abraham Nadar m. Alagammai Ammal They were having the following children: 1. Arputhamani Ammal (d) m.Palpandian (d) lived in Adayal 2. Isaac Theodore Nadar (b.18.07.1923 - d.21.02.1980) m.Lilliy Rajammal Annapoo (b.10.06.1930 - d.17.08.2013)
          </p>

          <p style={pStyle}>
            Arputhamani had the following children: 1. Alagubai (?) m. (?) Retired HM in Coimbatore 2. Jeyaseeli (d) m. (?) lived in Coimbatore 3. Beaulah (d) m. (?) lived in Pichivilai 4. Amala (d) m. (?) lived in Chennai
          </p>

          <p style={pStyle}>
            Isaac Theodore has the following children: 1. Abraham Stalin Rajakumar (d) m.Jeyakumari living with daughter in Chennai 2. Glory (d.10.04.1973) not married. 3. Mary m.Selwyn (d) lives in Srivaikuntam 4. Selwyn m.Sunirem Nightingale Lives in Kallidaikurichi
          </p>

          <p style={{ ...pStyle, fontStyle: 'italic', color: 'rgba(15, 42, 31, 0.55)' }}>
            (m - married, b - born, d - died)
          </p>

          <p style={pStyle}>
            YPM was a well known paper and stationeries organization in Srilanka from 1950s onwards. It was situated in Maliban street, near Colombo Fort Railway Station. YPM stands for Yesuvadiyan, Perinbam and Manickavasagam. Yesuvadiyan Nadar, his son Perinbam Nadar and Manickavasagam Nadar, the brother in law of Perinbam Nadar founded and developed the co. to a great paper and stationery business centre, importing them directly from foreign countries like Sweden, Norway, South Africa, Japan, Holland through Triconamalai and Colombo ports. All four sons of Perinbam Nadar viz. Rajamani Nadar, Rajasigamani Nadar, Palpandian Nadar and Duraipandian Nadar and the sons of the daughters of Perinbam Nadar viz. Annamani, Annapoomani and Jothi Rethnamani were all involved in the business.
          </p>

          <p style={pStyle}>
            Simultaneously, they started business in Chennai, by acquiring buildings in and around Mambalam Railway Station. Now the organizations are well known by PVT.
          </p>

          <p style={pStyle}>
            Perinbavilas group took keen interest in building the new Church in Adayal. The entire family members lived in a common house, Pannaiya veedu, before moving to individual houses.
          </p>

          <p style={pStyle}>
            Before going to the Perinbavilas family tree, it is apt to indicate the family details of Annammal, wife of Perinbam Nadar also here. She is from Adayal. Her father was Abraham Nadar, who was called &apos;Vathiar&apos;, since he was a teacher.
          </p>

          <p style={pStyle}>
            Abraham Nadar had the following children: 1. Annammal Perinbam (b. 1886 - d. 1949) 2. Mary Ammal (She was married to a Hindu and her name was Mariammal) 3. Manickavasagam Nadar (b. 1897 - d 1958) 4. Devadasan Nadar (b. 1900 - d. 1974) 5. Navamani Nadar (b. 1903 - d. 1964)
          </p>

          <p style={pStyle}>
            It has to be noted that all the children of Abraham vathiar lived in Adayal only.
          </p>

          <p style={pStyle}>
            I took the initiative to collect various details about the family members of the Perinbam Nadar family tree and compile them.
          </p>

          <h2 style={h2Style}>FAMILY GET-TOGETHERS AND DIGITAL EDITION UPDATE</h2>

          <p style={pStyle}>
            As our family continues to grow and flourish, we have organized a series of family get-togethers over the years to stay connected and celebrate our shared heritage:
          </p>

          <ul
            style={{
              ...prose,
              marginBottom: '1.25rem',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.85rem' }}>
              <strong style={{ color: '#0F2A1F', fontWeight: 500 }}>1st Family Get-Together (Chennai):</strong>{' '}
              The original print edition of this family book was officially launched during our first historic family gathering in Chennai.
            </li>
            <li style={{ marginBottom: '0.85rem' }}>
              <strong style={{ color: '#0F2A1F', fontWeight: 500 }}>2nd Family Get-Together (Hosur):</strong>{' '}
              Our second gathering was held at a resort in Hosur, where we stayed together and enjoyed memorable family fellowship. To mark this occasion, a second print edition of the book was released, updated with the details of the latest members added to the family tree.
            </li>
            <li style={{ marginBottom: '0.85rem' }}>
              <strong style={{ color: '#0F2A1F', fontWeight: 500 }}>3rd Family Get-Together (Chennai):</strong>{' '}
              The third family get-together took place at the Olive Greenz Hotel in Chennai, further strengthening our family ties.
            </li>
            <li style={{ marginBottom: '0.85rem' }}>
              <strong style={{ color: '#0F2A1F', fontWeight: 500 }}>4th Family Get-Together (Adayal):</strong>{' '}
              The fourth gathering brought us back to our roots in our native place, Adayal.
            </li>
          </ul>

          <p style={pStyle}>
            To ensure that our ancestral history and family tree remain readily accessible to all family members worldwide, this family book has now been transformed into an online website.
          </p>

          <p style={pStyle}>
            The digital processing and technical setup for the website were carried out by Adeline Steffi ( code 671) and the content revisions and corrections were meticulously completed by Shiny Madan. (Code 752) this book into an online platform makes our family&apos;s history and tree easily available, accessible, and ready for future updates by generations to come.
          </p>

          <p style={pStyle}>
            I would like to thank all the members of our family, who have furnished details about the members and their photographs.
          </p>

          <p style={pStyle}>
            While every effort has been made to collect and present accurate information, we sincerely apologize for any unintentional mistakes, omissions, or details that may have been left out. Please feel free to bring any corrections or additions to our attention so we can update the website accordingly.
          </p>

          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
              color: '#0F2A1F',
              marginTop: '2.5rem',
              letterSpacing: '0.04em',
            }}
          >
            D. SUTHANTHIRARAJ PERINBAM
          </p>
        </article>

        <div style={{ marginTop: '3rem' }}>
          <Link
            href="/#introduction"
            className="inline-block px-7 py-3.5 text-xs tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid rgba(15, 42, 31, 0.45)',
              color: '#0F2A1F',
              textDecoration: 'none',
              letterSpacing: '0.14em',
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
