'use strict';

const helmet = require('helmet');
const config = require('../config');

// Security headers. The Content Security Policy lists exactly what the homepage
// loads: self-hosted CSS/JS/images, Google Fonts, YouTube thumbnails and the
// youtube-nocookie player used by the video cards.
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        // data: is Swiper's bundled icon font, referenced by its stylesheet.
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        // Plus the storage host of images uploaded through the admin (config api.mediaOrigins).
        imgSrc: ["'self'", 'data:', 'https://i.ytimg.com', ...(config.api.enabled ? config.api.mediaOrigins : [])],
        frameSrc: ['https://www.youtube-nocookie.com'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    // Remote YouTube thumbnails and the embedded player are not CORP-enabled.
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: config.isProduction ? { maxAge: 15552000, includeSubDomains: false } : false,
  });
}

module.exports = { securityHeaders };
