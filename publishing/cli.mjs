import { copyFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBook, renderBook, exportBook } from './book.mjs';

const [, , command, game, edition] = process.argv;
const address = '127.0.0.1';
const port = Number(process.env.WORD_FLEET_PREVIEW_PORT ?? 8787);
const origin = 'http://' + address + ':' + port;
const files = {
  '/admin/': ['text/html; charset=utf-8', new URL('../admin/index.html', import.meta.url)],
  '/admin/admin.js': ['text/javascript; charset=utf-8', new URL('../admin/admin.js', import.meta.url)],
  '/admin/icon.ico': ['image/x-icon', new URL('../src/media/wf.ico', import.meta.url)],
};

function send(response, code, contentType, body, headers = {}) {
  response.writeHead(code, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

function servePreview(book) {
  let build;
  const server = createServer(async (request, response) => {
    if (request.headers.host !== address + ':' + port) {
      return send(response, 400, 'text/plain', 'Open the local preview URL printed in the terminal.');
    }
    const path = new URL(request.url, origin).pathname;
    try {
      if (request.method === 'POST' && path === '/admin/build') {
        if (request.headers.origin !== origin) return send(response, 403, 'text/plain', 'Open the local preview before exporting.');
        build ??= exportBook(book).finally(() => { build = undefined; });
        await build;
        return send(response, 200, 'application/json', JSON.stringify(book.files));
      }

      if (request.method !== 'GET') return send(response, 405, 'text/plain', 'Method not allowed.');
      if (path === '/' || path === '/admin') return send(response, 302, 'text/plain', '', { Location: '/admin/' });
      if (Object.hasOwn(files, path)) {
        const [type, file] = files[path];
        return send(response, 200, type, await readFile(file));
      }
      if (path === '/admin/edition') {
        return send(response, 200, 'application/json', JSON.stringify({
          title: book.game.title,
          edition: book.edition.edition.toUpperCase(),
          sheetCount: book.edition.sheets.length,
          samplerSheetCount: book.game.samplerSheetCount,
        }));
      }
      const preview = path.match(/^\/admin\/preview\/(book|sampler)$/);
      if (preview) return send(response, 200, 'text/html; charset=utf-8', await renderBook(book, preview[1]));

      const download = path.match(/^\/admin\/files\/(book|sampler)\.pdf$/);
      if (download) {
        const filename = book.files[download[1]];
        const buffer = await readFile(join(book.directory, filename));
        return send(response, 200, 'application/pdf', buffer, {
          'Content-Disposition': 'attachment; filename="' + filename + '"',
        });
      }

      return send(response, 404, 'text/plain', 'Page not found.');
    } catch (error) {
      if (error.code === 'ENOENT' && path.startsWith('/admin/files/')) {
        return send(response, 404, 'text/plain', 'Select Generate Book to create the PDFs.');
      }
      console.error(error);
      return send(response, 500, 'text/plain; charset=utf-8', error.message);
    }
  });
  server.on('error', error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, address, () => console.log('Local publishing preview: ' + origin + '/admin/'));
}

try {
  if (!['build', 'preview', 'stage-sampler'].includes(command)) {
    throw new Error('Choose build, preview, or stage-sampler.');
  }
  if (command === 'preview' && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new Error('WORD_FLEET_PREVIEW_PORT must be a valid TCP port.');
  }
  const book = await openBook(game, edition);
  console.log('Saved edition: ' + book.editionFile);
  if (command === 'build') {
    await exportBook(book);
    for (const file of Object.values(book.files)) console.log(join(book.directory, file));
  } else if (command === 'stage-sampler') {
    if (!book.game.publicSampler) throw new Error('Set a public sampler path in this game’s configuration.');
    try {
      await copyFile(join(book.directory, book.files.sampler), book.game.publicSampler);
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error('Build the edition before staging its sampler.');
      throw error;
    }
    console.log('Storefront sampler: ' + fileURLToPath(book.game.publicSampler));
  } else {
    servePreview(book);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
