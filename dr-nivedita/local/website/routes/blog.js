'use strict';

const express = require('express');
const pages = require('../config/pages');
const blog = require('../content/blog');
const { sendInnerPage } = require('../controllers/pageController');
const { sendStatusPage } = require('../services/statusPage');

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

router.get('/blog/', async (req, res, next) => {
  try {
    const list = await posts(res);
    if (list) sendInnerPage(res, listingPage, blog.listingBody(list));
  } catch (error) {
    next(error);
  }
});

router.get('/blog/:slug/', async (req, res, next) => {
  try {
    const list = await posts(res);
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
        { name: 'Blog', path: '/blog/' },
        { name: post.title, path },
      ],
    }, blog.postBody(post, list));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
