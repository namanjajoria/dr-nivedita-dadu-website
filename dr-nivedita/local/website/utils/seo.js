'use strict';

const config = require('../config');
const site = require('../config/site');
const { assetUrl } = require('./assets');
const { mediaUrl } = require('./media');

// Builds absolute URLs from the configured SITE_URL only, so canonical, Open Graph
// and sitemap URLs can never point at file:/// paths or a different host.
function absoluteUrl(pathname = '/') {
  return new URL(pathname, `${config.siteUrl}/`).href;
}

function robotsDirective() {
  return config.seo.allowIndexing ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
}

function assetUrls() {
  return {
    cssUrl: assetUrl('/css/main.css'),
    jsUrl: assetUrl('/js/main.js'),
    swiperCssUrl: assetUrl('/vendor/swiper/swiper-bundle.min.css'),
    swiperJsUrl: assetUrl('/vendor/swiper/swiper-bundle.min.js'),
    // inner pages only (views/partials/inner-page-start.html)
    pagesCssUrl: assetUrl('/css/pages.css'),
    pagesJsUrl: assetUrl('/js/pages.js'),
    // homepage hero backgrounds (views/index.html)
    heroBgCssUrl: assetUrl('/css/home-hero-bg.css'),
  };
}

function buildPageMeta(page) {
  const image = page.image || site.shareImage;
  return {
    lang: site.language,
    siteName: site.name,
    title: page.title,
    description: page.description,
    canonicalUrl: absoluteUrl(page.path),
    robots: robotsDirective(),
    ogLocale: site.ogLocale,
    ogImage: absoluteUrl(mediaUrl(image.path)),
    ogImageWidth: image.width,
    ogImageHeight: image.height,
    ogImageAlt: image.alt,
    ...assetUrls(),
    // extra stylesheet for one group of pages (e.g. the About pages' /css/about.css)
    pageCssUrl: page.css ? assetUrl(page.css) : '',
  };
}

module.exports = { absoluteUrl, robotsDirective, assetUrls, buildPageMeta };
