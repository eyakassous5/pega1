const fs = require('fs');
const path = require('path');

// Load dictionary
const dictionaryPath = path.join(__dirname, '..', 'data', 'lst-dictionary.json');
const rawData = fs.readFileSync(dictionaryPath, 'utf-8');
const dictionary = JSON.parse(rawData);

// Build lookup maps for fast access
const wordToSign = new Map();
const phraseMap = [];
const signById = new Map();

// Index individual signs by all their word variants
for (const sign of dictionary.signs) {
  signById.set(sign.id, sign);
  for (const word of sign.words) {
    wordToSign.set(word.toLowerCase(), sign);
  }
}

// Index phrases (sorted by longest first for greedy matching)
for (const phrase of dictionary.phrases) {
  const allPhrases = [phrase.phrase, ...(phrase.alternates || [])];
  for (const p of allPhrases) {
    phraseMap.push({
      text: p.toLowerCase(),
      data: phrase,
    });
  }
}
phraseMap.sort((a, b) => b.text.length - a.text.length);

/**
 * Translate input text into a sequence of sign animations.
 * Strategy:
 *   1. First, try to match known phrases (longest match first)
 *   2. Then, tokenize remaining text and match individual words
 *   3. Unknown words are tracked separately
 */
function translate(text) {
  const input = text.toLowerCase().trim();
  const signs = [];
  const unknownWords = [];
  let remaining = input;

  // Phase 1: Extract known phrases (greedy, longest first)
  const matchedPhraseRanges = [];

  for (const { text: phraseText, data: phraseData } of phraseMap) {
    const idx = remaining.indexOf(phraseText);
    if (idx !== -1) {
      // Record this match
      matchedPhraseRanges.push({
        start: idx,
        end: idx + phraseText.length,
        phraseData,
        phraseText,
      });
      // Replace matched portion with placeholder to avoid re-matching
      remaining =
        remaining.substring(0, idx) +
        '□'.repeat(phraseText.length) +
        remaining.substring(idx + phraseText.length);
    }
  }

  // Phase 2: Process in order of appearance
  // Build a timeline of what to sign
  const timeline = [];

  // Add phrase matches to timeline
  for (const match of matchedPhraseRanges) {
    const phraseSigns = match.phraseData.signs
      .map((signId) => signById.get(signId))
      .filter(Boolean);

    timeline.push({
      position: match.start,
      type: 'phrase',
      word: match.phraseText,
      signs: phraseSigns.map((s) => ({
        word: s.words[0],
        animation: s.animation,
        duration: s.duration,
        description: s.description,
      })),
    });
  }

  // Tokenize remaining text (non-placeholder parts)
  const cleanRemaining = remaining.replace(/□+/g, ' ').trim();
  if (cleanRemaining) {
    const words = cleanRemaining.split(/\s+/).filter((w) => w.length > 0);
    let searchPos = 0;

    for (const word of words) {
      const pos = input.indexOf(word, searchPos);
      searchPos = pos + word.length;

      const sign = wordToSign.get(word);
      if (sign) {
        timeline.push({
          position: pos,
          type: 'word',
          word,
          signs: [
            {
              word: sign.words[0],
              animation: sign.animation,
              duration: sign.duration,
              description: sign.description,
            },
          ],
        });
      } else {
        // Skip common stop words (articles, prepositions)
        const stopWords = [
          'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
          'et', 'est', 'a', 'à', 'en', 'dans', 'sur', 'pour',
          'avec', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes',
          'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'qui', 'que',
          'ne', 'pas', 'se', 'ال', 'في', 'من', 'على', 'هذا', 'هذه',
        ];

        if (!stopWords.includes(word)) {
          unknownWords.push(word);
          timeline.push({
            position: pos,
            type: 'unknown',
            word,
            signs: [],
          });
        }
      }
    }
  }

  // Sort timeline by position to maintain word order
  timeline.sort((a, b) => a.position - b.position);

  // Flatten signs from timeline
  const allTokens = timeline.map((t) => t.word);
  const allSigns = timeline.flatMap((t) => t.signs);

  return {
    original: text,
    tokens: allTokens,
    signs: allSigns,
    unknownWords,
    totalDuration: allSigns.reduce((sum, s) => sum + s.duration, 0),
  };
}

/**
 * Get the full dictionary for browsing
 */
function getDictionary() {
  return dictionary.signs;
}

/**
 * Get available categories
 */
function getCategories() {
  const categories = new Set(dictionary.signs.map((s) => s.category));
  return [...categories].sort();
}

/**
 * Search the dictionary
 */
function search(query) {
  const q = query.toLowerCase();
  return dictionary.signs.filter(
    (s) =>
      s.words.some((w) => w.includes(q)) ||
      s.description.toLowerCase().includes(q) ||
      s.category.includes(q)
  );
}

/**
 * Reload dictionary from disk (useful during development)
 */
function reload() {
  const raw = fs.readFileSync(dictionaryPath, 'utf-8');
  const data = JSON.parse(raw);

  // Clear and rebuild maps
  wordToSign.clear();
  signById.clear();
  phraseMap.length = 0;

  for (const sign of data.signs) {
    signById.set(sign.id, sign);
    for (const word of sign.words) {
      wordToSign.set(word.toLowerCase(), sign);
    }
  }

  for (const phrase of data.phrases) {
    const allPhrases = [phrase.phrase, ...(phrase.alternates || [])];
    for (const p of allPhrases) {
      phraseMap.push({ text: p.toLowerCase(), data: phrase });
    }
  }
  phraseMap.sort((a, b) => b.text.length - a.text.length);

  Object.assign(dictionary, data);
  return { signCount: data.signs.length, phraseCount: data.phrases.length };
}

module.exports = {
  translate,
  getDictionary,
  getCategories,
  search,
  reload,
};
