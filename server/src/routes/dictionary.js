const express = require('express');
const router = express.Router();
const signLanguageService = require('../services/signLanguageService');

/**
 * GET /api/dictionary
 * Returns the full sign language dictionary (for debugging/admin)
 */
router.get('/', (req, res) => {
  const dictionary = signLanguageService.getDictionary();
  res.json({
    count: dictionary.length,
    signs: dictionary,
  });
});

/**
 * GET /api/dictionary/categories
 * Returns available sign categories
 */
router.get('/categories', (req, res) => {
  const categories = signLanguageService.getCategories();
  res.json({ categories });
});

/**
 * GET /api/dictionary/search?q=bonjour
 * Search for a sign in the dictionary
 */
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter "q"' });

  const results = signLanguageService.search(q.toLowerCase());
  res.json({ query: q, results });
});

module.exports = router;
