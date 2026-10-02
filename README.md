# WordFleet
Sink or Spell

- **Website:** https://thegamebureau.com/wordfleet/
- **Mobile Mode (Human Captain vs AI Captain):** https://thegamebureau.com/wordfleet/mobile/ (source in `mobile/`)
- **Word lists:** `dictionaries/` (see `dictionaries/README.md`)

## Mobile app

`mobile/` is Word Fleet on a phone: a Human Captain against an AI Captain. Mobile Mode plays a letter-calling version of the game (Pen & Paper Mode keeps the original firing rules):

- Each turn, a captain calls one letter. Every square in the opponent's fleet holding that letter is revealed, wherever it is, and the tally is announced. Then the turn passes.
- Vowels can be called and reveal the same way, but the caller loses their next turn.
- Solve a Word: after calling a letter that is in the opponent's fleet, a captain may name a whole word-ship; if right, the entire word is revealed.
- Win by revealing every letter of the opponent's fleet, or by Demand Surrender (name every word-ship and where it sits; anything wrong loses).
- The Human Captain always goes first. The AI Captain's rank sets how common its words are (Ensign → common, Commander → everyday, Admiral → rare) and how cleverly it calls letters: Ensign calls almost at random, vowels and all; Commander and Admiral read the revealed letters against the dictionary, avoid vowels, and solve words.
- Installable: open it on a phone and choose *Add to Home Screen*. It runs full screen and works offline after the first visit.
- The Human Captain can use auto-generated words or their own. Their own words must be in the chosen language's dictionary.
- Sound effects and background music, all synthesized in the browser (no audio files). Each can be switched on or off in the menu.
- Games save on the device, so a battle can be resumed later.

To run it locally, serve the repo root, e.g. `npx http-server .`, then open `/mobile/`.
