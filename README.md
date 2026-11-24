# WordFleet
Sink or Spell

- **Website:** https://thegamebureau.com/wordfleet/
- **Mobile Mode (Human Captain vs AI Captain):** https://thegamebureau.com/wordfleet/mobile/ (source in `mobile/`)
- **Word lists:** `dictionaries/` (see `dictionaries/README.md`)

## Publish a game book

Use Node.js 22 or newer and Chrome or Edge for local PDF export.

1. Run `npm ci` once to install the publishing tools.
2. Run `npm run book:preview` and open the localhost URL it prints. The preview lets you read the Letter-size pages, generate both PDFs, and download them.
3. Edit the rules in `rules-of-engagement.html` and the sheet layout in `publishing/games/word-fleet/battle-sheet.html` and `battle-sheet.css`. Reload the preview to see the changes.
4. Run `npm run book:build` to export from the terminal. Edition V1 creates a full book with 50 battle sheets and a free sampler with two, both under `output/pdf/word-fleet/v1/`.
5. After printing and checking the sampler, run `npm run book:stage-sampler` to copy it to the storefront download. Upload the full book to your checkout provider when it is ready for sale.

The first build or preview saves the actual word-ships and launch codes in `publishing/editions/word-fleet/v1.json`. Later builds reuse those sheets. Back up that file with the released PDF. For a new batch of games, run `npm run book:build -- word-fleet v2`. Use the same game and edition arguments with the preview and sampler commands.

Keep the private PDFs and edition data out of the public deployment. Git ignores both output folders. The storefront links to the staged sampler and displays the placeholder checkout.

### Start another game

Use `publishing/games/word-fleet/` as the example for a new game folder with a lowercase hyphenated name. Set its title, author, cover, rules page, sheet counts, and optional public sampler path in `game.mjs`. Give it its own sheet template, styles, and the three functions for generating, validating, and rendering sheets. Wrap the rules content in `<!-- book:rules -->` and `<!-- /book:rules -->` so both the website and PDF use the same text. Then run `npm run book:preview -- your-game v1`.

The shared `publishing/book.css` sets the Letter page size, document layout, and page breaks. For a printed notebook, use the printer's trim, binding margins, and cover template to prepare and proof a separate print edition.

## Mobile app

`mobile/` is Word Fleet on a phone: a Human Captain against an AI Captain. Mobile Mode plays a letter-calling version of the game (Pen & Paper Mode keeps the original firing rules):

- Each turn, a captain taps a hidden square on the Attack Grid and calls a letter. Every square in the enemy fleet holding that letter is revealed, wherever it is.
- Bonus turn: if the letter is in the square that was tapped, the captain goes again; otherwise the turn passes.
- Vowels can be called and reveal the same way, but the caller loses their next turn.
- Solve a Word: after calling a letter that is in the enemy fleet, a captain may name a whole word-ship; if right, the entire word is revealed.
- Win by revealing every letter of the enemy fleet, or by Demand Surrender (name every word-ship and where it sits; anything wrong loses).
- The Human Captain always goes first. Your choice of AI Captain sets how common its words are (Captain Rubber Duck → common, Captain Steady → everyday, Captain Lexicon → rare) and how cleverly it calls letters: Captain Rubber Duck calls almost at random, vowels and all; Captain Steady and Captain Lexicon read the revealed letters against the dictionary, avoid vowels, and solve words.
- Installable: open it on a phone and choose *Add to Home Screen*. It runs full screen and works offline after the first visit.
- The Human Captain can use auto-generated words or their own. Their own words must be in the chosen language's dictionary.
- Sound effects and background music, all synthesized in the browser (no audio files). Each can be switched on or off in the menu.
- Games save on the device, so a battle can be resumed later.

To run it locally, serve the repo root, e.g. `npx http-server .`, then open `/mobile/`.
