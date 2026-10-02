# Banned words

Words on this list are **removed from every Word Fleet dictionary** (all languages). Unlike the
possibly-offensive lists, which hide words unless "Allow possibly offensive words" is on, a banned
word never appears in the game at all: the AI Captain can't draw it and a captain can't type it.

The dictionary build scripts (`build-en.js`, `build-hunspell.js`) read this file and leave out every
word listed below, so a banned word can't come back when the dictionaries are rebuilt. To ban another
word, add it as a list item (one word per line, any case, plurals and spellings listed separately),
then rebuild the dictionaries as described in `README.md`.

A word banned in one language only gets that language's code after it in brackets, e.g.
`- negro (en)`: NEGRO is a slur in English but simply "black" in Spanish (likewise WOG is German for "weighed", FAGOT Spanish for "bassoon"). Codes: `en` (both English
dictionaries), `en-US`, `en-GB`, `es`, `de`. Words with no code are banned in every language.

## Banned

Slurs: words aimed at a people, a sexuality or a disability. (Ordinary profanity and body words are
not banned; they stay on the possibly-offensive lists.)

### Ethnicity, race and religion

- boong
- boongs
- chink
- chinks
- coon
- coons
- dago
- dagos
- darkie
- darkies
- darky
- gook
- gooks
- gyp
- gyps
- gypped
- gypsy (en)
- gypsies (en)
- honkey
- honkies
- honky
- kike
- kikes
- kraut (en)
- krauts (en)
- mick (en)
- micks (en)
- negro (en)
- negroes (en)
- neger (de)
- nigga
- niggas
- nigger
- niggers
- spic
- spics
- spick
- spicks
- squaw
- squaws
- wog (en)
- wogs (en)
- wop
- wops
- yid
- yids

### Sexuality

- dyke
- dykes
- fag
- fags
- faggot
- faggots
- fagot (en)
- fagots (en)
- homo (en)
- homos (en)
- poof
- poofs
- poofter
- ponce (en)
- ponces (en)

### Disability

- gimp
- gimps
- gimpy
- mong
- mongs
- mongo
- mongos
