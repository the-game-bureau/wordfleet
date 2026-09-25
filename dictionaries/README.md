# Word Fleet Dictionaries

All of Word Fleet's word data lives here.

| File | What it is |
| --- | --- |
| `languages.json` | Languages offered in the app's **Language** menu. Add a line to add a language. |
| `en-US.json` | American English word list used by the app (2–5 letter words, ranked by how common they are). Generated; don't edit by hand. |
| `build-en-US.js` | Builds `en-US.json` from SCOWL. |
| `offensive-en-US.txt` | Possibly offensive words. Hidden from both captains unless **Possibly Offensive Words OK** is checked. Edit freely, then rebuild. |
| `words.xml` | The original word list used by the printable Pen & Paper Battle Tracker. |
| `SCOWL-LICENSE.txt`, `LDNOOBW-LICENSE.txt` | Licenses for the source word lists. |

## Where the words come from

[SCOWL](http://wordlist.aspell.net) (Spell Checker Oriented Word Lists), the free word list behind most open-source American English spell checkers. Only its plain "words" lists are used, so there are no proper nouns, abbreviations or contractions. That matches the Rules of Engagement.

SCOWL ranks every word by size: 10 is the most common, 95 the most obscure. Word Fleet groups those sizes into tiers:

| Tier | SCOWL sizes | Used for |
| --- | --- | --- |
| `common` | 10–20 | AI Captain rank **Ensign** (PIANO, JUMP, BED) |
| `everyday` | 35–40 | AI Captain rank **Commander** (WHARF, HOOF, KEG) |
| `rare` | 50–60 | AI Captain rank **Admiral** (GLYPH, YURT, ASP) |
| `extra` | 70 | Accepted when the Human Captain picks their own words; never chosen by the AI Captain |

The Human Captain may use any word from any tier. Auto-generated words for both captains come from the tier that matches the chosen rank.

The possibly offensive list starts from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) (CC BY 4.0), plus a few additions.

## Rebuilding

```sh
curl -LO https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
tar xzf scowl-2020.12.07.tar.gz
node dictionaries/build-en-US.js scowl-2020.12.07/final
```

## Adding a language

1. Produce `<code>.json` in the same shape as `en-US.json`: `{ lang, name, tiers: { common, everyday, rare, extra }, offensive }`. Each tier maps a word length (2–5) to an uppercase word array, with letters A–Z only.
2. Add `{ "code": "<code>", "name": "<Display Name>", "file": "<code>.json" }` to `languages.json`.
3. Add the file to the `SHELL` list in `mobile/sw.js` so it works offline.
