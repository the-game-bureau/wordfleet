// Reads dictionaries/BANNED.md: every "- word" list item is a word removed from all dictionaries.
const fs = require('fs');
const path = require('path');

module.exports = new Set(fs.readFileSync(path.join(__dirname, 'BANNED.md'), 'utf8')
  .split(/\r?\n/)
  .map(l => /^\s*[-*]\s+([A-Za-zÀ-ÿ]+)\s*$/.exec(l))
  .filter(Boolean)
  .map(m => m[1].toUpperCase()));
