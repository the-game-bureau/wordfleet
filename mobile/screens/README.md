# Mobile Mode screens

Reference names for the screens of Mobile Mode (`mobile/index.html`), so a screen can be
referred to by name when asking for changes. Each has a number and a reference snapshot in this folder.

| Name | In the code | Snapshot | What it is |
| --- | --- | --- | --- |
| **001 Mobile Home** | `<section id="scrMobileHome" data-screen="001 Mobile Home">`, `SCREENS.home` | `001-mobile-home.png` | First screen of the app: WORD FLEET title, Mobile Mode tag, blurb, New Battle and Rules of Engagement buttons. |
| **002 Prepare for Battle** | `<section id="scrSetup" data-screen="002 Prepare for Battle">`, `SCREENS.setup` | `002-prepare-for-battle.png` | Fleet setup: fleet name, language, offensive-words checkbox, word-ships (auto or Captain's Choice), AI Captain's rank, Deploy Fleet. |
| **003 Deploy** | `<section id="scrDeploy" data-screen="003 Deploy">`, `SCREENS.deploy` | `003-deploy.png`, `003-deploy-placed.png` | Place the five word-ships on your Defense Grid: Across/Down, Scatter, Clear, the roster of ships, Confirm Deployment, Change Words. Drag a ship to move it; double-tap its first letter to turn it. |
