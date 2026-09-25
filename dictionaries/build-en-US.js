#!/usr/bin/env node
/*
  Builds dictionaries/en-US.json from SCOWL (Spell Checker Oriented Word Lists).
  Download: https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
  Usage:    node dictionaries/build-en-US.js path/to/scowl-2020.12.07/final

  SCOWL ranks words by size: 10 = most common ... 95 = most obscure.
  Only the "words" lists are used, so proper nouns (upper), abbreviations and
  contractions are left out, as the Rules of Engagement require.

  Tiers (the AI Captain draws its fleet from one tier per difficulty):
    common    sizes 10-20   Ensign
    everyday  sizes 35-40   Commander
    rare      sizes 50-60   Admiral
    extra     size  70      accepted for the Human Captain, never chosen by the AI Captain
*/
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('usage: build-en-US.js <scowl>/final'); process.exit(1); }

const TIERS = { common: [10, 20], everyday: [35, 40], rare: [50, 55, 60], extra: [70] };
// Letter plurals and unit symbols that SCOWL lists as lowercase words.
const JUNK = new Set('cs es gs ks ls ms ps rs ss ts kb lm ln lx mb mf hes'.split(' '));
// Possibly offensive words: kept in the word list but flagged, so the game can hide them
// unless "Possibly Offensive Words OK" is checked. Edit offensive-en-US.txt to change the list.
const OFFENSIVE = new Set(fs.readFileSync(path.join(__dirname, 'offensive-en-US.txt'), 'utf8')
  .split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')));

function read(file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'latin1').split(/\r?\n/);
}

const seen = new Set();
const out = { lang: 'en-US', name: 'English (US)', source: 'SCOWL 2020.12.07 by Kevin Atkinson (http://wordlist.aspell.net) - see SCOWL-LICENSE.txt', lengths: [2, 5], tiers: {}, offensive: [] };
for (const [tier, sizes] of Object.entries(TIERS)) {
  const byLen = { 2: [], 3: [], 4: [], 5: [] };
  for (const size of sizes) {
    for (const f of ['english-words.' + size, 'american-words.' + size]) {
      for (const w of read(f)) {
        if (!/^[a-z]{2,5}$/.test(w) || JUNK.has(w) || seen.has(w)) continue;
        seen.add(w);
        byLen[w.length].push(w.toUpperCase());
      }
    }
  }
  Object.values(byLen).forEach(a => a.sort());
  out.tiers[tier] = byLen;
}
out.offensive = [...OFFENSIVE].filter(w => seen.has(w)).map(w => w.toUpperCase()).sort();

const dest = path.join(__dirname, 'en-US.json');
fs.writeFileSync(dest, JSON.stringify(out));
for (const [t, byLen] of Object.entries(out.tiers)) {
  console.log(t.padEnd(9), Object.entries(byLen).map(([l, a]) => l + ':' + a.length).join('  '));
}
console.log('offensive', out.offensive.length);
console.log('wrote', dest, fs.statSync(dest).size, 'bytes');
