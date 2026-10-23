'use strict';

const site = require('../config/site');
const { absoluteUrl } = require('./seo');

// JSON-LD @graph built only from facts published on the site (config/site.js and
// the visible FAQs). No ratings or reviews are emitted on purpose.

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', nbsp: ' ' };

function toPlainText(htmlFragment) {
  return htmlFragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[\da-f]+|\w+);/gi, (match, entity) => {
      if (entity[0] === '#') {
        const code = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

// Reads the questions rendered in the FAQ section so the schema always matches the page.
function extractFaqs(viewSource) {
  const faqs = [];
  // An answer may run over several paragraphs; all of them belong to the answer.
  const rowPattern = /<details class="faq-row"[^>]*>\s*<summary class="faq-q"><h3>(.*?)<\/h3><\/summary>\s*<div class="faq-a">(.*?)<\/div><\/details>/gs;
  for (const [, question, rest] of viewSource.matchAll(rowPattern)) {
    const paragraphs = [...rest.matchAll(/<p>(.*?)<\/p>/gs)].map(([, p]) => toPlainText(p));
    faqs.push({ question: toPlainText(question).replace(/^\d+\.\s*/, ''), answer: paragraphs.join(' ') });
  }
  // The older accordion markup (kept so a page that still uses it keeps its schema).
  const accordionPattern = /<details class="faq-item"[^>]*>\s*<summary><h3>(.*?)<\/h3><\/summary>\s*<div class="faq-answer">(.*?)<\/div>\s*<\/details>/gs;
  for (const [, question, answer] of viewSource.matchAll(accordionPattern)) {
    const paragraphs = [...answer.matchAll(/<p>(.*?)<\/p>/gs)].map(([, p]) => toPlainText(p));
    faqs.push({ question: toPlainText(question).replace(/^\d+\.\s*/, ''), answer: paragraphs.join(' ') });
  }
  // Treatment pages (shared sd-* layout): <details><summary><h3>Q</h3></summary><div class="sd-faq-a">…</div></details>
  const sdPattern = /<details[^>]*>\s*<summary><h3>(.*?)<\/h3><\/summary>\s*<div class="sd-faq-a">(.*?)<\/div>\s*<\/details>/gs;
  for (const [, question, answer] of viewSource.matchAll(sdPattern)) {
    const paragraphs = [...answer.matchAll(/<p>(.*?)<\/p>/gs)].map(([, p]) => toPlainText(p));
    faqs.push({ question: toPlainText(question).replace(/^\d+\.\s*/, ''), answer: paragraphs.length ? paragraphs.join(' ') : toPlainText(answer) });
  }
  return faqs;
}

function imageObject(image) {
  return { '@type': 'ImageObject', url: absoluteUrl(image.path), width: image.width, height: image.height };
}

function buildGraph(page, faqs) {
  const home = absoluteUrl('/');
  const pageUrl = absoluteUrl(page.path);
  const ids = {
    organization: `${home}#organization`,
    website: `${home}#website`,
    doctor: `${home}#dr-nivedita-dadu`,
    webpage: `${pageUrl}#webpage`,
  };
  const openingHours = site.openingHours.map((slot) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: slot.days.map((day) => `https://schema.org/${day}`),
    opens: slot.opens,
    closes: slot.closes,
  }));
  const clinicIds = site.clinics.map((clinic) => `${home}#clinic-${clinic.id}`);

  const graph = [
    {
      '@type': 'MedicalOrganization',
      '@id': ids.organization,
      name: site.name,
      url: home,
      logo: imageObject(site.logo),
      telephone: site.phone.e164,
      email: site.email,
      medicalSpecialty: 'https://schema.org/Dermatology',
      founder: { '@id': ids.doctor },
      subOrganization: clinicIds.map((id) => ({ '@id': id })),
      sameAs: site.sameAs,
    },
    ...site.clinics.map((clinic, index) => ({
      '@type': 'MedicalClinic',
      '@id': clinicIds[index],
      name: `${site.name}, ${clinic.label}`,
      url: home,
      image: absoluteUrl(site.shareImage.path),
      telephone: site.phone.e164,
      email: site.email,
      medicalSpecialty: 'https://schema.org/Dermatology',
      address: {
        '@type': 'PostalAddress',
        streetAddress: clinic.streetAddress,
        addressLocality: clinic.addressLocality,
        postalCode: clinic.postalCode,
        addressCountry: clinic.addressCountry,
      },
      openingHoursSpecification: openingHours,
      parentOrganization: { '@id': ids.organization },
    })),
    {
      '@type': 'Person',
      '@id': ids.doctor,
      name: site.doctor.name,
      jobTitle: site.doctor.jobTitle,
      description: site.doctor.description,
      image: imageObject(site.doctor.image),
      alumniOf: site.doctor.alumniOf.map((org) => ({ '@type': org.type, name: org.name })),
      worksFor: { '@id': ids.organization },
      sameAs: site.doctor.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': ids.website,
      url: home,
      name: site.name,
      inLanguage: site.language,
      publisher: { '@id': ids.organization },
    },
    {
      '@type': 'WebPage',
      '@id': ids.webpage,
      url: pageUrl,
      name: page.title,
      description: page.description,
      inLanguage: site.language,
      isPartOf: { '@id': ids.website },
      about: { '@id': ids.organization },
      primaryImageOfPage: imageObject(page.image || site.shareImage),
    },
  ];

  if (page.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    });
  }

  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      url: pageUrl,
      isPartOf: { '@id': ids.website },
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// Serialised for a <script type="application/ld+json"> block; "<" is escaped so the
// JSON can never close the script element early. `faqs` are the questions shown on the
// page as plain text ([{ question, answer }]) - pass the same data the page renders.
function buildStructuredData(page, faqs = []) {
  return JSON.stringify(buildGraph(page, faqs)).replace(/</g, '\\u003c');
}

module.exports = { buildStructuredData, extractFaqs, toPlainText };
