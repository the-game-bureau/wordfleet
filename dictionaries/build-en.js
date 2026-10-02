#!/usr/bin/env node
/*
  Builds dictionaries/en-US.json and dictionaries/en-GB.json from SCOWL (Spell Checker Oriented Word Lists).
  Download: https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
  Usage:    node dictionaries/build-en.js path/to/scowl-2020.12.07/final US
            node dictionaries/build-en.js path/to/scowl-2020.12.07/final GB

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
const V = { US: { code: 'en-US', name: 'English (US)', words: 'american-words.' },
            GB: { code: 'en-GB', name: 'English (UK)', words: 'british-words.' } }[process.argv[3] || 'US'];
if (!dir || !V) { console.error('usage: build-en.js <scowl>/final <US|GB>'); process.exit(1); }

const TIERS = { common: [10, 20], everyday: [35, 40], rare: [50, 55, 60], extra: [70] };
// Letter plurals and unit symbols that SCOWL lists as lowercase words.
const JUNK = new Set('cs es gs ks ls ms ps rs ss ts kb lm ln lx mb mf hes'.split(' '));
// Possibly offensive words: kept in the word list but flagged, so the game can hide them
// unless "Possibly Offensive Words OK" is checked. Edit offensive-en-US.txt (both) or
// offensive-en-GB.txt (British additions) to change the list.
const OFFENSIVE = new Set((V.code === 'en-GB' ? ['offensive-en-US.txt', 'offensive-en-GB.txt'] : ['offensive-en-US.txt'])
  .flatMap(f => fs.readFileSync(path.join(__dirname, f), 'utf8').split(/\r?\n/))
  .map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')));

function read(file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'latin1').split(/\r?\n/);
}

const seen = new Set();
const out = { lang: V.code, name: V.name, source: 'SCOWL 2020.12.07 by Kevin Atkinson (http://wordlist.aspell.net) - see SCOWL-LICENSE.txt', lengths: [2, 5], tiers: {}, offensive: [] };
for (const [tier, sizes] of Object.entries(TIERS)) {
  const byLen = { 2: [], 3: [], 4: [], 5: [] };
  for (const size of sizes) {
    for (const f of ['english-words.' + size, V.words + size]) {
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

const dest = path.join(__dirname, V.code + '.json');
fs.writeFileSync(dest, JSON.stringify(out));
for (const [t, byLen] of Object.entries(out.tiers)) {
  console.log(t.padEnd(9), Object.entries(byLen).map(([l, a]) => l + ':' + a.length).join('  '));
}
console.log('offensive', out.offensive.length);
console.log('wrote', dest, fs.statSync(dest).size, 'bytes');
