const studio = document.getElementById('publishing');
const generate = document.getElementById('generate');
const downloads = document.getElementById('downloads');
const status = document.getElementById('status');

async function connect() {
  try {
    const response = await fetch('edition');
    if (!response.ok) throw new Error('The local publishing server is unavailable.');
    const book = await response.json();
    document.getElementById('book-title').textContent = book.title + ' · Edition ' + book.edition;
    document.getElementById('book-details').textContent =
      book.sheetCount + ' battle sheets in the full book. ' + book.samplerSheetCount + ' in the sampler.';
    studio.hidden = false;
    status.textContent = '';
  } catch {
    status.textContent = 'Run npm run book:preview and open the local URL printed in the terminal.';
  }
}

generate.addEventListener('click', async () => {
  generate.disabled = true;
  downloads.hidden = true;
  status.textContent = 'Generating the book and sampler…';
  try {
    const response = await fetch('build', { method: 'POST' });
    if (!response.ok) throw new Error(await response.text());
    downloads.hidden = false;
    status.textContent = 'Both PDFs are ready to download.';
  } catch (error) {
    status.textContent = 'Could not generate the PDFs. ' + error.message;
  } finally {
    generate.disabled = false;
  }
});

connect();
