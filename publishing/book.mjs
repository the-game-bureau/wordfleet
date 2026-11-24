import { link, mkdir, mkdtemp, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const editionRoot = join(root, 'publishing', 'editions');
const outputRoot = join(root, 'output', 'pdf');

export async function openBook(slug = 'word-fleet', editionId = 'v1') {
  const validName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!validName.test(slug) || !validName.test(editionId)) {
    throw new Error('Use lowercase words, numbers, and hyphens for the game and edition names.');
  }
  const { game } = await import('./games/' + slug + '/game.mjs');
  const directory = join(editionRoot, slug);
  const path = join(directory, editionId + '.json');
  await mkdir(directory, { recursive: true });

  let edition;
  try {
    edition = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;

    const sheets = await game.createSheets();
    game.validateSheets(sheets);
    const candidate = { schema: 1, game: slug, edition: editionId, sheets };
    const temporary = await mkdtemp(join(directory, '.new-'));
    const prepared = join(temporary, basename(path));
    try {
      await writeFile(prepared, JSON.stringify(candidate, null, 2) + '\n');
      // Link the complete file into place without replacing an existing edition.
      try { await link(prepared, path); } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    } finally {
      await rm(prepared, { force: true });
      await rmdir(temporary);
    }
    edition = JSON.parse(await readFile(path, 'utf8'));
  }

  if (edition.schema !== 1 || edition.game !== slug || edition.edition !== editionId) {
    throw new Error('The saved edition metadata does not match ' + slug + ' ' + editionId + '.');
  }
  game.validateSheets(edition.sheets);

  return {
    game,
    edition,
    editionFile: path,
    directory: join(outputRoot, slug, editionId),
    files: {
      book: slug + '-' + editionId + '-book.pdf',
      sampler: slug + '-' + editionId + '-sampler.pdf',
    },
  };
}

const escape = (value) => String(value).replace(/[&<>"]/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

export async function renderBook(book, kind) {
  if (!Object.hasOwn(book.files, kind)) throw new Error('Unknown book export: ' + kind);
  const { game, edition } = book;
  const [rulesPage, layout, gameStyles, sheetTemplate, cover] = await Promise.all([
    readFile(game.rules, 'utf8'),
    readFile(new URL('book.css', import.meta.url), 'utf8'),
    readFile(game.stylesheet, 'utf8'),
    readFile(game.template, 'utf8'),
    readFile(game.cover.file, 'base64'),
  ]);
  const rules = rulesPage.match(/<!-- book:rules -->([\s\S]*?)<!-- \/book:rules -->/);
  if (!rules) throw new Error('Add book:rules markers around the game’s rulebook content.');

  const title = escape(game.title);
  const editionLabel = 'Edition ' + escape(edition.edition.toUpperCase());
  const sampler = kind === 'sampler';
  const sheets = sampler ? edition.sheets.slice(0, game.samplerSheetCount) : edition.sheets;
  const coverHtml = sampler
    ? '<header class="sampler-header"><p class="edition-label">' + title + ' · Free sampler</p></header>'
    : '<header class="print-page cover-page"><p class="cover-publisher">' + escape(game.publisher)
      + '</p><h1>' + title + '</h1><p class="cover-subtitle">' + escape(game.subtitle)
      + '</p><img class="cover-art" alt="' + escape(game.cover.alt) + '" src="data:' + escape(game.cover.type)
      + ';base64,' + cover + '"><footer><p>A game by ' + escape(game.author) + '</p><p>'
      + editionLabel + ' · ' + sheets.length + ' battle sheets</p><p>' + escape(game.website) + '</p></footer></header>';

  let rulesHtml = rules[1];
  // Embed the rulebook’s image so preview and export can use the same self-contained document.
  for (const [path, asset] of Object.entries(game.assets)) {
    const base64 = await readFile(asset.file, 'base64');
    rulesHtml = rulesHtml.replaceAll('src="' + path + '"', 'src="data:' + asset.type + ';base64,' + base64 + '"');
  }

  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + title
    + ' | ' + (sampler ? 'Free sampler' : editionLabel) + '</title><style>' + layout + '\n' + gameStyles
    + '</style></head><body>' + (sampler ? '<div class="book-rules">' + coverHtml : coverHtml + '<div class="book-rules">')
    + rulesHtml + '</div>' + sheets.map((sheet, index) => game.renderSheet(sheetTemplate, sheet, index)).join('\n')
    + '</body></html>';
}

async function openBrowser() {
  const executablePath = process.env.WORD_FLEET_BROWSER_PATH;
  if (executablePath) return chromium.launch({ executablePath });

  const attempts = [{}, { channel: 'msedge' }, { channel: 'chrome' }];
  const errors = [];
  for (const options of attempts) {
    try { return await chromium.launch(options); } catch (error) {
      errors.push(error.message.split('\n')[0]);
    }
  }
  throw new Error('The PDF export could not start Chromium, Edge, or Chrome. '
    + 'Install one of those browsers or set WORD_FLEET_BROWSER_PATH.\n' + errors.join('\n'));
}

export async function exportBook(book) {
  const documents = await Promise.all(Object.keys(book.files).map(async kind => [kind, await renderBook(book, kind)]));
  await mkdir(book.directory, { recursive: true });
  const temporary = await mkdtemp(join(book.directory, '.build-'));
  let browser;
  try {
    browser = await openBrowser();
    const page = await browser.newPage({ viewport: { width: 720, height: 960 } });
    await page.emulateMedia({ media: 'print' });
    for (const [kind, html] of documents) {
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.sheet')]
        .findIndex(sheet => sheet.getBoundingClientRect().height > 960));
      if (overflow >= 0) throw new Error('Battle sheet ' + (overflow + 1) + ' exceeds the Letter print area.');
      await page.pdf({ path: join(temporary, book.files[kind]), preferCSSPageSize: true, printBackground: true });
    }
    for (const file of Object.values(book.files)) {
      await rename(join(temporary, file), join(book.directory, file));
    }
  } finally {
    await browser?.close();
    await Promise.all(Object.values(book.files).map(file => rm(join(temporary, file), { force: true })));
    await rmdir(temporary);
  }
}
