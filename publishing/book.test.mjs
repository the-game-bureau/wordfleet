import assert from 'node:assert/strict';
import test from 'node:test';
import { renderBook } from './book.mjs';
import { game } from './games/word-fleet/game.mjs';

test('a generated edition contains valid, unique fleets and codes', async () => {
  const sheets = await game.createSheets();
  game.validateSheets(sheets);
  assert.equal(sheets.length, 50);

  const edited = structuredClone(sheets);
  edited[1].codes[0] = edited[0].codes[0];
  assert.throws(() => game.validateSheets(edited), /unique/);
});

test('the book and sampler render the same saved sheets and canonical rules', async () => {
  const sheets = await game.createSheets();
  const book = {
    game,
    edition: { edition: 'v1', sheets },
    files: { book: 'book.pdf', sampler: 'sampler.pdf' },
  };
  const sheetElements = (markup) => [...markup.matchAll(
    /<section class="print-page sheet"[\s\S]*?<\/section>/g,
  )].map(match => match[0]);

  const [full, sampler] = await Promise.all([renderBook(book, 'book'), renderBook(book, 'sampler')]);
  const fullSheets = sheetElements(full);
  assert.equal(fullSheets.length, 50);
  assert.deepEqual(sheetElements(sampler), fullSheets.slice(0, 2));
  assert.equal(full, await renderBook(book, 'book'));
  assert.match(full, /<h1>Rules of Engagement<\/h1>/);
  assert.match(sampler, /<h2>Demand surrender<\/h2>/);
  assert.match(fullSheets[0], /<span class="name-line" aria-label="Blank fleet name"><\/span>/);
});
