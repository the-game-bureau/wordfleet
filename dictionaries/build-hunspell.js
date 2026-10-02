#!/usr/bin/env node
/*
  Builds dictionaries/es.json and dictionaries/de.json.

  Words must pass a Hunspell spell-checker dictionary (so they are real, correctly
  spelled words) and are ranked by how often they appear in a word-frequency list
  (so the AI Captain can pick common words at low difficulty and rare ones at high).

  Sources (see README.md for licenses):
    Hunspell dictionaries   https://github.com/wooorm/dictionaries  (dictionaries/es, dictionaries/de)
    Frequency lists         https://github.com/hermitdave/FrequencyWords  (content/2018/<lang>/<lang>_full.txt)

  Usage:
    npm i nspell
    node dictionaries/build-hunspell.js es path/to/es.aff path/to/es.dic path/to/es_full.txt
    node dictionaries/build-hunspell.js de path/to/de.aff path/to/de.dic path/to/de_full.txt

  The game's letter picker is A-Z, so:
    Spanish  accents are dropped (á -> A, ü -> U), as in Spanish crosswords; words with Ñ are left out.
    German   words with Ä, Ö, Ü or ß are left out.

  Proper nouns are left out. In Spanish only lowercase dictionary words count. German capitalizes
  every noun, so a capitalized German word counts as a common noun only when the dictionary gives it
  a plural or "-es" ending or forms compounds (Haus, Hund, Hand, Auto); others (Oma, but also Peter, Berlin)
  goes in the "extra" tier, which the Human Captain may use but the AI Captain never draws from.

  Tiers are cut by frequency rank among the playable 2-5 letter words:
    common    most frequent 30%
    everyday  next 35%
    rare      last 35%
    extra     German capitalized words that might be names (see above)
  Words seen fewer than 30 times in the frequency list are left out.
*/
const fs = require('fs');
const path = require('path');
const nspell = require('nspell');

const LANGS = {
  es: { name: 'Español (Spanish)', offensive: 'offensive-es.txt' },
  de: { name: 'Deutsch (German)', offensive: 'offensive-de.txt' },
};
// Tier cut points, as fractions of the ranked playable words.
const CUTS = [['common', 0.3], ['everyday', 0.65], ['rare', 1]];
const MIN_COUNT = 30;   // rarer than this in the frequency list is mostly typos and names
// Abbreviations the Spanish dictionary lists as plain words.
const JUNK = new Set('SRA SRES SRTA LDO LDA DRA DRES ARQ PAG PAGS TEL ETC VOL'.split(' '));

const [code, affFile, dicFile, freqFile] = process.argv.slice(2);
const L = LANGS[code];
if (!L || !freqFile) { console.error('usage: build-hunspell.js <es|de> <aff> <dic> <freq.txt>'); process.exit(1); }

const dic = fs.readFileSync(dicFile, 'utf8');
const spell = nspell(fs.readFileSync(affFile, 'utf8'), dic);

// German: capitalized dictionary entries and their flags.
const nounFlags = {};
if (code === 'de') {
  for (const line of dic.split('\n')) {
    const m = /^([A-ZÄÖÜ][^/\s]*)(?:\/(\S+))?/.exec(line);
    if (m) nounFlags[m[1]] = (nounFlags[m[1]] || '') + (m[2] || '');
  }
}
// Plural/-es endings, or (i, j) compound-forming flags, mark a common noun; names have neither.
const NOUN = /[ENPpRqTfij]/;

function toGame(w) {
  if (code === 'es') {
    if (/ñ/.test(w)) return null;
    w = w.normalize('NFD').replace(/[́̈]/g, '').normalize('NFC');
  }
  w = w.toLowerCase();
  if (!/^[a-z]{2,5}$/.test(w) || !/[aeiouy]/.test(w)) return null;   // no vowel: an abbreviation
  return JUNK.has(w.toUpperCase()) ? null : w.toUpperCase();
}

// Returns 'noun-s' for German capitalized words with only an -s ending, true for a playable word.
function playable(w) {
  if (spell.correct(w)) return true;
  if (code === 'de') {
    const cap = w[0].toUpperCase() + w.slice(1);
    if (nounFlags[cap] !== undefined && spell.correct(cap)) return NOUN.test(nounFlags[cap]) ? true : 'noun-s';
  }
  return false;
}

// Banned words (BANNED.md) never make it into the dictionary; never-suggested words (NEVER-SUGGESTED.md)
// stay in it but are marked so the game never draws them.
const listFor = require('./lists');
const BANNED = listFor('BANNED.md', code), NEVER = listFor('NEVER-SUGGESTED.md', code);
const OFFENSIVE = new Set(fs.readFileSync(path.join(__dirname, L.offensive), 'utf8')
  .split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(toGame).filter(Boolean));

const seen = new Set();
const ranked = [], extraOnly = [];
for (const line of fs.readFileSync(freqFile, 'utf8').split('\n')) {
  const [raw, n] = line.trim().split(/\s+/);
  if (!raw || +n < MIN_COUNT) continue;
  const w = raw.toLowerCase();
  const G = toGame(w);
  if (!G || BANNED.has(G) || seen.has(G)) continue;
  const ok = playable(w);
  if (!ok) continue;
  seen.add(G);
  (ok === 'noun-s' ? extraOnly : ranked).push(G);
}

const out = { lang: code, name: L.name,
  source: 'Hunspell ' + code + ' dictionary (github.com/wooorm/dictionaries) ranked by FrequencyWords (github.com/hermitdave/FrequencyWords) - see README.md',
  lengths: [2, 5], tiers: {}, offensive: [] };
const tierOf = i => CUTS.find(([, end]) => i < end * ranked.length)[0];
for (const t of ['common', 'everyday', 'rare', 'extra']) out.tiers[t] = { 2: [], 3: [], 4: [], 5: [] };
// Two-letter words outside the common tier are mostly letter names and interjections (PU, JE):
// fine for the Human Captain, but the AI Captain shouldn't hide them.
ranked.forEach((w, i) => { const t = tierOf(i); out.tiers[w.length === 2 && t !== 'common' ? 'extra' : t][w.length].push(w); });
extraOnly.forEach(w => out.tiers.extra[w.length].push(w));
for (const byLen of Object.values(out.tiers)) Object.values(byLen).forEach(a => a.sort());
out.offensive = [...OFFENSIVE].filter(w => seen.has(w)).sort();
out.neverSuggest = [...NEVER].filter(w => seen.has(w)).sort();

const dest = path.join(__dirname, code + '.json');
fs.writeFileSync(dest, JSON.stringify(out));
for (const [t, byLen] of Object.entries(out.tiers)) {
  console.log(t.padEnd(9), Object.entries(byLen).map(([l, a]) => l + ':' + a.length).join('  '));
}
console.log('offensive', out.offensive.length, 'never suggested', out.neverSuggest.length);
console.log('wrote', dest, fs.statSync(dest).size, 'bytes');
