// Reads the word lists in dictionaries/*.md (BANNED.md, NEVER-SUGGESTED.md). Every "- word" list item
// counts; "- word (en)" limits it to languages whose code is or starts with that tag (en, en-US, es, de...).
const fs = require('fs');
const path = require('path');

// The words listed in `file` for one language code, as a Set of uppercase words.
module.exports = function listFor(file, code) {
  return new Set(fs.readFileSync(path.join(__dirname, file), 'utf8')
    .split(/\r?\n/)
    .map(l => /^\s*[-*]\s+([A-Za-zÀ-ÿ]+)\s*(?:\(([A-Za-z-]+)\))?\s*$/.exec(l))
    .filter(Boolean)
    .filter(m => !m[2] || code === m[2] || code.indexOf(m[2] + '-') === 0)
    .map(m => m[1].toUpperCase()));
};
