# Word Fleet Dictionaries

All of Word Fleet's word data lives here.

| File | What it is |
| --- | --- |
| `languages.json` | Languages offered in the app's **Language** menu. Add a line to add a language. `short` (optional) is the name shown in the menu; `name` is used in messages. |
| `en-US.json`, `en-GB.json` | American and British English word lists (2–5 letter words, ranked by how common they are). Generated; don't edit by hand. |
| `es.json`, `de.json` | Spanish and German word lists, same shape. Generated; don't edit by hand. |
| `build-en.js` | Builds `en-US.json` / `en-GB.json` from SCOWL. |
| `build-hunspell.js` | Builds `es.json` / `de.json` from Hunspell dictionaries and frequency lists. |
| `offensive-en-US.txt`, `offensive-en-GB.txt`, `offensive-es.txt`, `offensive-de.txt` | Possibly offensive words (the GB file adds British words to the US list). Hidden from both captains unless **Possibly Offensive Words OK** is checked. Edit freely, then rebuild. |
| `fleet-names.json` | Fleet-name parts (adjectives and nouns) for English (UK), Spanish and German, used by the fleet-name dice. English (US) is built into `mobile/app.js`. Hand-edited; see `_about` inside for the format. |
| `BANNED.md` | Banned words (the slurs): removed from the dictionaries and kept out when they are rebuilt. A word can be banned in one language only. |
| `NEVER-SUGGESTED.md` | Words a captain may type but the game never suggests or draws (e.g. FUCK). Marked as `neverSuggest` in each dictionary. |
| `lists.js` | Reads `BANNED.md` and `NEVER-SUGGESTED.md` for the build scripts. |
| `words.xml` | The original word list used by the printable Pen & Paper Battle Tracker. |
| `SCOWL-LICENSE.txt`, `LDNOOBW-LICENSE.txt`, `HUNSPELL-es-LICENSE.txt`, `HUNSPELL-de-LICENSE.txt` | Licenses for the source word lists. |

## Where the words come from

### English (US and UK)

[SCOWL](http://wordlist.aspell.net) (Spell Checker Oriented Word Lists), the free word list behind most open-source American English spell checkers. Only its plain "words" lists are used, so there are no proper nouns, abbreviations or contractions. That matches the Rules of Engagement.

SCOWL ranks every word by size: 10 is the most common, 95 the most obscure. Word Fleet groups those sizes into tiers:

| Tier | SCOWL sizes | Used for |
| --- | --- | --- |
| `common` | 10–20 | AI Captain **Captain Rubber Duck** (PIANO, JUMP, BED) |
| `everyday` | 35–40 | AI Captain **Captain Steady** (WHARF, HOOF, KEG) |
| `rare` | 50–60 | AI Captain **Captain Lexicon** (GLYPH, YURT, ASP) |
| `extra` | 70 | Accepted when the Human Captain picks their own words; never chosen by the AI Captain |

The Human Captain may use any word from any tier. Auto-generated words for both captains come from the tier that matches the chosen rank.

The possibly offensive list starts from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) (CC BY 4.0), plus a few additions.

## Rebuilding

```sh
curl -LO https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
tar xzf scowl-2020.12.07.tar.gz
node dictionaries/build-en.js scowl-2020.12.07/final US
node dictionaries/build-en.js scowl-2020.12.07/final GB
```

English (UK) uses SCOWL's British spellings (COLOUR, GREY, AXE) in place of the American ones, with the same tiers.

### Spanish and German

Each word must be accepted by a Hunspell spell-checker dictionary ([wooorm/dictionaries](https://github.com/wooorm/dictionaries): Spanish from the RLA-ES project, German from igerman98 by Björn Jacke; see the `HUNSPELL-*-LICENSE.txt` files). Words are then ranked by how often they appear in film and TV subtitles ([FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave, CC BY-SA 4.0, built from OpenSubtitles).

| Tier | Frequency rank | Used for |
| --- | --- | --- |
| `common` | most frequent 30% | Captain Rubber Duck |
| `everyday` | next 35% | Captain Steady |
| `rare` | last 35% | Captain Lexicon |
| `extra` | see below | Human Captain only |

The letter picker is A–Z, so Spanish accents are dropped (CAFÉ plays as CAFE), as in Spanish crosswords, and words with Ñ are left out. German words with Ä, Ö, Ü or ß are left out. Two-letter words outside the common tier, and German capitalized words that might be names, go in `extra`.

```sh
npm i nspell
curl -LO https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_full.txt
# and index.aff / index.dic from wooorm/dictionaries/dictionaries/es (likewise for de)
node dictionaries/build-hunspell.js es index.aff index.dic es_full.txt
```

## Adding a language

1. Produce `<code>.json` in the same shape as `en-US.json`: `{ lang, name, tiers: { common, everyday, rare, extra }, offensive, neverSuggest }`. Each tier maps a word length (2–5) to an uppercase word array, with letters A–Z only.
2. Add `{ "code": "<code>", "name": "<Display Name>", "file": "<code>.json" }` to `languages.json`.
3. Add the file to the `SHELL` list in `mobile/sw.js` so it works offline.
