/* ============================================================
   WORD FLEET - mobile app
   The printed Battle Tracker, played by a Human Captain against an AI Captain.
   Grid: A-J across, 1-10 down. Five word-ships per fleet.
   ============================================================ */
(function () {
  'use strict';

  var COLS = 'ABCDEFGHIJ';
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var VOWELS = 'AEIOU';
  var NATO = { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu' };
  var NUMBERS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  var SPECS = [
    { cls: 'KETCH', len: 5 },
    { cls: 'SHIP', len: 4 },
    { cls: 'SUB', len: 3 },
    { cls: 'ARK', len: 3 },
    { cls: 'PT', len: 2 }
  ];
  var FLEET_CELLS = 17;
  var FREQ = 'EAORTISNLUDCPMHBGYFWKVXZJQ';
  var STORE = 'wordfleet-app-v1';
  var RECORD = 'wordfleet-app-record';

  // Difficulty = how common the AI Captain's words are, and how cleverly it calls letters.
  // Keys stay ensign/commander/admiral so saved games keep working; players see the names.
  var LEVELS = {
    ensign:    { name: 'Captain Rubber Duck',    tiers: ['common'],  
                 hint: 'A cheerful rookie who has never sailed beyond the bathtub. Hides everyday words anyone knows and calls letters on a hunch, vowels and all.',
                 pattern: false, vowelCost: 1, noise: 1 },
    commander: { name: 'Captain Steady', tiers: ['everyday'],
                 hint: 'A dependable old hand who has seen a few storms. Hides familiar words, calls sensible consonants, and aims where your revealed letters point.',
                 pattern: true, vowelCost: 0.45, noise: 0.15 },
    admiral:   { name: 'Captain Lexicon',   tiers: ['rare'],    
                 hint: 'A walking dictionary with a periscope. Hides rare words that are hard to crack, studies every letter you reveal, and almost never wastes a turn on a vowel.',
                 pattern: true, vowelCost: 0.3, noise: 0.05 }
  };

  // Color schemes offered on 001: a dark first color and a light second color that reads clearly as text
  // on the first. No greens or teals: green belongs to the game's own colors.
  // Every pair is at least 7:1 contrast (WCAG AAA). Saved as S.colors; where they apply is decided later.
  // The AI Captain always flies one scheme: bright background, dark text (the reverse of every player
  // scheme), in a hue no player scheme uses. 7.5:1 contrast. Mirrored as --foe / --foe-ink in app.css.
  var FOE_SCHEME = { id: 'signal-orange', name: 'Signal Orange & Black', colors: ['#ff7f27', '#111111'] };

  var COLOR_SCHEMES = [
    { id: 'plum-peach',      name: 'Plum & Peach',      colors: ['#4a1942', '#ffc9a8'] },   // 9.4:1
    { id: 'crimson-gold',    name: 'Crimson & Gold',    colors: ['#7a1216', '#ffd24a'] },   // 7.6:1
    { id: 'charcoal-sky',    name: 'Charcoal & Sky',    colors: ['#262626', '#9fd3ff'] },   // 9.5:1
    { id: 'midnight-silver', name: 'Midnight & Silver', colors: ['#1e1b4b', '#d9dde4'] },   // 11.7:1
    { id: 'ocean-sand',      name: 'Ocean & Sand',      colors: ['#023e66', '#f4dc9c'] }    // 8.3:1
  ];

  var FLEET_ADJ = ['Salty', 'Barnacle-Crusted', 'Rum-Soaked', 'Royal', 'Crabby', 'Peg-Legged', 'Stormy', 'Treacherous', 'Cursed', 'Ghostly', 'Iron-Bound', 'Sea-Worn', 'Soggy-Bottom', 'Windswept', 'Ironclad', 'Thunderhead', 'Bloodwake', 'Scurvy', "Admiral's", "Commodore's", 'Steel-Hulled', 'Storm-Battered', 'Salt-Crusted', 'Rust-Stained', 'Sun-Bleached', 'Cannon-Heavy', 'Torpedo-Laden', 'Merciless', 'Grog-Fueled', 'Hook-Handed', "Kraken's", "Siren's", "Neptune's", 'Abyssal', 'Phantom', 'Half-Sunk', 'Creaking', 'Patched-Up', 'Battle-Scarred'];
  var FLEET_NOUN = ['Armada', 'Fleet', 'Flotilla', 'Squadron', 'Convoy', 'Navy', 'Task Force', 'Krewe', 'Battlegroup', 'Regatta', 'Patrol', 'Strike Force', 'Vanguard', 'Blockade', 'Tempest', 'Gale', 'Maelstrom', 'Admiralty', 'Legion', 'Brotherhood', 'Alliance', 'Trench', 'Reef', 'Harbor', 'Siege', 'Bombardment', 'Expedition', 'Voyage', 'Odyssey',
                    'Wolfpack', 'Corsairs', 'Privateers', 'Buccaneers', 'Marauders', 'Raiders', 'Escort', 'Picket Line', 'Dreadnoughts', 'Mariners'];

  // Used only if the word list cannot be fetched (first launch while offline).
  var FALLBACK = {
    2: ['TO', 'GO', 'BE', 'OR', 'IN', 'ON', 'AT', 'UP', 'NO', 'SO', 'IF', 'MY', 'WE', 'OF', 'IS', 'IT', 'AS', 'BY', 'DO', 'HE', 'AM', 'AN', 'ME', 'US', 'OX'],
    3: ['BED', 'RUN', 'CAT', 'DOG', 'SEA', 'SUN', 'MAP', 'OAK', 'JAM', 'FOX', 'OWL', 'BOX', 'ICE', 'KEY', 'FIG', 'HAT', 'NET', 'PIG', 'ROW', 'TOP', 'WAY', 'COW', 'BAT', 'GUM', 'LID'],
    4: ['JUMP', 'SHIP', 'FROG', 'LEFT', 'SAIL', 'WAVE', 'ROPE', 'MAST', 'DECK', 'TIDE', 'FISH', 'GOLD', 'STAR', 'MOON', 'BELL', 'CORN', 'DUCK', 'HORN', 'KITE', 'LAMP'],
    5: ['PIANO', 'ZEBRA', 'NORTH', 'SHORE', 'STORM', 'OCEAN', 'CRANE', 'BREAD', 'CLOCK', 'DREAM', 'FLAME', 'GRAPE', 'HOUSE', 'LEMON', 'MAPLE', 'NIGHT', 'PLANT', 'QUEEN', 'RIVER', 'TIGER']
  };

  // ------------------------------------------------------------
  // helpers
  // ------------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function sfx(name, delay) { if (window.WFAudio) window.WFAudio.play(name, delay); }
  function key(r, c) { return r + ':' + c; }
  function unkey(k) { var p = k.split(':'); return { r: +p[0], c: +p[1] }; }
  function coord(r, c) { return COLS[c] + (r + 1); }
  function callOut(r, c) { return NATO[COLS[c]] + '-' + NUMBERS[r]; }
  function coordK(k) { var p = unkey(k); return coord(p.r, p.c); }
  function callK(k) { var p = unkey(k); return callOut(p.r, p.c); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pad3(n) { return ('00' + n).slice(-3); }
  function countOf(word, L) { var n = 0; for (var i = 0; i < word.length; i++) if (word[i] === L) n++; return n; }
  // Fleet names in other languages come from dictionaries/fleet-names.json (see its _about).
  var fleetNames = {};
  function fleetNameOnce(set) {
    if (!set) return pick(FLEET_ADJ) + ' ' + pick(FLEET_NOUN);
    var n = pick(set.noun), g = n.charAt(1) === ':' ? n.charAt(0) : '', a = pick(set.adj);
    if (g) n = n.slice(2);
    if (a.indexOf('|') !== -1) a = a.split('|')[g === 'f' ? 1 : 0];                       // Spanish m|f
    else if (a.slice(-1) === '-') a = a.slice(0, -1) + ({ m: 'er', f: 'e', n: 'es' }[g] || 'e'); // German endings
    return set.order === 'noun adj' ? n + ' ' + a : a + ' ' + n;
  }
  // The AI Captain's fleet name shares no word with yours (KRAKEN'S REEF never meets KRAKEN'S ARMADA or SALTY REEF).
  function foeFleetName(mine) {
    var words = function (n) { return (n || '').toUpperCase().split(/[\s-]+/).map(function (w) { return w.replace(/[^A-ZÀ-Ý]/g, '').replace(/S$/, ''); }).filter(Boolean); };
    var taken = words(mine), name;
    for (var i = 0; i < 200; i++) {
      name = randomFleetName();
      if (!words(name).some(function (w) { return taken.indexOf(w) !== -1; })) return name;
    }
    return name;
  }

  function randomFleetName() {
    var set = fleetNames[(S && S.lang) || (lang && lang.code)], name;
    for (var i = 0; i < 20; i++) { name = fleetNameOnce(set); if (name.length <= 20) break; }   // short enough to read at a large size
    return name.toUpperCase();
  }
  function allSame(w) { return w.split('').every(function (ch) { return ch === w[0]; }); }

  // ------------------------------------------------------------
  // dictionary
  // One JSON file per language in /dictionaries, listed in dictionaries/languages.json.
  // Each file holds words in commonness tiers (see dictionaries/build-en.js and build-hunspell.js).
  // ------------------------------------------------------------
  var TIER_WEIGHT = { common: 4, everyday: 2, rare: 1, extra: 0.5 };
  var languages = [];   // dictionaries/languages.json
  var lang = null;      // { code, name, tiers, offensive }
  var offensiveSet = {};
  var unsafeSet = {};    // offensive words plus words built on them; never shown as examples
  var neverSet = {};     // dictionaries/NEVER-SUGGESTED.md: may be typed, never suggested or drawn
  var dictSet = {};     // every playable word -> tier name
  var guessPool = {};   // length -> [{ w, wt }] for the AI Captain's letter reads

  function loadFleetNames() {
    return fetch('../dictionaries/fleet-names.json')
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (d) { fleetNames = d || {}; }, function () {});
  }

  function loadDictionary(code) {
    return fetch('../dictionaries/languages.json')
      .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
      .then(function (list) {
        languages = list;
        var entry = list.filter(function (l) { return l.code === code; })[0] || list[0];
        return fetch('../dictionaries/' + entry.file).then(function (res) { return res.ok ? res.json() : Promise.reject(); });
      })
      .catch(function () {
        return { code: 'en-US', name: 'English (US)', tiers: { common: FALLBACK }, offensive: [] };
      })
      .then(function (d) {
        lang = d;
        lang.code = d.lang || d.code;
        if (!languages.length) languages = [{ code: lang.code, name: lang.name }];
        dictSet = {};
        guessPool = {};
        offensiveSet = {};
        (d.offensive || []).forEach(function (w) { offensiveSet[w] = true; });
        neverSet = {};
        (d.neverSuggest || []).forEach(function (w) { neverSet[w] = true; });
        // Words built on an offensive stem of 4+ letters (FICK -> FICKT) are kept out of examples.
        unsafeSet = {};
        var stems = (d.offensive || []).filter(function (w) { return w.length >= 4; });
        Object.keys(d.tiers).forEach(function (tier) {
          Object.keys(d.tiers[tier]).forEach(function (len) {
            d.tiers[tier][len].forEach(function (w) {
              if (dictSet[w]) return;
              dictSet[w] = tier;
              if (offensiveSet[w] || stems.some(function (st) { return w.indexOf(st) === 0; })) unsafeSet[w] = true;
              (guessPool[len] = guessPool[len] || []).push({ w: w, wt: TIER_WEIGHT[tier] || 1 });
            });
          });
        });
      });
  }

  function offensiveOk() { return !!(S && S.offensiveOk); }
  function allowed(w) { return !offensiveSet[w] || offensiveOk(); }
  function inDictionary(w) { return !!dictSet[w] && allowed(w); }

  // Example words for a captain on 002, one per word-ship (5, 4, 3, 3, 2 letters), from that captain's tier
  // of the chosen dictionary and never offensive. Kept per language and captain so they don't change on every tap.
  var exampleCache = {};
  function levelExamples(level) {
    var k = (lang && lang.code) + ':' + level;
    if (!exampleCache[k]) {
      var tiers = (LEVELS[level] || LEVELS.ensign).tiers, chosen = [];
      SPECS.forEach(function (spec) {
        var len = spec.len, pool = [];
        tiers.forEach(function (t) { var byLen = lang && lang.tiers[t]; if (byLen && byLen[len]) pool = pool.concat(byLen[len]); });
        // Short words are scarce outside the common tier (none at all in Spanish and German): use the common tier.
        if (pool.length < 3 && lang && lang.tiers.common && lang.tiers.common[len]) pool = pool.concat(lang.tiers.common[len]);
        pool = pool.filter(function (w) { return !unsafeSet[w] && !neverSet[w] && chosen.indexOf(w) === -1; });
        chosen.push(pool.length ? pick(pool) : pick(FALLBACK[len]));
      });
      exampleCache[k] = chosen.join(' \u2022 ');
    }
    return exampleCache[k];
  }

  // Words a fleet may be drawn from at this difficulty.
  function pickPool(len) {
    var tiers = (LEVELS[S && S.level] || LEVELS.ensign).tiers;
    var pool = [];
    tiers.forEach(function (t) {
      var byLen = lang && lang.tiers[t];
      if (byLen && byLen[len]) pool = pool.concat(byLen[len]);
    });
    // Two-letter words are scarce in every tier: top up from the common tier.
    if (pool.length < 12 && lang && lang.tiers.common && lang.tiers.common[len]) pool = pool.concat(lang.tiers.common[len]);
    // With offensive words off, drawn words also skip words built on an offensive stem.
    pool = pool.filter(function (w) { return !neverSet[w] && (offensiveOk() || !unsafeSet[w]); });
    return pool.length ? pool : FALLBACK[len];
  }

  function randomWords() {
    var chosen = [];
    return SPECS.map(function (spec, i) {
      var w = randomWordFor(i, chosen);
      chosen.push(w);
      return w;
    });
  }

  // With "Allow possibly offensive words" on, each drawn word has a small extra chance of being one
  // (from the same level; never-suggested words are already out of the pool).
  var OFFENSIVE_NUDGE = 0.10;
  function randomWordFor(i, others) {
    var pool = pickPool(SPECS[i].len);
    if (offensiveOk() && Math.random() < OFFENSIVE_NUDGE) {
      var rude = pool.filter(function (w) { return offensiveSet[w] && others.indexOf(w) === -1; });
      if (rude.length) return pick(rude);
    }
    var w, tries = 0;
    do { w = pick(pool); tries++; } while (others.indexOf(w) !== -1 && tries < 50);
    return w;
  }

  // ------------------------------------------------------------
  // fleets on a 10x10 grid
  // ------------------------------------------------------------
  function cellsOf(ship) {
    var out = [];
    for (var i = 0; i < ship.word.length; i++) {
      out.push(ship.dir === 'H' ? { r: ship.r, c: ship.c + i } : { r: ship.r + i, c: ship.c });
    }
    return out;
  }

  function boardOf(ships) {
    var b = {};
    ships.forEach(function (ship, idx) {
      if (ship.r == null) return;
      cellsOf(ship).forEach(function (p, i) { b[key(p.r, p.c)] = { letter: ship.word[i], ship: idx }; });
    });
    return b;
  }

  function fits(ships, idx, r, c, dir) {
    var len = ships[idx].word.length;
    if (dir === 'H' ? c + len > 10 : r + len > 10) return false;
    var others = boardOf(ships.map(function (s, i) { return i === idx ? { word: s.word, r: null } : s; }));
    for (var i = 0; i < len; i++) {
      var k = dir === 'H' ? key(r, c + i) : key(r + i, c);
      if (others[k]) return false;
    }
    return true;
  }

  function scatter(words) {
    for (var attempt = 0; attempt < 500; attempt++) {
      var ships = words.map(function (w) { return { word: w, r: null, c: null, dir: 'H' }; });
      var ok = ships.every(function (ship, idx) {
        for (var t = 0; t < 200; t++) {
          var dir = Math.random() < 0.5 ? 'H' : 'V';
          var r = rnd(10), c = rnd(10);
          if (fits(ships, idx, r, c, dir)) { ship.r = r; ship.c = c; ship.dir = dir; return true; }
        }
        return false;
      });
      if (ok) return ships;
    }
    return null;
  }

  function letterCounts(words) {
    var out = {};
    LETTERS.forEach(function (L) { out[L] = 0; });
    words.join('').split('').forEach(function (L) { out[L]++; });
    return out;
  }

  // ------------------------------------------------------------
  // state
  // ------------------------------------------------------------
  var S = null;         // saved game
  var draft = null;     // fleet setup in progress (lives inside S while deploying)
  var ui = { tab: 'Attack', sel: null, aiTimer: null, installEvt: null };

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* private mode: play on without saving */ }
  }
  function load() {
    try { var raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function record() {
    try { return JSON.parse(localStorage.getItem(RECORD)) || { won: 0, lost: 0 }; } catch (e) { return { won: 0, lost: 0 }; }
  }
  function bumpRecord(won) {
    var r = record();
    if (won) r.won++; else r.lost++;
    try { localStorage.setItem(RECORD, JSON.stringify(r)); } catch (e) { /* ignore */ }
  }

  function newGame() {
    S = {
      v: 2,
      phase: 'setup',
      level: (S && S.level) || 'ensign',
      lang: (S && S.lang) || (lang && lang.code) || 'en-US',
      offensiveOk: !!(S && S.offensiveOk),
      mode: (S && S.mode) || 'auto',
      colors: pick(COLOR_SCHEMES).id,   // a random scheme each new game; the captain can change it on 001
      me: { name: randomFleetName(), words: randomWords(), ships: null },
      foe: null,
      myShots: {}, myTallies: {},
      foeShots: {}, foeTallies: {},
      turn: null, incoming: [], lastFoe: null, skip: { me: false, foe: false }, notice: null,
      claims: null, log: [], turns: 0,
      winner: null, reason: null
    };
    // A new game starts clean: no aim, flip-ins, popups, banners or AI moves left over from the last one.
    ui.sel = null; ui.tab = 'Attack'; ui.flash = null; ui.demand = false; ui.dragged = false; ui.firstTap = null;
    clearTimeout(ui.flashTimer); clearTimeout(ui.bonusTimer); clearTimeout(ui.aiTimer); ui.aiTimer = null;
    var bb = $('bonusBanner'); if (bb) bb.hidden = true;
    save();
  }

  function log(who, text) {
    S.log.unshift({ who: who, text: text });
    if (S.log.length > 200) S.log.length = 200;
  }

  // ------------------------------------------------------------
  // screens + chrome
  // ------------------------------------------------------------
  var SCREENS = { home: 'scrMobileHome',   // "MOBILE-HOME"
                  setup: 'scrSetup',         // "001-MOBILE-PREPARE"
                  opponent: 'scrOpponent',   // "002-MOBILE-AI-CAPTAIN"
                  words: 'scrWords',         // "003-MOBILE-WORD-SHIPS"
                  deploy: 'scrDeploy',       // "004-MOBILE-DEPLOY"
                  // battle: tabs "005-MOBILE-ATTACK", "007-MOBILE-DEFENSE", "008-MOBILE-LOG"; sheet "006-MOBILE-CALL-LETTER";
                  // Attack panel "009-MOBILE-SURRENDER"; the Attack tab once the battle is over "010-MOBILE-GAME-OVER". Sheets "MOBILE-MENU", "MOBILE-RULES"
                  battle: 'scrBattle' };
  var current = 'home';

  function show(name) {
    current = name;
    if ($('notice')) $('notice').hidden = true;
    Object.keys(SCREENS).forEach(function (n) { var el = $(SCREENS[n]); if (el) el.classList.toggle('is-on', n === name); });
    window.scrollTo(0, 0);
    render();
  }

  // Header is always WORD FLEET / Mobile Mode; the chip shows where you are.
  function setBar(chip, cls) {
    var el = $('barChip');
    el.hidden = !chip;
    el.textContent = chip || '';
    el.className = 'chip' + (cls ? ' ' + cls : '');
  }

  // The music hunts while you're on the Attack Grid during battle.
  function setMusicMood() {
    if (window.WFAudio && window.WFAudio.setMood) window.WFAudio.setMood(current === 'battle' && S && S.phase === 'battle' && ui.tab === 'Attack' ? 'hunt' : 'main');
  }

  function render() {
    if (current === 'home') renderHome();
    else if (current === 'setup' || current === 'opponent' || current === 'words') renderSetup();
    else if (current === 'deploy') renderDeploy();
    else if (current === 'battle') renderBattle();
    applyFleetColors();
    refreshPanel();
    setMusicMood();
    fitButtons();
  }

  // Buttons are always one line: text that doesn't fit shrinks (down to 12px) instead of wrapping.
  function fitButtons(root) {
    var els = root ? root.querySelectorAll('.btn') : document.querySelectorAll('.screen.is-on .btn, #sheet:not([hidden]) .btn, #coach .btn');
    Array.prototype.forEach.call(els, function (el) {
      el.style.fontSize = '';
      if (!el.offsetParent || el.scrollWidth <= el.clientWidth) return;
      var size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth && size > 12) el.style.fontSize = (size -= 1) + 'px';
    });
    // A row of choices (the captains) shrinks together until the whole row fits its box.
    Array.prototype.forEach.call((root || document).querySelectorAll('.screen.is-on .seg'), function (seg) {
      var btns = seg.querySelectorAll('button');
      Array.prototype.forEach.call(btns, function (b) { b.style.fontSize = ''; });
      if (!seg.offsetParent || !btns.length) return;
      var size = parseFloat(getComputedStyle(btns[0]).fontSize);
      var tooWide = function () {
        return seg.scrollWidth > seg.clientWidth || Array.prototype.some.call(btns, function (b) { return b.scrollWidth > b.clientWidth; });
      };
      while (tooWide() && size > 10) {
        size -= 1;
        Array.prototype.forEach.call(btns, function (b) { b.style.fontSize = size + 'px'; });
      }
    });
  }
  window.addEventListener('resize', function () { fitButtons(); });

  var toastTimer = null;
  // A bonus turn gets a banner across the top and, on phones that can, a short buzz.
  function notifyBonus(msg) {
    var el = $('bonusBanner');
    el.textContent = msg;
    el.hidden = false;
    el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
    clearTimeout(ui.bonusTimer);
    ui.bonusTimer = setTimeout(function () { el.hidden = true; }, 3200);
    try { if (navigator.vibrate) navigator.vibrate([70, 50, 140]); } catch (e) { /* no buzz */ }
  }

  // Prepare-section notices look like the battle's coach bar: docked at the bottom, a round marker,
  // short bold text. toast() flashes one for a moment; setupNotice() keeps one up until it is cleared.
  function showNotice(msg, kind) {
    var el = $('notice');
    if (!msg) { el.hidden = true; return; }
    el.className = 'coach coach--notice' + (kind === 'warn' ? ' is-warn' : '');
    // First sentence bold, the rest as a smaller line underneath (like the coach bar's main and sub lines).
    var cut = msg.indexOf('. '), main = cut === -1 ? msg : msg.slice(0, cut + 1), rest = cut === -1 ? '' : msg.slice(cut + 2);
    el.innerHTML = '<span class="coach-step">' + (kind === 'warn' ? '!' : 'i') + '</span><div class="coach-body"><div class="coach-main">' + esc(main) + '</div>' +
      (rest ? '<div class="coach-sub">' + esc(rest) + '</div>' : '') + '</div>';
    el.hidden = false;
  }
  function toast(msg) {
    clearTimeout(toastTimer);
    showNotice(msg, 'warn');
    toastTimer = setTimeout(function () { if (!$('setupNote').textContent) showNotice(''); else setupNotice($('setupNote').textContent); }, 2400);
  }
  // The word-ship problem on 003 (kept in #setupNote for the logic, shown in the notice bar).
  function setupNotice(msg) {
    $('setupNote').textContent = msg || '';
    showNotice(msg && current === 'words' ? msg : '', 'warn');
  }

  var sheetDismissible = true;
  // name: the sheet's screen name (006-MOBILE-CALL-LETTER, MOBILE-MENU, MOBILE-RULES).
  function openSheet(html, dismissible, name) {
    sheetDismissible = dismissible !== false;
    $('sheet').setAttribute('data-screen', name || '');
    $('sheetBody').innerHTML = html;
    $('scrim').hidden = false;
    $('sheet').hidden = false;
    $('sheet').scrollTop = 0;
    fitButtons();
    refreshPanel();
  }
  function closeSheet() {
    $('sheet').setAttribute('data-screen', '');
    $('scrim').hidden = true;
    $('sheet').hidden = true;
    $('sheetBody').innerHTML = '';
    refreshPanel();
  }

  // ------------------------------------------------------------
  // grid painter
  // ------------------------------------------------------------
  // corner: optional HTML for the empty top-left cell (the Attack Grid tucks its ABC button there).
  function paint(el, cellFn, tappable, corner) {
    var html = corner || '<div class="cell is-corner"></div>';
    for (var c = 0; c < 10; c++) html += '<div class="cell is-label">' + COLS[c] + '</div>';
    for (var r = 0; r < 10; r++) {
      html += '<div class="cell is-label">' + (r + 1) + '</div>';
      for (c = 0; c < 10; c++) {
        var o = cellFn(r, c) || {};
        var tag = tappable && !o.off ? 'button' : 'div';
        html += '<' + tag + (tag === 'button' ? ' type="button"' : '') +
          ' class="cell ' + (o.cls || '') + '" data-k="' + key(r, c) + '" aria-label="' + coord(r, c) + '">' +
          (o.text || '') + '</' + tag + '>';
      }
    }
    el.innerHTML = html;
  }

  // ------------------------------------------------------------
  // HOME
  // ------------------------------------------------------------
  function renderHome() {
    setBar(null);
    var live = S && S.phase !== 'over' && S.phase !== 'setup';
    $('btnContinue').hidden = !live;
    $('btnNew').className = 'btn btn--wide ' + (live ? '' : 'btn--primary');
    var r = record();
    $('homeRecord').textContent = r.won + r.lost ? 'SERVICE RECORD: ' + r.won + ' WON / ' + r.lost + ' LOST' : '';
  }

  // Pick up where the player left off; anything else starts fresh at 001-MOBILE-PREPARE.
  function resume() {
    if (!S) { newGame(); return show('setup'); }
    if (S.phase === 'setup') show(S.setupStep || 'setup');
    else if (S.phase === 'deploy') show('deploy');
    else show('battle');   // battle, or over (010-MOBILE-GAME-OVER is the battle screen's final state)
  }

  // ------------------------------------------------------------
  // SETUP
  // ------------------------------------------------------------
  function renderSetup() {
    setBar(null);
    if (document.activeElement !== $('inFleet')) $('inFleet').value = S.me.name;
    fitFleetName();
    $('selLang').innerHTML = languages.map(function (l) {
      return '<option value="' + esc(l.code) + '"' + (lang && l.code === lang.code ? ' selected' : '') + '>' + esc(l.short || l.name) + '</option>';   // short: the language's own name, fits small phones
    }).join('');
    $('selLang').disabled = languages.length < 2;
    renderSchemes();
    renderFleetTags();
    $('chkOffensive').checked = offensiveOk();
    setSeg('segLevel', S.level);
    $('levelHint').innerHTML = esc(LEVELS[S.level].hint) + ' <strong>e.g. ' + esc(levelExamples(S.level)) + '</strong>';
    var html = '<div class="words">';
    SPECS.forEach(function (spec, i) {
      var w = S.me.words[i] || '';
      html += '<div class="word"><div class="word-class"><b>' + spec.cls + '</b><span class="nowrap">' + spec.len + ' letters</span></div>';
      // Every word is editable; the ↻ redraws just that one.
      html += '<input class="input" data-word="' + i + '" maxlength="' + spec.len + '" value="' + esc(w) + '" ' +
        'autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="' + '_'.repeat(spec.len) + '">' +
        '<button class="btn btn--sq" type="button" data-reroll="' + i + '" aria-label="Redraw ' + spec.cls + '">\u21bb</button>';
      html += '</div>';
    });
    html += '</div>';
    $('wordList').innerHTML = html;
    Array.prototype.forEach.call($('wordList').querySelectorAll('[data-word]'), markWordInput);
    setupNotice('');
    fitButtons();
  }

  // Fleet initials for the flags: first letter of each word ("SALTY ARMADA" -> SA, "LEGIÓN DE LA SIRENA" -> LDLS).
  function fleetInitials(name) {
    return (name || '').trim().split(/\s+/).map(function (w) { return w.replace(/^[^A-Za-zÀ-ÿ]+/, '').charAt(0); }).join('').toUpperCase().slice(0, 5);
  }

  // A small waving flag on a short pole with a ball on top, in a color scheme: first color for the cloth, second for the fleet initials.
  function flagSvg(cs, initials) {
    var size = initials.length <= 2 ? 20 : initials.length === 3 ? 16 : 12;
    return '<svg viewBox="0 0 66 48" aria-hidden="true">' +
      '<rect x="3" y="7" width="2.5" height="38" rx="1" fill="#000"/>' +            // short pole
      '<circle cx="4.25" cy="5" r="3.2" fill="#000"/>' +                               // ball on top
      '<path d="M5.5 10 C22 5 40 15 63 10 L63 39 C40 44 22 34 5.5 39 Z" fill="' + cs.colors[0] + '" stroke="#000" stroke-width="1"/>' +
      '<text x="34" y="24.5" dy="0.35em" text-anchor="middle" font-family="Courier Prime, monospace" font-weight="700" font-size="' + size + '" fill="' + cs.colors[1] + '">' + esc(initials) + '</text>' +
      '</svg>';
  }

  function schemeOf(id) {
    return COLOR_SCHEMES.filter(function (cs) { return cs.id === id; })[0] || COLOR_SCHEMES[0];
  }

  // Under the header on 002-004: your flag and fleet name, so the chosen colors show from here on.
  function renderFleetTags() {
    var cs = schemeOf(S.colors), name = S.me.name || '';
    Array.prototype.forEach.call(document.querySelectorAll('[data-fleet-tag]'), function (el) {
      el.innerHTML = '<span class="fleet-tag-flag">' + flagSvg(cs, fleetInitials(name) || 'WF') + '</span><span class="fleet-tag-name">' + esc(name) + '</span>';
    });
  }

  // Your fleet's colors as CSS variables (--mine behind, --mine-ink for text), used by your side's banners.
  function applyFleetColors() {
    if (!S) return;
    var cs = schemeOf(S.colors), root = document.documentElement.style;
    root.setProperty('--mine', cs.colors[0]);
    root.setProperty('--mine-ink', cs.colors[1]);
  }

  function renderSchemes() {
    // A saved scheme that no longer exists gets a fresh random one.
    if (!COLOR_SCHEMES.some(function (cs) { return cs.id === S.colors; })) { S.colors = pick(COLOR_SCHEMES).id; save(); }
    var scheme = S.colors, initials = fleetInitials(S.me.name) || 'WF';
    $('colorSchemes').innerHTML = COLOR_SCHEMES.map(function (cs) {
      return '<button type="button" class="swatch' + (cs.id === scheme ? ' is-on' : '') + '" data-scheme="' + cs.id + '" role="radio" aria-checked="' + (cs.id === scheme) + '" aria-label="' + esc(cs.name) + '">' +
        flagSvg(cs, initials) + '</button>';
    }).join('');
    $('colorSchemeName').textContent = COLOR_SCHEMES.filter(function (cs) { return cs.id === scheme; })[0].name;
  }

  function setSeg(id, v) {
    Array.prototype.forEach.call($(id).children, function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === v); });
  }

  function wordProblem(w, len) {
    if (w.length !== len) return 'needs ' + len + ' letters';
    if (!/^[A-Z]+$/.test(w)) return 'letters only';
    if (allSame(w)) return "can't be one letter repeated";
    return null;
  }

  // Why word i can't sail, or null if it can. Checked when a word box loses focus and on Deploy.
  function wordMessage(i) {
    var w = S.me.words[i] || '', p = wordProblem(w, SPECS[i].len);
    if (p) return SPECS[i].cls + ' ' + p + '.';
    if (dictSet[w] && !allowed(w)) return w + ' may be offensive. Turn on "Allow possibly offensive words" to use it.';
    if (!inDictionary(w)) return w + " isn't in the " + lang.name + ' dictionary. Real words only, captain \u2014 no proper nouns or abbreviations.';
    return null;
  }

  // Green border once a word is complete and valid; red once it is complete and not, or after a check (strict).
  function markWordInput(input, strict) {
    var i = +input.getAttribute('data-word');
    var w = input.value;
    input.classList.remove('is-bad', 'is-good', 'is-offensive');
    // A possibly offensive word shows its letters in red (allowed or not).
    if (offensiveSet[w.toUpperCase()]) input.classList.add('is-offensive');
    if (!w && !strict) return;
    if (w.length === SPECS[i].len || strict) input.classList.add(wordMessage(i) ? 'is-bad' : 'is-good');
  }

  function checkWordInput(input) {
    markWordInput(input, true);
    var i = +input.getAttribute('data-word'), msg = wordMessage(i);
    if (msg) { setupNotice(msg); noteFor = i; }
    else if (noteFor === i) { setupNotice(''); noteFor = -1; }   // clear only this word's note
  }
  var noteFor = -1;   // which word the setup note is about

  function setupToDeploy() {
    var inputs = $('wordList').querySelectorAll('[data-word]'), first = -1;
    for (var i = 0; i < SPECS.length; i++) {
      if (inputs[i]) markWordInput(inputs[i], true);
      if (first < 0 && wordMessage(i)) first = i;
    }
    if (first >= 0) {
      setupNotice(wordMessage(first));
      noteFor = first;
      return;
    }
    S.me.ships = scatter(S.me.words);   // 004 opens with the fleet already deployed at random
    S.phase = 'deploy';
    save();
    show('deploy');
  }

  // ------------------------------------------------------------
  // DEPLOY
  // ------------------------------------------------------------
  function renderDeploy() {
    setBar(null);
    // The fleet is always on the grid (a game saved with ships in port gets a fresh layout).
    if (S.me.ships.some(function (s) { return s.r == null; })) { S.me.ships = scatter(S.me.words); save(); }
    $('deployFleetName').textContent = S.me.name || 'Your fleet';
    renderFleetTags();
    // The preview flies the fleet's colors: color 1 behind, color 2 for the text.
    var cs = schemeOf(S.colors);
    $('deployBanner').style.background = cs.colors[0];
    $('deployBanner').style.color = cs.colors[1];
    $('deployFrame').style.borderTopColor = cs.colors[0];
    var b = boardOf(S.me.ships);
    paint($('gridDeploy'), function (r, c) {
      var cell = b[key(r, c)];
      return cell ? { cls: 'is-ship', text: cell.letter } : {};
    }, true);
    fitButtons();
  }

  // Taps on 004: a double tap on a ship's first letter turns it between across and down.
  // (Moving is by drag; ships never leave the grid.)
  function deployTap(k) {
    var p = unkey(k);
    var ships = S.me.ships;
    var b = boardOf(ships);
    if (!b[k]) return;
    var idx = b[k].ship, ship = ships[idx];
    if (ship.r !== p.r || ship.c !== p.c) return;
    if (ui.firstTap && ui.firstTap.k === k) {
      clearTimeout(ui.firstTap.timer);
      ui.firstTap = null;
      var dir = ship.dir === 'H' ? 'V' : 'H';
      if (fits(ships, idx, ship.r, ship.c, dir)) { ship.dir = dir; sfx('rotate'); save(); renderDeploy(); }
      else { sfx('error'); toast(ship.word + " won't fit " + (dir === 'H' ? 'across' : 'down') + ' from ' + coord(ship.r, ship.c)); }
      return;
    }
    if (ui.firstTap) clearTimeout(ui.firstTap.timer);
    ui.firstTap = { k: k, timer: setTimeout(function () { ui.firstTap = null; }, 320) };
  }


  function confirmDeploy() {
    var foeWords = randomWords();
    S.foe = { name: foeFleetName(S.me.name), words: foeWords, ships: scatter(foeWords) };
    // Against the AI Captain, the Human Captain always fires first.
    startBattle('me');
  }

  // ------------------------------------------------------------
  // BATTLE
  // ------------------------------------------------------------
  function startBattle(first) {
    S.phase = 'battle';
    S.turn = first;
    log('sys', 'The Human Captain\'s ' + S.me.name + ' versus the AI Captain\'s ' + S.foe.name + '. The Human Captain fires first.');
    ui.tab = 'Attack';
    save();
    show('battle');
  }

  function foeBoard() { return boardOf(S.foe.ships); }
  function myBoard() { return boardOf(S.me.ships); }

  function bullCount(shots) {
    return Object.keys(shots).filter(function (k) { return shots[k].letter; }).length;
  }

  function renderBattle() {
    var mine = S.turn === 'me';
    setBar(null);   // whose turn it is shows in the Attack panel, not the header
    Array.prototype.forEach.call($('tabbar').children, function (b) { b.classList.toggle('is-on', b.getAttribute('data-tab') === ui.tab); });
    $('tabAttack').hidden = ui.tab !== 'Attack';
    $('tabDefense').hidden = ui.tab !== 'Defense';
    $('tabLog').hidden = ui.tab !== 'Log';
    $('defDot').hidden = !(S.lastFoe && S.lastFoe.unseen);
    renderAttack();
    renderDefense();
    renderLog();
    if (S.turn === 'foe' && !ui.aiTimer) ui.aiTimer = setTimeout(foeTurn, 1600);
  }

  function isVowel(L) { return VOWELS.indexOf(L) !== -1; }
  // A letters manifest: A to Z, vowels as round chips; the title row notes what a vowel costs.
  // chip(L, cls) returns one chip's HTML.
  function manifestHtml(label, left, chip) {
    return '<span class="uncalled-label"><span>' + label + '</span>' +
      (left.some(isVowel) ? '<span class="uc-vowels-cap">Vowels: \u22121 turn</span>' : '') + '</span>' +
      left.map(function (L) { return chip(L, 'uc' + (isVowel(L) ? ' is-vowel' : '')); }).join('');
  }

  function pips(total, filled, cls) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<i class="pip' + (i < filled ? ' ' + cls : '') + '"></i>';
    return '<span class="pips">' + h + '</span>';
  }

  // Can the Human Captain pick a square and call a letter right now?
  function canCall() { return S.turn === 'me' && (!S.result || S.result.bonus) && !ui.demand; }

  // Tapping a hidden square aims at it; the Letters Manifest under the grid then takes the letter.
  // Tapping the same square again cancels the aim.
  function openManifest(k) {
    if (!canCall()) return;
    if (S.myShots[k] && (S.myShots[k].letter || S.myShots[k].empty)) return;
    if (ui.sel === k) { ui.sel = null; renderAttack(); return; }
    ui.sel = k;
    if (S.result && S.result.bonus) S.result = null;
    sfx('select');
    renderAttack();
    // Bring the manifest (under the grid) into view above the coach bar.
    var strip = $('uncalled'), coach = $('coach');
    if (strip && coach) {
      var gap = strip.getBoundingClientRect().bottom - coach.getBoundingClientRect().top + 12;
      if (gap > 0) window.scrollBy({ top: gap, behavior: 'smooth' });
    }
  }

  function renderAttack() {
    var mine = S.turn === 'me';
    var live = canCall();
    var info = S.result && S.result.info;
    // Ship circles change only when a word-ship is completely sunk (every letter showing);
    // they never hint at which ships are partly revealed.
    var sunkCells = {};   // squares of word-ships with every letter revealed: these go green
    $('bubbles').innerHTML = S.foe.ships.map(function (ship, i) {
      var all = cellsOf(ship).every(function (p) { var s = S.myShots[key(p.r, p.c)]; return s && s.letter; });
      if (all) cellsOf(ship).forEach(function (p) { sunkCells[key(p.r, p.c)] = true; });
      return '<span class="bubble' + (all ? ' is-solved' : '') + '" title="' + SPECS[i].cls + (all ? ': sunk' : '') + '">' + SPECS[i].len + '</span>';
    }).join('');
    var over = S.phase === 'over', fb = foeBoard();
    $('tabAttack').setAttribute('data-screen', over ? '010-MOBILE-GAME-OVER' : '005-MOBILE-ATTACK');
    $('attackSub').textContent = over ? (S.winner === 'me' ? 'Enemy Fleet Sunk' : 'Enemy Fleet Revealed') : 'Hunting the Enemy';
    $('uncalled').hidden = over;
    paint($('gridAttack'), function (r, c) {
      var k = key(r, c);
      var s = S.myShots[k];
      var o = s && s.letter ? { cls: sunkCells[k] ? 'is-bull' : 'is-found', text: s.letter, off: true } : s && s.empty ? { cls: 'is-empty', off: true } :
        s && s.tried ? { cls: 'is-contact', text: '<span class="q">?</span>' + triedHtml(s) } : {};
      // 010-MOBILE-GAME-OVER: the enemy fleet's unrevealed letters show too.
      if (over && fb[k] && !(s && s.letter)) o = { cls: 'is-unfound', text: fb[k].letter, off: true };
      if (ui.sel === k && !(s && s.letter)) o.cls = (o.cls || '') + ' is-target';
      // The story of your call, told on the grid: new letters flip in one by one, and the square
      // you aimed at keeps a marker (gold ✓ when the letter was there) until your turn ends.
      var fi = ui.flash ? ui.flash.indexOf(k) : -1;
      if (fi !== -1) o.cls = (o.cls || '') + ' is-flip is-d' + Math.min(fi, 6);
      if (info && info.k === k) o.cls = (o.cls || '') + (info.bonus ? ' is-aim is-aim-hit' : ' is-aim');
      return o;
    }, live);
    // Letters Manifest: letters not yet called. Once you aim at a square they become buttons to call.
    var left = LETTERS.filter(function (L) { return S.myTallies[L] == null; });
    var picking = !!ui.sel && live;
    $('uncalled').classList.toggle('is-picking', picking);
    $('uncalled').innerHTML = manifestHtml('Letters Manifest', left, function (L, cls) {
        return picking ? '<button type="button" class="' + cls + '" data-letter="' + L + '" aria-label="Call ' + L + (isVowel(L) ? ' (vowel: costs your next turn)' : '') + '">' + L + '</button>'
                       : '<span class="' + cls + '">' + L + '</span>';
      });
    if (ui.flash) { clearTimeout(ui.flashTimer); ui.flashTimer = setTimeout(function () { ui.flash = null; }, 1800); }


    // The popup is only for Demand Surrender; everything else is the coach bar.
    var fp = $('firePanel');
    if (ui.demand && mine) fp.innerHTML = demandForm();
    else { ui.demand = false; fp.innerHTML = ''; }
    refreshPanel();
    renderCoach();
  }

  function refreshPanel() {
    var mode = ui.demand ? 'demand' : '';
    var show = !!mode && current === 'battle' && S && S.phase === 'battle' && ui.tab === 'Attack' && $('sheet').hidden;
    $('panelSheet').hidden = !show;
    $('panelScrim').hidden = !show;
    $('panelSheet').setAttribute('data-screen', '009-MOBILE-SURRENDER');
    if (show) fitButtons($('panelSheet'));
    renderCoach();
  }
  function closePanel() {
    ui.demand = false;
    renderAttack();
  }

  // ------------------------------------------------------------
  // COACH BAR: one line above the tabs that always says what to do next.
  // ------------------------------------------------------------
  var HINT_KEY = 'wordfleet-hints', CALLS_KEY = 'wordfleet-calls';
  function getPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setPref(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  // Longer hints for a captain's first two calls ever, or whenever Hints is switched on in the menu.
  function hintsOn() { return getPref(HINT_KEY) === 'on' || (+getPref(CALLS_KEY) || 0) < 2; }

  // One short item per thing that happened since your last turn; renderCoach joins them into one line.
  function aiMoveLine(ev) {
    if (ev.skip) return 'you lost a turn (vowel)';
    return 'AI: <b>' + ev.letter + '</b> at <b>' + coordK(ev.square) + '</b> (' + ev.tally + ')' +
      (ev.bonus ? ' \u2605 bonus' : '');
  }

  function renderCoach() {
    var el = $('coach');
    var show = current === 'battle' && S && (S.phase === 'over' || (S.phase === 'battle' && !ui.demand));
    el.hidden = !show;
    if (!show) return;
    var mine = S.turn === 'me', r = S.result, info = r && r.info, hint = hintsOn();
    var step = '', main = '', pre = [], sub = [], btns = '', cls = '';   // pre: news above the instruction; sub: details below
    if (S.phase === 'over') {
      // 010-MOBILE-GAME-OVER: the result, how the battle went, and no buttons (New Battle is in the ☰ menu).
      var o = overText(), called = Object.keys(S.myTallies);
      cls = S.winner === 'me' ? 'is-bonus' : 'is-lost';
      step = S.winner === 'me' ? '\u2605' : '\u2715';
      main = '<span class="coach-eyebrow">' + o.eyebrow + '</span>' + o.title;
      sub.push(o.quote);
      sub.push(called.length + ' letters called \u00b7 ' + called.filter(isVowel).length + ' vowels \u00b7 ' + bullCount(S.myShots) + '/' + FLEET_CELLS + ' revealed');
    } else if (!mine) {
      cls = 'is-wait';
      main = 'AI Captain is aiming<span class="dots"><i>.</i><i>.</i><i>.</i></span>';
      if (hint) sub.push('It calls a letter on your fleet. Watch the Defense Grid.');
    } else if (ui.sel) {
      step = '2'; main = 'Call a letter for <b>' + coordK(ui.sel) + '</b>: tap it in the Letters Manifest.';
      if (hint) sub.push('Tap another square to re-aim, or ' + coordK(ui.sel) + ' again to cancel. Vowels (round) cost your next turn.');
    } else if (r && info && info.bonus) {
      cls = 'is-bonus'; step = '\u2605';
      main = 'Bonus turn! <b>' + info.L + '</b> was at <b>' + coordK(info.k) + '</b>. Tap another square.';
      (info.sunk || []).forEach(function (w) { sub.push('<b>' + w + '</b> is sunk!'); });
    } else if (r && info) {
      step = '3';
      main = '<span class="say">"' + info.L + ' tally ' + info.t + '."</span> ' +
        (info.t ? 'Revealed at ' + info.cells.map(coordK).join(', ') + '.' : info.open ? coordK(info.k) + ' is open water.' : info.L + ' isn\'t in their fleet.');
      if (!info.open && !info.bonus) sub.push(coordK(info.k) + ' holds a letter, not ' + info.L + ': marked ?');
      (info.sunk || []).forEach(function (w) { sub.unshift('<b>' + w + '</b> is sunk!'); });
      if (info.vowel) sub.push('<span class="coach-warn">Vowel: you skip your next turn.</span>');
      else if (hint && info.t && !(info.sunk || []).length) sub.push('Reveal every letter of a word-ship to sink it.');
      btns += '<button class="btn btn--sm btn--primary" type="button" data-coach="end">End Turn</button>';
    } else if (r) {
      // A result saved by an older version: no details, just the way on.
      step = '3'; main = r.title;
      btns = '<button class="btn btn--sm btn--primary" type="button" data-coach="end">End Turn</button>';
    } else {
      (S.incoming || []).forEach(function (ev) { pre.push(aiMoveLine(ev)); });
      if (S.notice) pre.push(/vowel/.test(S.notice) ? 'AI lost a turn (vowel)' : S.notice);
      step = '1'; main = 'Your turn. Tap a square to aim.';
      if (hint) sub.push('Then call a letter: every square holding it is revealed. Your letter in your square = bonus turn. Vowels cost a turn.');
    }
    el.className = 'coach ' + cls;
    el.innerHTML = (step ? '<span class="coach-step">' + step + '</span>' : '') +
      '<div class="coach-body">' + (pre.length ? '<div class="coach-news">' + pre.join(' \u00b7 ') + '</div>' : '') +
      '<div class="coach-main">' + main + '</div>' +
      sub.map(function (x) { return '<div class="coach-sub">' + x + '</div>'; }).join('') +
      (btns ? '<div class="coach-btns">' + btns + '</div>' : '') + '</div>';
    fitButtons(el);
    // Leave room to scroll the bottom of the tab (the letters manifest) clear of the coach bar.
    document.documentElement.style.setProperty('--coach-h', el.offsetHeight + 'px');
  }

  function renderDefense() {
    $('defFleetName').textContent = S.me.name || 'Your fleet';
    var b = myBoard();
    var ev = S.lastFoe;
    var flashing = ev && ev.unseen && ui.tab === 'Defense';
    // Your ship circles turn red only when the AI Captain has revealed a whole word-ship.
    $('defBubbles').innerHTML = S.me.ships.map(function (ship, i) {
      var all = cellsOf(ship).every(function (p) { var s = S.foeShots[key(p.r, p.c)]; return s && s.letter; });
      return '<span class="bubble' + (all ? ' is-lost' : '') + '" title="' + SPECS[i].cls + (all ? ': sunk' : '') + '">' + SPECS[i].len + '</span>';
    }).join('');
    paint($('gridDefense'), function (r, c) {
      var k = key(r, c);
      var cell = b[k];
      var s = S.foeShots[k];
      var cls = cell ? 'is-ship' + (s && s.letter ? ' is-ship-lost' : s && s.tried ? ' is-contact' : '') : s && s.empty ? 'is-empty' : '';
      if (ui.tab === 'Defense' && (S.incoming || []).some(function (e) { return e.square === k; })) cls += ' is-aimed';
      if (flashing && ev.cells && ev.cells.indexOf(k) !== -1) cls += ' is-flash';
      return { cls: cls, text: cell ? cell.letter + triedHtml(s) : '' };
    }, false);
    // Letters the AI Captain has not called yet; the ones in your fleet (still at risk) are outlined in your colors.
    var mineCount = letterCounts(S.me.words);
    var aiLeft = LETTERS.filter(function (L) { return S.foeTallies[L] == null; });
    $('defUncalled').innerHTML = manifestHtml('AI Letters Manifest', aiLeft, function (L, cls) {
      return '<span class="' + cls + (mineCount[L] ? ' is-mine' : '') + '">' + L + '</span>';
    });
    if (flashing) { ev.unseen = false; save(); $('defDot').hidden = true; }
  }

  // 008-MOBILE-LOG: newest first, an anchor bullet on every entry. Your moves and the AI Captain's
  // carry that side's flag and fleet name; Fleet Command notices are just the text.
  function renderLog() {
    renderFleetTags();
    var mine = schemeOf(S.colors);
    $('log').innerHTML = S.log.length ? S.log.map(function (l) {
      var who = l.who === 'foe' ? '<span class="log-flag">' + flagSvg(FOE_SCHEME, fleetInitials(S.foe.name) || 'AI') + '</span>' + esc(S.foe.name)
        : l.who === 'me' ? '<span class="log-flag">' + flagSvg(mine, fleetInitials(S.me.name) || 'WF') + '</span>' + esc(S.me.name) : '';
      return '<div class="log-item"><span class="log-anchor" aria-hidden="true">\u2693\uFE0E</span><div class="log-body">' +
        (who ? '<div class="log-who">' + who + '</div>' : '') + '<div class="log-text">' + l.text + '</div></div></div>';
    }).join('') : '<p class="log-empty">No letters called yet.</p>';
  }



  function switchTab(tab) {
    ui.tab = tab;
    renderBattle();
    refreshPanel();
    setMusicMood();
    window.scrollTo(0, 0);
  }

  // Every square holding L is revealed, wherever it is. Returns the newly revealed squares.
  // A square known to hold a letter that is still hidden: remember the letters ruled out there.
  function markContact(shots, k, L) {
    var s = shots[k] || {};
    if (s.letter) return;
    s.tried = (s.tried || []).concat(L);
    shots[k] = s;
  }
  // The ruled-out letters, small along the bottom of the square (the last three).
  function triedHtml(s) {
    return s && s.tried && !s.letter ? '<span class="tried">' + s.tried.slice(-3).join('') + '</span>' : '';
  }

  // Words of the word-ships with every letter revealed, in fleet order.
  function sunkWords(shots, ships) {
    return ships.filter(function (ship) {
      return cellsOf(ship).every(function (p) { var s = shots[key(p.r, p.c)]; return s && s.letter; });
    }).map(function (ship) { return ship.word; });
  }

  function revealLetter(shots, board, L) {
    var cells = [];
    Object.keys(board).forEach(function (k) {
      if (board[k].letter !== L || (shots[k] && shots[k].letter)) return;
      shots[k] = { hit: true, letter: L };
      cells.push(k);
    });
    return cells;
  }

  function revealNote(L, cells, whose) {
    return '<p class="hint"><strong>' + L + ' revealed at ' + cells.map(coordK).join(', ') + '</strong> in ' + whose + ' fleet.</p>';
  }

  function allRevealed(shots, board) {
    return Object.keys(board).every(function (k) { return shots[k] && shots[k].letter; });
  }

  // Hand the turn over; a captain who called a vowel sits this one out.
  function passTurn(to) {
    // Both captains may owe a skip (each called a vowel), so keep passing until someone plays.
    for (var n = 0; n < 2 && S.skip[to]; n++) {
      S.skip[to] = false;
      log('sys', (to === 'me' ? 'The Human Captain' : 'The AI Captain') + ' loses this turn for calling a vowel.');
      if (to === 'me') S.incoming.push({ skip: true });
      else S.notice = 'The AI Captain called a vowel, so it loses this turn. Your turn again.';
      to = to === 'me' ? 'foe' : 'me';
    }
    S.turn = to;
  }

  function showResult(title, html, solve, bonus) {
    S.result = { title: title, html: html, solve: !!solve, bonus: !!bonus };
    save();
    renderBattle();
  }

  // --- the Human Captain picks a square, then calls a letter ---
  function humanCall(L) {
    var k = ui.sel;
    if (!k || !canCall() || S.myTallies[L] != null) return;
    closeSheet();
    var t = countOf(S.foe.words.join(''), L);
    var vowel = isVowel(L);
    var at = foeBoard()[k];
    var bonus = !!(at && at.letter === L);
    S.myTallies[L] = t;
    S.turns++;
    S.notice = null;
    ui.sel = null;
    if (!at) S.myShots[k] = { empty: true };   // open water: marked with a white dot
    else if (!bonus) markContact(S.myShots, k, L);   // holds another letter: marked ? with L ruled out
    if (vowel) S.skip.me = true;
    var sunkBefore = sunkWords(S.myShots, S.foe.ships);
    var cells = revealLetter(S.myShots, foeBoard(), L);
    var sunk = sunkWords(S.myShots, S.foe.ships).filter(function (w) { return sunkBefore.indexOf(w) === -1; });
    ui.flash = cells;
    log('me', coordK(k) + ': "Calling ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>' +
      (bonus ? ' It was at ' + coordK(k) + ': bonus turn.' : '') + (vowel ? ' A vowel: the Human Captain loses the next turn.' : ''));
    sfx('select');
    sfx(t ? 'fill' : 'zero', 0.2);
    if (sunk.length) log('me', sunk.join(', ') + ' sunk: every letter revealed.');
    if (allRevealed(S.myShots, foeBoard())) { finish('me', 'reveal'); return; }   // the win fanfare takes over
    if (bonus) {
      sfx('bonus', 0.35);
      notifyBonus('\u2605 BONUS TURN!');
    }
    if (vowel) sfx('error', 0.6);
    if (sunk.length) sfx('solveOk', 0.5);
    var html = '<div class="report ' + (t ? 'is-good' : 'is-warn') + '"><div class="report-q">' + coordK(k) + ': "Calling ' + NATO[L] + '!"</div><div class="report-a">"' + L + ' tally ' + t + '."</div></div>' +
      (t ? revealNote(L, cells, 'the AI Captain\'s') : '<p class="hint">' + L + ' is nowhere in the AI Captain\'s fleet.</p>') +
      (bonus ? '<p class="bonus">\u2605 Bonus turn! ' + L + ' was hiding at ' + coordK(k) + '.</p>' : (at ? '' : '<p class="hint">' + coordK(k) + ' is open water.</p>')) +
      (vowel ? '<p class="notice">Vowel: you lose your next turn.</p>' : '');
    setPref(CALLS_KEY, (+getPref(CALLS_KEY) || 0) + 1);
    showResult(bonus ? '\u2605 Bonus Turn!' : 'Calling ' + NATO[L], html, t > 0, bonus);
    S.result.info = { L: L, t: t, k: k, cells: cells, bonus: bonus, vowel: vowel, open: !at, sunk: sunk };
    save(); renderBattle();
  }


  function endMyTurn() {
    closeSheet();
    S.result = null;
    ui.sel = null;
    S.incoming = [];
    passTurn('foe');
    save();
    renderBattle();
  }

  // --- demand surrender (player), shown in the fire panel ---
  function demandForm() {
    if (!S.claims) S.claims = SPECS.map(function () { return { word: '', c: '', r: '', dir: 'H' }; });
    var colOpts = function (v) {
      return '<option value="">Col</option>' + COLS.split('').map(function (ch, i) { return '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + ch + '</option>'; }).join('');
    };
    var rowOpts = function (v) {
      var h = '<option value="">Row</option>';
      for (var i = 0; i < 10; i++) h += '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + (i + 1) + '</option>';
      return h;
    };
    var rows = SPECS.map(function (spec, i) {
      var cl = S.claims[i];
      return '<div class="claim"><div class="claim-top"><div class="word-class"><b>' + spec.cls + '</b>' + spec.len + '</div>' +
        '<input class="input" data-claim="' + i + '" data-f="word" maxlength="' + spec.len + '" value="' + esc(cl.word) + '" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="' + '_'.repeat(spec.len) + '"></div>' +
        '<div class="claim-sub"><select class="select" data-claim="' + i + '" data-f="c" aria-label="Start column">' + colOpts(cl.c) + '</select>' +
        '<select class="select" data-claim="' + i + '" data-f="r" aria-label="Start row">' + rowOpts(cl.r) + '</select>' +
        '<select class="select" data-claim="' + i + '" data-f="dir" aria-label="Heading"><option value="H"' + (cl.dir === 'H' ? ' selected' : '') + '>Across</option><option value="V"' + (cl.dir === 'V' ? ' selected' : '') + '>Down</option></select></div></div>';
    }).join('');
    // 009-MOBILE-SURRENDER: the Attack tab's panel in Demand Surrender mode.
    return '<div class="card-title" style="color:var(--red)" data-screen="009-MOBILE-SURRENDER">Demand Surrender</div>' +
      '<p class="hint" style="margin-top:0">Name every one of the AI Captain\'s word-ships, its first square, and its heading. All correct and you win. <strong>Anything wrong and you lose on the spot.</strong> Uses your whole turn.</p>' +
      rows + '<p class="note" id="claimNote"></p>' +
      '<button class="btn btn--danger-solid btn--wide" type="button" data-act="submitDemand">I Demand Your Surrender!</button>' +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="belay">Belay That</button>';
  }

  function claimInput(el) {
    var i = +el.getAttribute('data-claim');
    var f = el.getAttribute('data-f');
    var v = el.value;
    if (f === 'word') { v = v.toUpperCase().replace(/[^A-Z]/g, ''); if (el.value !== v) el.value = v; }
    S.claims[i][f] = v;
    save();
  }

  function submitDemand(confirmed) {
    var claims = S.claims;
    for (var i = 0; i < claims.length; i++) {
      var cl = claims[i];
      if (cl.word.length !== SPECS[i].len || cl.c === '' || cl.r === '') {
        $('claimNote').textContent = 'Fill in every word-ship before you demand surrender (' + SPECS[i].cls + ').';
        return;
      }
    }
    if (!confirmed) {
      var btn = document.querySelector('[data-act="submitDemand"]');
      btn.textContent = 'Tap again to commit. No take-backs.';
      btn.setAttribute('data-act', 'submitDemandSure');
      return;
    }
    var sig = function (s) { return s.word + '@' + s.r + ',' + s.c + ',' + s.dir; };
    var truth = S.foe.ships.map(sig).sort();
    var said = claims.map(function (cl) { return sig({ word: cl.word, r: +cl.r, c: +cl.c, dir: cl.dir }); }).sort();
    var right = truth.join('|') === said.join('|');
    var summary = claims.map(function (cl) { return cl.word + ' at ' + COLS[+cl.c] + (+cl.r + 1) + (cl.dir === 'H' ? ' across' : ' down'); }).join(', ');
    log('me', '"I demand your surrender! Your fleet consists of: ' + esc(summary) + '!"');
    ui.demand = false;
    finish(right ? 'me' : 'foe', right ? 'demand-right' : 'demand-wrong');
  }

  // ------------------------------------------------------------
  // THE AI CAPTAIN
  // ------------------------------------------------------------
  var FLEET_LENS = { 5: 1, 4: 1, 3: 2, 2: 1 };
  var letterPrior = null;

  // How common each letter is across the word list (weighted by commonness).
  function priorScores() {
    if (letterPrior) return letterPrior;
    var counts = {}, total = 0;
    Object.keys(guessPool).forEach(function (len) {
      guessPool[len].forEach(function (e) {
        for (var i = 0; i < e.w.length; i++) { counts[e.w[i]] = (counts[e.w[i]] || 0) + e.wt; total += e.wt; }
      });
    });
    letterPrior = {};
    LETTERS.forEach(function (L) { letterPrior[L] = (counts[L] || 0) / (total || 1); });
    return letterPrior;
  }

  // Walk every placement of every ship length that touches a revealed square,
  // and every dictionary word that fits it. Unrevealed squares can't hold a
  // letter that has already been called (every copy of it would be showing).
  function eachFit(minKnown, fn) {
    var sh = S.foeShots, called = S.foeTallies;
    Object.keys(FLEET_LENS).forEach(function (lenStr) {
      var len = +lenStr, mult = FLEET_LENS[len];
      for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
        ['H', 'V'].forEach(function (dir) {
          if (dir === 'H' ? c + len > 10 : r + len > 10) return;
          var seg = [], keys = [], known = 0;
          for (var i = 0; i < len; i++) {
            var kk = dir === 'H' ? key(r, c + i) : key(r + i, c), s = sh[kk];
            if (s && s.empty) return;          // open water: no ship runs through it
            keys.push(kk);
            seg.push(s && s.letter ? s.letter : null);
            if (s && s.letter) known++;
          }
          if (known < minKnown || known === len) return;
          var words = guessPool[len] || [];
          for (var w = 0; w < words.length; w++) {
            var e = words[w], ok = allowed(e.w);
            for (var j = 0; ok && j < len; j++) {
              var ch = e.w[j];
              if (seg[j] ? seg[j] !== ch : called[ch] != null) ok = false;
            }
            if (ok) fn(e, seg, known, len, mult, keys);
          }
        });
      }
    });
  }

  function foeCallLetter(lvl) {
    var called = S.foeTallies, prior = priorScores();
    var options = LETTERS.filter(function (L) { return called[L] == null; });
    var score = {};
    options.forEach(function (L) { score[L] = prior[L]; });
    if (lvl.pattern) {
      var pat = {}, total = 0;
      eachFit(1, function (e, seg, known, len, mult) {
        var wt = e.wt * mult * known;
        for (var j = 0; j < len; j++) if (!seg[j]) { pat[e.w[j]] = (pat[e.w[j]] || 0) + wt; total += wt; }
      });
      if (total) options.forEach(function (L) { score[L] += 3 * (pat[L] || 0) / total; });
    }
    options.forEach(function (L) {
      if (isVowel(L)) score[L] *= lvl.vowelCost;
      score[L] *= 1 - lvl.noise + 2 * lvl.noise * Math.random();
    });
    return options.sort(function (a, b) { return score[b] - score[a]; })[0];
  }

  // Pick the hidden square most likely to hold L (random for Captain Rubber Duck or with no clues).
  function foePickSquare(L, lvl) {
    var sh = S.foeShots, score = {}, best = null;
    if (lvl.pattern) {
      eachFit(1, function (e, seg, known, len, mult, keys) {
        for (var j = 0; j < len; j++) if (!seg[j] && e.w[j] === L) score[keys[j]] = (score[keys[j]] || 0) + e.wt * mult * known;
      });
      Object.keys(score).forEach(function (k) { if (!best || score[k] > score[best]) best = k; });
    }
    if (best) return best;
    var hidden = [];
    for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) { var h = sh[key(r, c)]; if (!h || !(h.letter || h.empty)) hidden.push(key(r, c)); }
    return pick(hidden);
  }



  function foeTurn() {
    ui.aiTimer = null;
    if (S.phase !== 'battle' || S.turn !== 'foe') return;
    var lvl = LEVELS[S.level];
    S.notice = null;
    var L = foeCallLetter(lvl);
    var k = foePickSquare(L, lvl);
    var at = myBoard()[k];
    var t = countOf(S.me.words.join(''), L);
    var vowel = isVowel(L);
    var bonus = !!(at && at.letter === L);
    S.turns++;
    S.foeTallies[L] = t;
    if (!at) S.foeShots[k] = { empty: true };
    else if (!bonus) markContact(S.foeShots, k, L);
    if (vowel) S.skip.foe = true;
    var ev = { letter: L, square: k, tally: t, vowel: vowel, bonus: bonus, cells: revealLetter(S.foeShots, myBoard(), L) };
    log('foe', coordK(k) + ': "Calling ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>' +
      (bonus ? ' It was at ' + coordK(k) + ': bonus turn.' : '') + (vowel ? ' A vowel: the AI Captain loses its next turn.' : ''));
    sfx('incoming');
    sfx(t ? 'fill' : 'zero', 0.5);
    if (bonus) sfx('bull', 0.9);
    if (allRevealed(S.foeShots, myBoard())) { finish('foe', 'foe-reveal'); return; }
    ev.unseen = true;
    S.lastFoe = ev;
    S.incoming.push(ev);
    if (!bonus) passTurn('me');     // a bonus turn keeps it with the AI Captain
    save();
    // Stay put: the coach bar reports the AI Captain's move and the Defense tab gets a dot.
    renderBattle();
  }

  // ------------------------------------------------------------
  // GAME OVER
  // ------------------------------------------------------------
  function finish(winner, reason) {
    S.phase = 'over';
    S.winner = winner;
    S.reason = reason;
    S.turn = null; S.incoming = [];
    if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
    bumpRecord(winner === 'me');
    sfx(winner === 'me' ? 'win' : 'lose', 0.2);
    ui.sel = null; ui.demand = false; ui.tab = 'Attack';
    save();
    show('battle');
    window.scrollTo(0, 0);
  }

  // The words for how the battle ended.
  function overText() {
    var r = S.reason;
    if (r === 'reveal') return { eyebrow: 'Total Victory', title: 'Every letter of the ' + S.foe.name + ' is showing.', quote: '"You have won."' };
    if (r === 'foe-reveal') return { eyebrow: 'Fleet Exposed', title: 'The AI Captain revealed your whole fleet.', quote: 'Every letter of the ' + S.me.name + ' is showing.' };
    if (r === 'demand-right') return { eyebrow: 'Total Victory', title: 'The ' + S.foe.name + ' surrenders.', quote: '"You have won."' };
    if (r === 'demand-wrong') return { eyebrow: 'Surrender Refused', title: 'Your demand missed the mark.', quote: '"Victory is mine! You lose! Good day sir!"' };
    return { eyebrow: 'Fleet Surrendered', title: 'The ' + S.foe.name + ' named every word-ship.', quote: 'You were obliged to answer: "You have won."' };
  }

  // ------------------------------------------------------------
  // menu + rules
  // ------------------------------------------------------------
  function openMenu() {
    var live = S && S.phase !== 'over' && S.phase !== 'setup';
    openSheet('<h2>Word Fleet</h2><div class="menu-list">' +
      '<button class="btn btn--primary btn--wide" type="button" data-act="newBattle">Start a New Battle</button>' +
      (S && S.me && S.me.words && S.me.words.length ? '<button class="btn btn--wide" type="button" data-act="newBattleSame">New Battle, Same Words</button>' +
        '<button class="btn btn--wide" type="button" data-act="newBattleFleet">New Battle, Whole New Fleet</button>' : '') +
      '<button class="btn btn--wide" type="button" data-act="rules">Rules of Engagement</button>' +
      (ui.installEvt ? '<button class="btn btn--wide" type="button" data-act="install">Install Word Fleet</button>' : '') +
      '<a class="btn btn--wide" href="https://thegamebureau.com/wordfleet/">Home Port</a>' +
      '<a class="btn btn--wide" href="https://thegamebureau.com/">By The Game Bureau</a>' +
      (S && S.phase === 'battle' && S.turn === 'me' && (!S.result || S.result.bonus) ? '<button class="btn btn--danger btn--wide" type="button" data-act="menuDemand">Demand Surrender</button>' : '') +
      (live ? '<button class="btn btn--danger btn--wide" type="button" data-act="abandon">Abandon Battle</button>' : '') +
      (window.WFAudio ? '<div class="switches">' +
        '<label class="switch-row"><span>Sound Effects</span><input type="checkbox" class="switch" data-audio="sfx"' + (window.WFAudio.sfxOn() ? ' checked' : '') + '></label>' +
        '<label class="switch-row"><span>Music</span><input type="checkbox" class="switch" data-audio="music"' + (window.WFAudio.musicOn() ? ' checked' : '') + '></label>' +
        '<label class="switch-row"><span>Hints</span><input type="checkbox" class="switch" data-hints="1"' + (getPref(HINT_KEY) === 'on' ? ' checked' : '') + '></label>' +
        '</div>' : '') +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="close">Close</button></div>', true, 'MOBILE-MENU');
  }

  function openRules() {
    openSheet('<div class="sheet-eyebrow">Word Fleet</div><h2>Rules of Engagement</h2><div class="rules">' +
      '<h3>Fleet Deployment</h3><ul>' +
      '<li>Five word-ships: KETCH (5), SHIP (4), SUB (3), ARK (3), PT (2).</li>' +
      '<li>Place them left-to-right or top-to-bottom. No diagonals or backwards.</li>' +
      '<li>Word-ships may touch but not overlap. No proper nouns, abbreviations, or suffixes.</li></ul>' +
      '<h3>Who Goes First?</h3><p>Against the AI Captain, the Human Captain always goes first.</p>' +
      '<h3>Your Turn: Call a Letter</h3><ul>' +
      '<li>Tap a hidden square on the Attack Grid, then call a letter. Every square in the enemy fleet that holds it is revealed, wherever it is.</li>' +
      '<li><strong>Bonus turn:</strong> if the letter is in the square you tapped, you go again. Otherwise the turn passes.</li>' +
      '<li><strong>Vowels</strong> (A E I O U) can be called and reveal the same way, but the caller loses their next turn.</li>' +
      '<li><strong>Sinking:</strong> a word-ship sinks when every one of its letters is revealed. Reveal the whole enemy fleet to win.</li></ul>' +
      '<h3>Winning</h3><ul>' +
      '<li>Reveal every letter of the enemy fleet and you win.</li>' +
      '<li><strong>Demand Surrender:</strong> instead of calling a letter, name every enemy word-ship and exactly where it sits. All correct: <span class="say">"You have won."</span> Anything wrong: <span class="say">"Victory is mine! You lose! Good day sir!"</span></li></ul>' +
      '<h3>Reading the Tracker</h3><ul>' +
      '<li>Attack Grid: green squares are revealed letters of the AI Captain\'s fleet. Defense Grid: red squares are your letters the AI Captain has revealed.</li>' +
      '<li>Manifests: each dot under a letter is one copy of it in the fleet. The 5 4 3 3 2 circles turn green only when that word-ship is completely sunk.</li></ul>' +
      '</div><button class="btn btn--primary btn--wide" type="button" data-act="close">Aye, Aye</button>', true, 'MOBILE-RULES');
  }

  // ------------------------------------------------------------
  // events
  // ------------------------------------------------------------
  function on(el, type, fn) { if (el) el.addEventListener(type, fn); }

  on($('btnMenu'), 'click', openMenu);
  // kind: undefined starts over at 001; 'same' keeps your fleet (name, colors, words) and goes straight
  // to 004 with it deployed at random; 'fleet' keeps your colors, draws a whole new fleet and opens 003.
  function newBattle(kind) {
    if (S && S.phase !== 'over' && S.phase !== 'setup' && !confirm('Abandon the current battle?')) return false;
    if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
    var old = S && S.me && S.me.words && S.me.words.length ? { name: S.me.name, words: S.me.words.slice(), colors: S.colors } : null;
    newGame();
    if (kind && old) {
      S.colors = old.colors;
      if (kind === 'same') {
        S.me.name = old.name; S.me.words = old.words;
        S.me.ships = scatter(S.me.words);
        S.phase = 'deploy';
        save(); show('deploy');
        return true;
      }
      S.setupStep = 'words';
      save(); show('words');
      return true;
    }
    show('setup');
    return true;
  }
  on($('btnNew'), 'click', function () { newBattle(); });
  on($('btnContinue'), 'click', resume);
  on($('btnHowTo'), 'click', openRules);

  // setup
  // Shrink long fleet names so the whole name shows on small phones.
  function fitFleetName() {
    var el = $('inFleet'); if (!el) return;
    el.style.fontSize = ''; el.style.letterSpacing = '';
    if (el.scrollWidth > el.clientWidth) el.style.letterSpacing = '0';
    var size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth && size > 11) el.style.fontSize = (size -= 1) + 'px';
  }
  on($('inFleet'), 'input', function () { S.me.name = this.value.toUpperCase(); fitFleetName(); renderSchemes(); save(); });
  on($('colorSchemes'), 'click', function (e) {
    var b = e.target.closest('[data-scheme]');
    if (!b) return;
    S.colors = b.getAttribute('data-scheme'); S.colorsPicked = true; save(); renderSchemes();
  });
  on($('btnRollName'), 'click', function () { S.me.name = randomFleetName(); $('inFleet').value = S.me.name; fitFleetName(); renderSchemes(); save(); });
  on($('segLevel'), 'click', function (e) {
    var b = e.target.closest('[data-v]');   // a tap may land on the "Captain" line inside the button
    var v = b && b.getAttribute('data-v');
    if (!v) return;
    S.level = v;
    if (!S.wordsEdited) S.me.words = randomWords();   // drawn words follow the AI Captain's level; typed ones stay
    save(); renderSetup();
  });
  on($('wordList'), 'click', function (e) {
    var b = e.target.closest('[data-reroll]');
    if (!b) return;
    var i = +b.getAttribute('data-reroll');
    S.me.words[i] = randomWordFor(i, S.me.words);
    save(); renderSetup();
  });
  on($('wordList'), 'input', function (e) {
    var el = e.target;
    if (!el.hasAttribute('data-word')) return;
    var v = el.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (el.value !== v) el.value = v;
    S.me.words[+el.getAttribute('data-word')] = v;
    S.wordsEdited = true;
    markWordInput(el);
    save();
  });
  // Check a typed word as soon as the captain leaves its box.
  on($('wordList'), 'focusout', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-word')) checkWordInput(e.target);
  });
  on($('selLang'), 'change', function () {
    S.lang = this.value;
    save();
    loadDictionary(S.lang).then(function () {
      S.me.name = randomFleetName();   // a fresh fleet name in the new language
      if (!S.wordsEdited) S.me.words = randomWords();
      save();
      renderSetup();
    });
  });
  on($('chkOffensive'), 'change', function () {
    S.offensiveOk = this.checked;
    // Switching it either way draws five fresh suggestions that follow the new setting
    // (and the chosen AI Captain's word level), replacing any typed words.
    S.me.words = randomWords();
    S.wordsEdited = false;
    sfx('select');
    save(); renderSetup();
  });
  // Prepare for Battle runs in four steps: 001 name/language, 002 opponent, 003 words, 004 deploy.
  function setupStep(step) {
    if (step !== 'setup') {
      var name = (S.me.name || '').trim().toUpperCase().replace(/\s+/g, ' ');
      S.me.name = name || randomFleetName();
    }
    S.setupStep = step;
    save();
    show(step);
  }
  on($('btnToOpponent'), 'click', function () { setupStep('opponent'); });
  on($('btnToWords'), 'click', function () { setupStep('words'); });
  on($('btnBackToSetup'), 'click', function () { setupStep('setup'); });
  on($('btnBackToOpponent'), 'click', function () { setupStep('opponent'); });
  on($('btnRefreshAll'), 'click', function () { S.me.words = randomWords(); S.wordsEdited = false; save(); renderSetup(); });
  on($('btnToDeploy'), 'click', setupToDeploy);

  // deploy
  on($('gridDeploy'), 'click', function (e) {
    if (ui.dragged) { ui.dragged = false; return; }   // the click that ends a drag
    var c = e.target.closest('[data-k]');
    if (c) deployTap(c.getAttribute('data-k'));
  });

  // Drag a deployed word-ship by any of its letters to move it.
  var drag = null;
  function dragCells(r0, c0, dir, len) {
    var out = [];
    for (var i = 0; i < len; i++) {
      var r = dir === 'V' ? r0 + i : r0, c = dir === 'H' ? c0 + i : c0;
      if (r >= 0 && r < 10 && c >= 0 && c < 10) out.push(key(r, c));
    }
    return out;
  }
  function clearDragMarks() {
    Array.prototype.forEach.call($('gridDeploy').querySelectorAll('.is-preview, .is-bad, .is-dragging'), function (el) {
      el.classList.remove('is-preview', 'is-bad', 'is-dragging');
    });
  }
  on($('gridDeploy'), 'pointerdown', function (e) {
    var cell = e.target.closest('[data-k]');
    if (!cell || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var k = cell.getAttribute('data-k');
    var b = boardOf(S.me.ships);
    if (!b[k]) return;
    var ship = S.me.ships[b[k].ship], p = unkey(k);
    drag = { idx: b[k].ship, off: ship.dir === 'H' ? p.c - ship.c : p.r - ship.r, from: k, moved: false, target: null };
  });
  // Listen on the document (no pointer capture) so taps still land on the letter square.
  on(document, 'pointermove', function (e) {
    if (!drag) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var cell = el && el.closest && el.closest('#gridDeploy [data-k]');
    var k = cell && cell.getAttribute('data-k');
    if (!k || (k === drag.from && !drag.moved)) return;
    drag.moved = true;
    if (ui.firstTap) { clearTimeout(ui.firstTap.timer); ui.firstTap = null; }
    var ship = S.me.ships[drag.idx], p = unkey(k);
    var r0 = ship.dir === 'V' ? p.r - drag.off : p.r;
    var c0 = ship.dir === 'H' ? p.c - drag.off : p.c;
    var ok = r0 >= 0 && c0 >= 0 && fits(S.me.ships, drag.idx, r0, c0, ship.dir);
    drag.target = ok ? { r: r0, c: c0 } : null;
    clearDragMarks();
    cellsOf(ship).forEach(function (q) {
      var c = $('gridDeploy').querySelector('[data-k="' + key(q.r, q.c) + '"]');
      if (c) c.classList.add('is-dragging');
    });
    dragCells(r0, c0, ship.dir, ship.word.length).forEach(function (kk) {
      var c = $('gridDeploy').querySelector('[data-k="' + kk + '"]');
      if (c) c.classList.add(ok ? 'is-preview' : 'is-bad');
    });
  });
  function endDrag(e) {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (!d.moved) return;                 // a plain tap: let the click handler turn or lift it
    ui.dragged = true;
    setTimeout(function () { ui.dragged = false; }, 0);   // only swallow the click this drag makes
    if (d.target) {
      var ship = S.me.ships[d.idx];
      ship.r = d.target.r; ship.c = d.target.c;
      sfx('place');
      save();
    } else if (e.type === 'pointerup') {
      sfx('error');
      toast("Won't fit there.");
    }
    renderDeploy();
  }
  on(document, 'pointerup', endDrag);
  on(document, 'pointercancel', endDrag);
  on($('btnShuffle'), 'click', function () { S.me.ships = scatter(S.me.words); sfx('place'); save(); renderDeploy(); });
  on($('btnDeployDone'), 'click', confirmDeploy);
  on($('btnDeployBack'), 'click', function () { S.phase = 'setup'; S.setupStep = 'words'; save(); show('words'); });

  // battle
  on($('firePanel'), 'click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'demand') { ui.demand = true; renderAttack(); $('panelSheet').scrollTop = 0; }
    else if (act === 'belay') { ui.demand = false; renderAttack(); }
    else if (act === 'endTurn') endMyTurn();
    else if (act === 'submitDemand') submitDemand(false);
    else if (act === 'submitDemandSure') submitDemand(true);
  });
  on($('uncalled'), 'click', function (e) {
    var b = e.target.closest('[data-letter]');
    if (b) humanCall(b.getAttribute('data-letter'));
  });
  on($('gridAttack'), 'click', function (e) {
    var c = e.target.closest('[data-k]');
    if (c) openManifest(c.getAttribute('data-k'));
  });
  on($('firePanel'), 'input', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('firePanel'), 'change', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('tabbar'), 'click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    var tab = b.getAttribute('data-tab');
    // Heading back to the Attack Grid counts as reading the incoming report.
    switchTab(tab);
  });


  // sheet
  on($('scrim'), 'click', function () {
    if (!sheetDismissible) return;
    closeSheet();
    if (ui.sel && current === 'battle') { ui.sel = null; renderAttack(); }   // tapped outside the letter picker: cancel the aim
  });
  on($('panelScrim'), 'click', closePanel);
  on($('panelClose'), 'click', closePanel);
  on($('coach'), 'click', function (e) {
    var b = e.target.closest('[data-coach]');
    if (!b) return;
    var act = b.getAttribute('data-coach');
    if (act === 'end') endMyTurn();
  });
  on($('sheetBody'), 'click', function (e) {
    var k = e.target.closest('[data-letter]');
    if (k) { humanCall(k.getAttribute('data-letter')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'close') { closeSheet(); if (ui.sel && current === 'battle') { ui.sel = null; renderAttack(); } }
    else if (act === 'rules') openRules();
    else if (act === 'menuDemand') { closeSheet(); ui.demand = true; switchTab('Attack'); }
    else if (act === 'home') { closeSheet(); show('home'); }
    else if (act === 'newBattle') { if (newBattle()) closeSheet(); }
    else if (act === 'newBattleSame') { if (newBattle('same')) closeSheet(); }
    else if (act === 'newBattleFleet') { if (newBattle('fleet')) closeSheet(); }
    else if (act === 'abandon') {
      if (!confirm('Abandon this battle? It counts as a loss.')) return;
      if (S.phase === 'battle') bumpRecord(false);
      closeSheet(); S = null; try { localStorage.removeItem(STORE); } catch (err) { /* ignore */ }
      newGame(); show('setup');
    }
    else if (act === 'install') { ui.installEvt.prompt(); ui.installEvt = null; closeSheet(); }
  });
  on($('sheetBody'), 'change', function (e) {
    if (e.target.hasAttribute('data-hints')) { setPref(HINT_KEY, e.target.checked ? 'on' : 'off'); if (current === 'battle') renderBattle(); return; }
    var which = e.target.getAttribute('data-audio');
    if (which === 'sfx') window.WFAudio.setSfx(e.target.checked);
    if (which === 'music') window.WFAudio.setMusic(e.target.checked);
  });
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && !$('sheet').hidden && sheetDismissible) closeSheet();
  });

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ui.installEvt = e; });

  // ------------------------------------------------------------
  // boot
  // ------------------------------------------------------------
  // If the browser handed us a page from a different release than this code
  // (some screens missing), reload once from the network instead of showing a blank screen.
  var missing = Object.keys(SCREENS).some(function (n) { return !$(SCREENS[n]); });
  if (missing) {
    var tried = false;
    try { tried = sessionStorage.getItem('wf-reloaded') === '1'; sessionStorage.setItem('wf-reloaded', '1'); } catch (e) { tried = true; }
    if (!tried) { location.reload(); return; }
  } else {
    try { sessionStorage.removeItem('wf-reloaded'); } catch (e) { /* ignore */ }
  }

  S = load();
  if (S && (S.v !== 2 || !LEVELS[S.level])) S = null;   // v1 saves used the old firing rules
  // Games saved while the launch-codes screen still existed go straight to battle.
  if (S && S.phase === 'codes') { S.phase = 'battle'; S.turn = 'me'; }
  Promise.all([loadDictionary(S && S.lang), loadFleetNames()]).then(function () {
    if (S && S.phase === 'setup' && !S.me.name) { S.me.name = randomFleetName(); save(); }
    // On load, roll a random color scheme unless the captain has picked one for this game.
    if (S && S.phase === 'setup' && !S.colorsPicked) { S.colors = pick(COLOR_SCHEMES).id; save(); }
    if (S && S.phase === 'setup' && !S.wordsEdited && !S.me.words.every(inDictionary)) {
      S.me.words = randomWords(); save();
    }
    // MOBILE-HOME is parked: the app opens on 001-MOBILE-PREPARE (or the battle in progress).
    resume();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
