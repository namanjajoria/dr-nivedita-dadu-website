'use strict';

// Business facts exactly as they appear on the approved homepage. Metadata and
// structured data are generated from this file, so update it together with the
// visible content and never add details that are not published on the site.
module.exports = Object.freeze({
  name: "Dr. Nivedita Dadu's Dermatology Clinic",
  tagline: "India's Most Trusted Skin + Laser Clinic",
  language: 'en-IN',
  ogLocale: 'en_IN',
  phone: { display: '+91-981-093-9319', e164: '+919810939319' },
  email: 'info@drniveditadadu.com',
  logo: { path: '/images/dr-nivedita-dadu-logo.png', width: 100, height: 100 },
  shareImage: {
    path: '/images/clinic-reception-desk.jpg',
    width: 1366,
    height: 764,
    alt: "Reception desk at Dr. Nivedita Dadu's Dermatology Clinic",
  },
  // Social profiles linked from the site header and footer.
  sameAs: [
    'https://www.facebook.com/daduskinclinic/',
    'https://www.instagram.com/dadumedicalcentre/',
    'https://www.youtube.com/channel/UCEQOJDwT1HlQO0Jmo-kLRrg',
  ],
  // "Clinic Timings" published in the footer.
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:30', closes: '19:30' },
    { days: ['Sunday'], opens: '10:00', closes: '19:00' },
  ],
  clinics: [
    {
      id: 'vasant-vihar',
      label: 'Vasant Vihar',
      streetAddress: 'A2/6 Vasant Vihar',
      addressLocality: 'New Delhi',
      postalCode: '110057',
      addressCountry: 'IN',
    },
    {
      id: 'rajouri-garden',
      label: 'Rajouri Garden',
      streetAddress: 'J-12/25, First Floor, Rajouri Garden',
      addressLocality: 'New Delhi',
      postalCode: '110027',
      addressCountry: 'IN',
    },
  ],
  doctor: {
    name: 'Dr. Nivedita Dadu',
    jobTitle: 'Founder and Chairman',
    description:
      'Founder and Chairman, MBBS, Maulana Azad Medical College and Lok Nayak Hospital, New Delhi. PG, (Dermatology, Venerology and Leprosy) Safdarjung Hospital, New Delhi.',
    image: { path: '/images/dr-nivedita-dadu-profile.webp', width: 1440, height: 1057 },
    alumniOf: [
      { type: 'CollegeOrUniversity', name: 'Maulana Azad Medical College' },
      { type: 'Hospital', name: 'Safdarjung Hospital' },
    ],
    sameAs: ['https://www.linkedin.com/in/dr-nivedita-dadu-1291b4135/'],
  },
  appointmentLocations: ['Vasant Vihar', 'Rajouri Garden'],
});
