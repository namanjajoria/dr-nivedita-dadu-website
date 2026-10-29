'use strict';

const express = require('express');
const pages = require('../config/pages');
const blog = require('../content/blog');
const { sendInnerPage } = require('../controllers/pageController');
const { sendStatusPage } = require('../services/statusPage');
const { imageSize } = require('../utils/imageSize');

// /blog/ and /blog/<slug>/ from the `blogs` table. A slug that is not a published post
// falls through to the site's 404 page.
const router = express.Router();
const listingPage = pages.find((page) => page.path === '/blog/');

async function posts(res) {
  const list = await blog.loadPosts();
  if (list) return list;
  // No API answer and no saved copy: say so rather than show an empty blog.
  sendStatusPage(res, {
    status: 503,
    heading: 'Blog temporarily unavailable',
    message: 'Our articles could not be loaded right now. Please try again in a few minutes.',
    primaryHref: '/',
    primaryLabel: 'Back to the website',
  });
  return null;
}

// The listing's <title>, description and share image can be changed in the admin's Blog
// Page settings; config/pages.blog.json holds the values used until then.
function listingMeta(settings) {
  const share = settings.seo.ogImage && imageSize(settings.seo.ogImage);
  return {
    ...listingPage,
    title: settings.seo.title || listingPage.title,
    description: settings.seo.description || listingPage.description,
    ...(share ? { image: { path: settings.seo.ogImage, width: share.width, height: share.height, alt: settings.title } } : {}),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: settings.breadcrumb, path: '/blog/' }],
  };
}

router.get('/blog/', async (req, res, next) => {
  try {
    const [list, settings] = await Promise.all([posts(res), blog.loadPageSettings()]);
    if (list) sendInnerPage(res, listingMeta(settings), blog.listingBody(list, settings));
  } catch (error) {
    next(error);
  }
});

router.get('/blog/:slug/', async (req, res, next) => {
  try {
    const [list, settings] = await Promise.all([posts(res), blog.loadPageSettings()]);
    if (!list) return;
    const slug = req.params.slug.toLowerCase();
    const post = list.find((p) => p.slug.toLowerCase() === slug);
    if (!post) return next();
    const path = `/blog/${post.slug}/`;
    sendInnerPage(res, {
      path,
      title: post.seoTitle,
      description: post.description,
      ...(post.photo.width && post.photo.height
        ? { image: { path: post.photo.src, width: post.photo.width, height: post.photo.height, alt: post.photo.alt } }
        : {}),
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: settings.breadcrumb, path: '/blog/' },
        { name: post.title, path },
      ],
    }, blog.postBody(post, list, settings));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
