import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../../../', import.meta.url);
const lengths = [5, 4, 3, 3, 2];
const columns = 'ABCDEFGHIJ';
const manifestRows = ['ABCD', 'EFG', 'HIJK', 'LMNOP', 'QRS', 'TUV', 'WX', 'YZ'];
const count = 50;

export const game = {
  title: 'The Word Fleet Game Notebook',
  author: 'Kevin Kolb',
  publisher: 'The Game Bureau',
  subtitle: 'Sink or Spell.',
  website: 'thegamebureau.com/wordfleet',
  sheetCount: count,
  samplerSheetCount: 2,
  publicSampler: new URL('src/media/word-fleet-sampler.pdf', root),
  rules: new URL('rules-of-engagement.html', root),
  cover: {
    file: new URL('src/media/wfbg.webp', root),
    type: 'image/webp',
    alt: 'Two Word Fleet warships at sea',
  },
  assets: {
    'src/media/battle-sheet-preview.webp': {
      file: new URL('src/media/battle-sheet-preview.webp', root),
      type: 'image/webp',
    },
  },
  stylesheet: new URL('battle-sheet.css', import.meta.url),
  template: new URL('battle-sheet.html', import.meta.url),
  createSheets,
  validateSheets,
  renderSheet,
};

async function loadPools() {
  const [xml, englishJson] = await Promise.all([
    readFile(new URL('dictionaries/words.xml', root), 'utf8'),
    readFile(new URL('dictionaries/en-US.json', root), 'utf8'),
  ]);
  const english = JSON.parse(englishJson);
  const excluded = new Set([...english.offensive, ...english.neverSuggest]);
  const pools = {};

  // The legacy dictionary uses WordLength groups containing plain ASCII Word elements.
  for (const [, length, group] of xml.matchAll(/<WordLength length="([2-5])">([\s\S]*?)<\/WordLength>/g)) {
    const allowed = new Set([...english.tiers.common[length], ...english.tiers.everyday[length]]);
    const words = [...group.matchAll(/<Word>\s*([A-Z]+)\s*<\/Word>/gi)].map(match => match[1].toUpperCase());
    pools[length] = [...new Set(words)].filter(word =>
      word.length === Number(length) && allowed.has(word) && !excluded.has(word));
  }
  return pools;
}

function fleetKey(words) {
  return [...words].sort().join(' ');
}

function pick(words) {
  return words[randomInt(words.length)];
}

async function createSheets() {
  const pools = await loadPools();
  const [two, three, four, five] = [2, 3, 4, 5].map(length => pools[length] ?? []);
  if (two.length * four.length * five.length * three.length * (three.length - 1) / 2 < count) {
    throw new Error('The dictionaries do not contain enough eligible Word Fleet words.');
  }

  const fleets = new Set();
  const availableCodes = Array.from({ length: 1000 }, (_, number) => String(number).padStart(3, '0'));
  const sheets = [];
  while (sheets.length < count) {
    const firstThree = pick(three);
    const words = [pick(five), pick(four), firstThree, pick(three.filter(word => word !== firstThree)), pick(two)];
    const key = fleetKey(words);
    if (fleets.has(key)) continue;

    fleets.add(key);
    const codes = Array.from({ length: 5 }, () => availableCodes.splice(randomInt(availableCodes.length), 1)[0]);
    sheets.push({ words, codes });
  }
  return sheets;
}

function validateSheets(sheets) {
  if (!Array.isArray(sheets) || sheets.length !== count) {
    throw new Error('A Word Fleet edition must have ' + count + ' battle sheets.');
  }
  const fleets = new Set();
  const codes = new Set();
  for (const [index, sheet] of sheets.entries()) {
    const { words, codes: sheetCodes } = sheet ?? {};
    if (!Array.isArray(words) || words.length !== lengths.length || new Set(words).size !== words.length
        || !words.every((word, i) => typeof word === 'string' && /^[A-Z]+$/.test(word) && word.length === lengths[i])) {
      throw new Error('Invalid word-ships on Word Fleet sheet ' + (index + 1) + '.');
    }
    if (!Array.isArray(sheetCodes) || sheetCodes.length !== 5
        || !sheetCodes.every(code => typeof code === 'string' && /^\d{3}$/.test(code))) {
      throw new Error('Invalid launch codes on Word Fleet sheet ' + (index + 1) + '.');
    }
    fleets.add(fleetKey(words));
    for (const code of sheetCodes) codes.add(code);
  }
  if (fleets.size !== sheets.length || codes.size !== sheets.length * 5) {
    throw new Error('Word Fleet fleets and launch codes must be unique within an edition.');
  }
}

function grid(label) {
  const headings = [...columns].map(letter => '<th scope="col">' + letter + '</th>').join('');
  const rows = Array.from({ length: 10 }, (_, index) =>
    '<tr><th scope="row">' + (index + 1) + '</th>' + '<td></td>'.repeat(columns.length) + '</tr>');

  return '<table class="coordinate-grid" aria-label="' + label + '">'
    + '<colgroup><col><col span="10"></colgroup><thead><tr><td></td>' + headings + '</tr></thead><tbody>'
    + rows.join('') + '</tbody></table>';
}

function manifest(counts) {
  const rows = manifestRows.map(row => {
    const cells = [...row].map(letter => {
      const vowel = 'AEIOU'.includes(letter) ? ' vowel' : '';
      const countLabel = counts ? '<span class="manifest-count">' + (counts[letter] ?? 0) + '</span>' : '';
      return '<span class="manifest-cell' + vowel + '"><strong>' + letter + '</strong>' + countLabel + '</span>';
    });
    return '<div class="manifest-row">' + cells.join('') + '</div>';
  });
  return '<div class="manifest">' + rows.join('') + '</div>';
}

function renderSheet(template, sheet, index) {
  const counts = {};
  for (const letter of sheet.words.join('')) counts[letter] = (counts[letter] ?? 0) + 1;
  const fields = {
    number: index + 1,
    lengths: lengths.map(length => '<span>' + length + '</span>').join(''),
    attackGrid: grid('Attack Grid'),
    attackManifest: manifest(),
    defenseGrid: grid('Defense Grid'),
    defenseManifest: manifest(counts),
    words: sheet.words.join(' / '),
    codes: sheet.codes.join(' '),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(fields, key)) throw new Error('Unknown battle sheet field: ' + key);
    return fields[key];
  });
}
