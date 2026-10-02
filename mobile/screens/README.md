# Mobile Mode screens

Reference names for the screens of Mobile Mode (`mobile/index.html`), so a screen can be
referred to by name when asking for changes. Each has a number and a reference snapshot in this folder.

| Name | In the code | Snapshot | What it is |
| --- | --- | --- | --- |
| **001 Mobile Home** | `<section id="scrMobileHome" data-screen="001 Mobile Home">`, `SCREENS.home` | `001-mobile-home.png` | First screen of the app: WORD FLEET title, Mobile Mode tag, blurb, New Battle and Rules of Engagement buttons. |
| **002 Prepare for Battle** | `<section id="scrSetup" data-screen="002 Prepare for Battle">`, `SCREENS.setup` | `002-prepare-for-battle.png` | Step 1 of 3: fleet name (with dice) and language. |
| **003 Choose Your Opponent** | `<section id="scrOpponent" data-screen="003 Choose Your Opponent">`, `SCREENS.opponent` | `003-choose-your-opponent.png` | Step 2 of 3: the AI Captain's rank (Ensign, Commander, Admiral). |
| **004 Choose Your Words** | `<section id="scrWords" data-screen="004 Choose Your Words">`, `SCREENS.words` | `004-choose-your-words.png` | Step 3 of 3: Auto-Generated or Captain's Choice, the five word-ships, Possibly Offensive Words OK, Deploy Fleet. |
| **005 Deploy** | `<section id="scrDeploy" data-screen="005 Deploy">`, `SCREENS.deploy` | `005-deploy.png`, `005-deploy-placed.png` | Place the five word-ships on your Defense Grid: Across/Down, Scatter, Clear, the roster of ships, Confirm Deployment, Change Words. Drag a ship to move it; double-tap its first letter to turn it. |
