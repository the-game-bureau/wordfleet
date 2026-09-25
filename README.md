# WordFleet
Sink or Spell

- **Website:** https://thegamebureau.com/wordfleet/
- **Mobile app (Human Captain vs AI Captain):** https://thegamebureau.com/wordfleet/mobile/ (source in `mobile/`)
- **Word lists:** `dictionaries/` (see `dictionaries/README.md`)

## Mobile app

`mobile/` is the printed Battle Tracker turned into a phone app. You play against an AI Captain, and the paper game is all there: attack and defense grids, alpha strikes, letter tallies, the attack and defense manifests, and Demand Surrender. Against the AI Captain, the Human Captain always fires first, so there's no launch-code round.

- Installable: open it on a phone and choose *Add to Home Screen*. It runs full screen and works offline after the first visit.
- Solve a Word: after calling a letter that is in the opponent's fleet, a captain may name a whole word-ship; if right, the entire word fills in. The AI Captain does this too (Commander and Admiral).
- Wheel of Fortune letter fill: whatever letter a captain calls in an Alpha Strike fills in on every square of the opponent's fleet that has already been hit and holds it. Unhit squares stay hidden; when one is hit later, a called letter shows at once (no Alpha Strike needed). This works for both captains.
- The AI Captain's rank sets how common its words are (Ensign → common, Commander → everyday, Admiral → rare) and how sharply it hunts, from random shots (Ensign), through Battleship-style hunt-and-target on a checkerboard (Commander), to probability-density targeting that also rules out placements no dictionary word fits (Admiral).
- The Human Captain can use auto-generated words or their own. Their own words must be in the chosen language's dictionary.
- Sound effects and background music, all synthesized in the browser (no audio files). Each can be switched on or off in the menu.
- Games save on the device, so a battle can be resumed later.

To run it locally, serve the repo root, e.g. `npx http-server .`, then open `/mobile/`.
