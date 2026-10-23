'use strict';

// Every public HTML page on this server. The page router and sitemap.xml are both
// generated from this list, so a new page (for example /treatments/acne/ or
// /blog/<slug>/) only needs a view in /views plus an entry here.
//
//   path         URL path served by Express
//   view         file name in /views (without .html)
//   title        <title>, og:title and twitter:title
//   description  meta description, og:description and twitter:description
//   image        optional share image { path, width, height, alt } (defaults to site.shareImage)
//   breadcrumbs  optional [{ name, path }] rendered as BreadcrumbList structured data
//   sitemap      set to false to leave a page out of sitemap.xml
const pages = [
  {
    path: '/',
    view: 'index',
    title: 'Best Aesthetic Dermatologists In Delhi - Skin Care Clinic',
    description:
      "Dr. Nivedita Dadu's Dermatology Clinic - India's Most Trusted Skin + Laser Clinic, with centres in Vasant Vihar (South Delhi) and Rajouri Garden (West Delhi).",
  },

  // About Us. Paths, titles and descriptions are the live drniveditadadu.com values.
  {
    path: '/dr-nivedita-dadu-skin-specialist-in-delhi',
    view: 'dr-nivedita-dadu',
    title: 'Dr Nivedita Dadu – Dermatologist & Skin Specialist in Delhi',
    description:
      'Dr Nivedita Dadu – dermatologist and skin specialist in Delhi for expert skin and hair treatments in Rajouri Garden (West Delhi) & Vasant Vihar (South Delhi)',
    image: { path: '/images/dr-nivedita-dadu-profile.webp', width: 1440, height: 1057, alt: 'Dr. Nivedita Dadu' },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Dr Nivedita Dadu', path: '/dr-nivedita-dadu-skin-specialist-in-delhi' },
    ],
  },
  {
    path: '/about-clinic',
    view: 'about-clinic',
    title: 'Dr. Nivedita Dadu | Top Skin & Hair Treatment Clinic Delhi',
    description:
      'Dr. Nivedita Dadu is a top skin and hair treatment clinic in Delhi NCR offering advanced procedures and personalized care in Rajouri Garden and Vasant Vihar.',
    image: { path: '/images/about/clinic-1.webp', width: 1140, height: 705, alt: "Dr. Nivedita Dadu's Dermatology Clinic" },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'About Clinic', path: '/about-clinic' },
    ],
  },
  {
    path: '/general-dermatology',
    view: 'general-dermatology',
    title: 'Top 10 Dermatologists in Rajouri Garden & West Delhi',
    description:
      'Discover top dermatologists for skin care in Rajouri Garden (West Delhi) and Vasant Vihar (South Delhi). Expert treatments by trusted dermatologists in Delhi',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'General Dermatology', path: '/general-dermatology' },
    ],
  },
  {
    path: '/cosmetic-dermatology',
    view: 'cosmetic-dermatology',
    title: 'Best Cosmetic Dermatologist in West & South Delhi | Book Now',
    description:
      'Visit expert cosmetic dermatologists in Rajouri Garden (West Delhi) and Vasant Vihar (South Delhi) for advanced skin treatments. Book your appointment today.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Cosmetic Dermatology', path: '/cosmetic-dermatology' },
    ],
  },
  {
    path: '/technology',
    view: 'technology',
    title: "Technologies | Dr. Nivedita Dadu's Dermatology Clinic",
    description:
      'Dr. Nivedita Dadu specializes in dermatology in Delhi. She offers affordable skincare treatments using advanced technology and equipment.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Technologies', path: '/technology' },
    ],
  },
];

// Pages generated from the live site by tools/about-page-import/: treatments, categories and
// conditions (build_treatments.py), gallery (build_gallery.py), blog (build_blog.py), health
// tips (build_health_tips.py), FAQs (build_faqs.py), press (build_press.py) and testimonials
// (build_testimonials.py). Same shape as the entries above.
const generated = ['./pages.all.json', './pages.category.json', './pages.detail.json', './pages.condition.json',
  './pages.gallery.json', './pages.blog.json', './pages.health-tips.json',
  './pages.faqs.json', './pages.press-media.json', './pages.testimonials.json']
  .flatMap((file) => {
    try {
      return require(file);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') return [];
      throw error;
    }
  });

module.exports = Object.freeze([...pages, ...generated]);
