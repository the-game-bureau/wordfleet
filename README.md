# WordFleet
Sink or Spell

- **Website:** https://thegamebureau.com/wordfleet/
- **Mobile app (Human Captain vs AI Captain):** https://thegamebureau.com/wordfleet/mobile/ (source in `mobile/`)
- **Word lists:** `dictionaries/` (see `dictionaries/README.md`)

## Mobile app

`mobile/` is the printed Battle Tracker turned into a phone app. You play against an AI Captain, and every part of the paper game is there: Who Goes First? launch codes, attack and defense grids, alpha strikes, letter tallies, the attack and defense manifests, and Demand Surrender.

- Installable: open it on a phone and choose *Add to Home Screen*. It runs full screen and works offline after the first visit.
- The AI Captain's rank sets how common its words are (Ensign → common, Commander → everyday, Admiral → rare) and how sharply it hunts.
- The Human Captain can use auto-generated words or their own. Their own words must be in the chosen language's dictionary.
- Games save on the device, so a battle can be resumed later.

To run it locally, serve the repo root, e.g. `npx http-server .`, then open `/mobile/`.
