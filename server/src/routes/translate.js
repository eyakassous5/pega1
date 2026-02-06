const express = require('express');
const router = express.Router();
const signLanguageService = require('../services/signLanguageService');

/**
 * POST /api/translate
 * Translates text to a sequence of sign language animations
 *
 * Body: { "text": "bonjour comment ça va" }
 * Response: {
 *   original: string,
 *   tokens: string[],
 *   signs: Array<{ word, animation, duration, description }>,
 *   unknownWords: string[]
 * }
 */
router.post('/', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid "text" field in request body',
      });
    }

    const trimmed = text.trim().toLowerCase();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    const result = signLanguageService.translate(trimmed);
    res.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
