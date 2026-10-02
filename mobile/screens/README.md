# Mobile Mode screens

Screens are named `NNN-MOBILE-NAME` in the order players see them. A parked screen has no number.

Reference names for the screens of Mobile Mode (`mobile/index.html`), so a screen can be
referred to by name when asking for changes. Each has a reference snapshot in this folder.

| Name | In the code | Snapshot | What it is |
| --- | --- | --- | --- |
| **MOBILE-HOME** *(parked)* | `<section id="scrMobileHome" data-screen="MOBILE-HOME">`, `SCREENS.home` | `mobile-home.png` | **Parked, not shown to players.** Kept for later use. Was the first screen: WORD FLEET title, Mobile Mode tag, blurb, New Battle and Rules of Engagement buttons. The app now opens on 001-MOBILE-PREPARE. |
| **001-MOBILE-PREPARE** | `<section id="scrSetup" data-screen="001-MOBILE-PREPARE">`, `SCREENS.setup` | `001-mobile-prepare.png` | **First screen players see.** Title "Welcome Captain! Prepare for Battle". "Roll the die or type your own fleet name" (with dice), "Choose your language". Screens 001-003 use large, easy-to-read text (`.setup-big`). |
| **002-MOBILE-OPPONENT** | `<section id="scrOpponent" data-screen="002-MOBILE-OPPONENT">`, `SCREENS.opponent` | `002-mobile-opponent.png` | The three AI Captains (Captain Rubber Duck, Captain Steady, Captain Lexicon), each with a short character sketch. |
| **003-MOBILE-WORD-SHIPS** | `<section id="scrWords" data-screen="003-MOBILE-WORD-SHIPS">`, `SCREENS.words` | `003-mobile-word-ships.png` | Possibly Offensive Words OK at the top; the five word-ships arrive drawn for your opponent and are editable, each with a ↻ redraw; Refresh All; Deploy Fleet checks every word against the dictionary. |
| **004-MOBILE-DEPLOY** | `<section id="scrDeploy" data-screen="004-MOBILE-DEPLOY">`, `SCREENS.deploy` | `004-mobile-deploy.png`, `004-mobile-deploy-placed.png` | Place the five word-ships on your Defense Grid: Across/Down, Scatter, Clear, the roster of ships, Confirm Deployment, Change Words. Drag a ship to move it; double-tap its first letter to turn it. |
