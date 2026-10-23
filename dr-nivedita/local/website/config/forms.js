'use strict';

const site = require('./site');

// Server-side definitions for the forms on the homepage. Field names match the
// `name` attributes in views/index.html; anything not listed here is ignored.
// Field types are implemented in utils/validation.js.
//
// `api` describes how a submission reaches the external backend once API_BASE_URL
// is configured. `payload()` translates this site's field names into the names
// that backend expects, so a contract change is a one-line edit here rather than
// a change to the markup or the browser code.
module.exports = Object.freeze({
  appointment: {
    title: 'Consultation request (homepage hero form)',
    returnTo: '/#top',
    success: 'Thank you! Our team will contact you shortly to confirm your consultation.',
    fields: [
      { name: 'name', label: 'Name', type: 'name', required: true },
      { name: 'phone', label: 'Mobile number', type: 'phone', required: true },
      { name: 'location', label: 'Preferred location', type: 'choice', required: true, options: site.appointmentLocations },
    ],
    api: {
      // Not the appointment endpoint: that one also demands an email address, a
      // service and an appointment date, none of which this form asks for. Sent
      // as a contact lead carrying the preferred location instead.
      endpoint: '/api/contact',
      payload: (values) => ({
        name: values.name,
        mobile: values.phone,
        preferredLocation: values.location,
        source: 'dadu-homepage-consultation',
      }),
    },
  },
  contact: {
    title: 'Contact form',
    returnTo: '/#contact',
    success: 'Thank you for contacting us. Our team will get back to you soon.',
    fields: [
      { name: 'name', label: 'First name', type: 'name', required: true },
      { name: 'phone', label: 'Phone', type: 'phone', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'subject', label: 'Subject', type: 'line', required: true, max: 120 },
      { name: 'message', label: 'Message', type: 'text', required: true, max: 2000 },
    ],
    api: {
      endpoint: '/api/contact',
      payload: (values) => ({
        name: values.name,
        mobile: values.phone,
        email: values.email,
        service: values.subject,
        message: values.message,
        source: 'dadu-contact-us',
      }),
    },
  },
  review: {
    title: 'Rate us (footer feedback form)',
    returnTo: '/',
    success: 'Thank you for sharing your feedback.',
    fields: [
      { name: 'name', label: 'Name', type: 'name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'phone', required: false },
      { name: 'rating', label: 'Rating', type: 'choice', required: false, options: ['1', '2', '3', '4', '5'] },
      { name: 'review', label: 'Review', type: 'text', required: true, max: 1000 },
    ],
    api: {
      // The backend has no public review-submission endpoint (its /api/reviews is
      // admin-managed page content), so feedback is recorded as a tagged contact
      // lead. It is never published as review schema anywhere on the site.
      endpoint: '/api/contact',
      payload: (values) => ({
        name: values.name,
        email: values.email,
        mobile: values.phone,
        message: values.rating ? `Rating: ${values.rating}/5\n\n${values.review}` : values.review,
        source: 'dadu-footer-review',
      }),
    },
  },
  newsletter: {
    title: 'Newsletter signup',
    returnTo: '/',
    success: 'Thank you for subscribing to our newsletter.',
    fields: [{ name: 'email', label: 'Email address', type: 'email', required: true }],
    api: {
      endpoint: '/api/newsletter/subscribe',
      payload: (values) => ({ email: values.email }),
    },
  },
});
