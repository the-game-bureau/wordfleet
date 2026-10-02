# Banned words

Words on this list are **removed from every Word Fleet dictionary** (all languages). Unlike the
possibly-offensive lists, which hide words unless "Allow possibly offensive words" is on, a banned
word never appears in the game at all: the AI Captain can't draw it and a captain can't type it.

The dictionary build scripts (`build-en.js`, `build-hunspell.js`) read this file and leave out every
word listed below, so a banned word can't come back when the dictionaries are rebuilt. To ban another
word, add it as a list item (one word per line, any case, plurals and spellings listed separately),
then rebuild the dictionaries as described in `README.md`.

## Banned

- spic
- spics
- spick
- spicks
