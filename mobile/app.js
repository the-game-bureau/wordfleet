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
    ensign:    { name: 'Captain Rubber Duck',    tiers: ['common'],   example: 'PIANO • JUMP • BED',
                 hint: 'A cheerful rookie who has never sailed beyond the bathtub. Hides everyday words anyone knows and calls letters on a hunch, vowels and all.',
                 pattern: false, vowelCost: 1, noise: 1, solve: null },
    commander: { name: 'Captain Steady', tiers: ['everyday'], example: 'WHARF • HOOF • KEG',
                 hint: 'A dependable old hand who has seen a few storms. Hides familiar words, calls sensible consonants, and solves your words once the clues line up.',
                 pattern: true, vowelCost: 0.45, noise: 0.15, solve: { known: 0.6, share: 1 } },
    admiral:   { name: 'Captain Lexicon',   tiers: ['rare'],     example: 'GLYPH • YURT • ASP',
                 hint: 'A walking dictionary with a periscope. Hides rare words that are hard to crack, studies every letter you reveal, almost never wastes a turn on a vowel, and solves early.',
                 pattern: true, vowelCost: 0.3, noise: 0.05, solve: { known: 0.4, share: 0.7 } }
  };

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
        Object.keys(d.tiers).forEach(function (tier) {
          Object.keys(d.tiers[tier]).forEach(function (len) {
            d.tiers[tier][len].forEach(function (w) {
              if (dictSet[w]) return;
              dictSet[w] = tier;
              (guessPool[len] = guessPool[len] || []).push({ w: w, wt: TIER_WEIGHT[tier] || 1 });
            });
          });
        });
      });
  }

  function offensiveOk() { return !!(S && S.offensiveOk); }
  function allowed(w) { return !offensiveSet[w] || offensiveOk(); }
  function inDictionary(w) { return !!dictSet[w] && allowed(w); }

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
    pool = pool.filter(allowed);
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

  function randomWordFor(i, others) {
    var pool = pickPool(SPECS[i].len);
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
  var ui = { tab: 'Attack', sel: null, dir: 'H', pick: 0, aiTimer: null, installEvt: null };

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
      me: { name: randomFleetName(), words: randomWords(), ships: null },
      foe: null,
      myShots: {}, myTallies: {},
      foeShots: {}, foeTallies: {},
      turn: null, incoming: [], lastFoe: null, skip: { me: false, foe: false }, notice: null,
      claims: null, log: [], turns: 0,
      winner: null, reason: null
    };
    ui.sel = null; ui.tab = 'Attack'; ui.pick = 0;
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
                  opponent: 'scrOpponent',   // "002-MOBILE-OPPONENT"
                  words: 'scrWords',         // "003-MOBILE-WORD-SHIPS"
                  deploy: 'scrDeploy',       // "004-MOBILE-DEPLOY"
                  battle: 'scrBattle', over: 'scrOver' };
  var current = 'home';

  function show(name) {
    current = name;
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

  function render() {
    if (current === 'home') renderHome();
    else if (current === 'setup' || current === 'opponent' || current === 'words') renderSetup();
    else if (current === 'deploy') renderDeploy();
    else if (current === 'battle') renderBattle();
    else if (current === 'over') renderOver();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2200);
  }

  var sheetDismissible = true;
  function openSheet(html, dismissible) {
    sheetDismissible = dismissible !== false;
    $('sheetBody').innerHTML = html;
    $('scrim').hidden = false;
    $('sheet').hidden = false;
    $('sheet').scrollTop = 0;
  }
  function closeSheet() {
    $('scrim').hidden = true;
    $('sheet').hidden = true;
    $('sheetBody').innerHTML = '';
  }

  // ------------------------------------------------------------
  // grid painter
  // ------------------------------------------------------------
  function paint(el, cellFn, tappable) {
    var html = '<div class="cell is-label"></div>';
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
    if (!S || S.phase === 'over') { newGame(); return show('setup'); }
    if (S.phase === 'setup') show(S.setupStep || 'setup');
    else if (S.phase === 'deploy') show('deploy');
    else if (S.phase === 'battle') show('battle');
    else show('over');
  }

  // ------------------------------------------------------------
  // SETUP
  // ------------------------------------------------------------
  function renderSetup() {
    setBar(null);
    if (document.activeElement !== $('inFleet')) $('inFleet').value = S.me.name;
    fitFleetName();
    $('selLang').innerHTML = languages.map(function (l) {
      return '<option value="' + esc(l.code) + '"' + (lang && l.code === lang.code ? ' selected' : '') + '>' + esc(l.name) + '</option>';
    }).join('');
    $('selLang').disabled = languages.length < 2;
    $('chkOffensive').checked = offensiveOk();
    setSeg('segLevel', S.level);
    $('levelHint').innerHTML = esc(LEVELS[S.level].hint) + ' <strong>e.g. ' + LEVELS[S.level].example + '</strong>';
    $('modeHint').textContent = 'Type over any word, tap \u21bb to redraw one, or Refresh All. Words must be in the ' +
      (lang ? lang.name : '') + ' dictionary: no proper nouns or abbreviations.';
    var html = '<div class="words">';
    SPECS.forEach(function (spec, i) {
      var w = S.me.words[i] || '';
      html += '<div class="word"><div class="word-class"><b>' + spec.cls + '</b>' + spec.len + ' letters</div>';
      // Every word is editable; the ↻ redraws just that one.
      html += '<input class="input" data-word="' + i + '" maxlength="' + spec.len + '" value="' + esc(w) + '" ' +
        'autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="' + '_'.repeat(spec.len) + '">' +
        '<button class="btn btn--sq" type="button" data-reroll="' + i + '" aria-label="Redraw ' + spec.cls + '">\u21bb</button>';
      html += '</div>';
    });
    html += '</div>';
    $('wordList').innerHTML = html;
    Array.prototype.forEach.call($('wordList').querySelectorAll('[data-word]'), markWordInput);
    $('setupNote').textContent = '';
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

  function markWordInput(input) {
    var i = +input.getAttribute('data-word');
    var w = input.value;
    input.classList.remove('is-bad', 'is-good');
    if (!w) return;
    if (w.length === SPECS[i].len) input.classList.add(wordProblem(w, SPECS[i].len) || !inDictionary(w) ? 'is-bad' : 'is-good');
  }

  function setupToDeploy() {
    {   // every word is checked, typed or drawn
      for (var i = 0; i < SPECS.length; i++) {
        var p = wordProblem(S.me.words[i] || '', SPECS[i].len);
        if (p) { $('setupNote').textContent = SPECS[i].cls + ' ' + p + '.'; return; }
      }
      var flagged = S.me.words.filter(function (w) { return dictSet[w] && !allowed(w); });
      if (flagged.length) {
        $('setupNote').textContent = flagged.join(', ') + ' may be offensive. Check "Possibly Offensive Words OK" to allow ' + (flagged.length > 1 ? 'them' : 'it') + '.';
        return;
      }
      var unknown = S.me.words.filter(function (w) { return !inDictionary(w); });
      if (unknown.length) {
        $('setupNote').textContent = unknown.join(', ') + (unknown.length > 1 ? " aren't" : " isn't") + ' in the ' + lang.name + ' dictionary. Real words only, captain \u2014 no proper nouns or abbreviations.';
        return;
      }
    }
    S.me.ships = S.me.words.map(function (w) { return { word: w, r: null, c: null, dir: 'H' }; });
    S.phase = 'deploy';
    ui.pick = 0;
    save();
    show('deploy');
  }

  // ------------------------------------------------------------
  // DEPLOY
  // ------------------------------------------------------------
  function renderDeploy() {
    setBar('Deploy', 'is-quiet');
    var ships = S.me.ships;
    var placed = ships.filter(function (s) { return s.r != null; }).length;
    $('deployCount').textContent = placed + ' of 5 deployed';
    setSeg('segDir', ui.dir);
    var b = boardOf(ships);
    paint($('gridDeploy'), function (r, c) {
      var cell = b[key(r, c)];
      return cell ? { cls: 'is-ship', text: cell.letter } : {};
    }, true);
    $('roster').innerHTML = ships.map(function (s, i) {
      var on = s.r == null && i === ui.pick;
      return '<button type="button" class="ship' + (on ? ' is-on' : '') + (s.r != null ? ' is-placed' : '') + '" data-ship="' + i + '">' +
        '<span class="ship-class">' + SPECS[i].cls + '</span>' +
        '<span class="ship-word">' + esc(s.word) + '</span>' +
        '<span class="ship-at">' + (s.r != null ? coord(s.r, s.c) + (s.dir === 'H' ? ' →' : ' ↓') : 'in port') + '</span></button>';
    }).join('');
    $('btnDeployDone').disabled = placed < 5;
  }

  // Pull a deployed ship back into port and select it.
  function liftShip(idx) {
    var ship = S.me.ships[idx];
    if (ship.r == null) return;
    ship.r = null; ship.c = null;
    ui.pick = idx;
    sfx('select');
    save(); renderDeploy();
  }

  function nextUnplaced(from) {
    var ships = S.me.ships;
    for (var n = 0; n < 5; n++) {
      var i = (from + n) % 5;
      if (ships[i].r == null) return i;
    }
    return -1;
  }

  function deployTap(k) {
    var p = unkey(k);
    var ships = S.me.ships;
    var b = boardOf(ships);
    if (b[k]) {
      var idx = b[k].ship, ship = ships[idx];
      if (ship.r === p.r && ship.c === p.c) {
        // First letter: a double tap swings it between across and down;
        // a single tap (no second tap in time) lifts it like any other letter.
        if (ui.firstTap && ui.firstTap.k === k) {
          clearTimeout(ui.firstTap.timer);
          ui.firstTap = null;
          var dir = ship.dir === 'H' ? 'V' : 'H';
          if (fits(ships, idx, ship.r, ship.c, dir)) { ship.dir = dir; sfx('rotate'); save(); renderDeploy(); }
          else { sfx('error'); toast(ship.word + " won't fit " + (dir === 'H' ? 'across' : 'down') + ' from ' + coord(ship.r, ship.c)); }
          return;
        }
        if (ui.firstTap) clearTimeout(ui.firstTap.timer);
        ui.firstTap = { k: k, timer: setTimeout(function () { ui.firstTap = null; liftShip(idx); }, 320) };
        return;
      }
      liftShip(idx);
      return;
    }
    if (ui.pick < 0 || ships[ui.pick].r != null) ui.pick = nextUnplaced(0);
    if (ui.pick < 0) { toast('All five word-ships are deployed.'); return; }
    if (!fits(ships, ui.pick, p.r, p.c, ui.dir)) {
      sfx('error');
      toast(ships[ui.pick].word + " won't fit " + (ui.dir === 'H' ? 'across' : 'down') + ' from ' + coord(p.r, p.c));
      return;
    }
    var s = ships[ui.pick];
    s.r = p.r; s.c = p.c; s.dir = ui.dir;
    sfx('place');
    ui.pick = nextUnplaced(ui.pick);
    save(); renderDeploy();
  }

  function confirmDeploy() {
    var foeWords = randomWords();
    S.foe = { name: randomFleetName(), words: foeWords, ships: scatter(foeWords) };
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
    setBar(mine ? 'Your Turn' : 'AI Captain\'s Turn', mine ? '' : 'is-foe');
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

  function pips(total, filled, cls) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<i class="pip' + (i < filled ? ' ' + cls : '') + '"></i>';
    return '<span class="pips">' + h + '</span>';
  }

  // Can the Human Captain pick a square and call a letter right now?
  function canCall() { return S.turn === 'me' && (!S.result || S.result.bonus) && !ui.demand; }

  // Tapping a hidden square on the Attack Grid pops up the letter picker.
  function openManifest(k) {
    if (!canCall()) return;
    if (S.myShots[k] && (S.myShots[k].letter || S.myShots[k].empty)) return;
    ui.sel = k;
    if (S.result && S.result.bonus) S.result = null;
    renderAttack();
    var letters = LETTERS.map(function (L) {
      var t = S.myTallies[L], v = isVowel(L);
      if (t != null) {
        return '<div class="mf ' + (t ? 'is-done' : 'is-zero') + '"><span class="mf-l">' + L + '</span>' +
          (t ? pips(t, t, 'is-found') : '<span class="mf-none">none</span>') + '</div>';
      }
      return '<button type="button" class="mf is-callable' + (v ? ' is-vowel' : '') + '" data-letter="' + L + '">' +
        '<span class="mf-l">' + L + '</span>' + (v ? '<span class="mf-vowel">−1 turn</span>' : '<span class="pips"></span>') + '</button>';
    }).join('');
    openSheet('<h2>Square ' + coordK(k) + '</h2>' +
      '<p class="hint" style="margin:2px 0 0">Call a letter. If it\'s in ' + coordK(k) + ', you get a <strong>bonus turn</strong>. Vowels cost your next turn.</p>' +
      '<div class="manifest manifest--pick">' + letters + '</div>' +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="close">Cancel</button>');
  }

  function renderAttack() {
    var mine = S.turn === 'me';
    var live = canCall();
    // Ship status: yellow once some of its letters show, green once all of them do.
    $('bubbles').innerHTML = S.foe.ships.map(function (ship, i) {
      var shots = cellsOf(ship).map(function (p) { return S.myShots[key(p.r, p.c)]; });
      var some = shots.some(function (s) { return s && s.letter; });
      var all = shots.every(function (s) { return s && s.letter; });
      var state = all ? 'solved' : some ? 'located' : 'hidden';
      return '<span class="bubble is-' + state + '" title="' + SPECS[i].cls + ': ' + (all ? 'solved' : some ? 'partly revealed' : 'hidden') + '">' + SPECS[i].len + '</span>';
    }).join('');
    paint($('gridAttack'), function (r, c) {
      var k = key(r, c);
      var s = S.myShots[k];
      var o = s && s.letter ? { cls: 'is-bull', text: s.letter, off: true } : s && s.empty ? { cls: 'is-empty', off: true } : {};
      if (ui.sel === k && !(s && s.letter)) o.cls = (o.cls || '') + ' is-target';
      if (ui.flash && ui.flash.indexOf(k) !== -1) o.cls = (o.cls || '') + ' is-flash';
      return o;
    }, live);

    // Attack Manifest (display only): called letters with one dot per square revealed.
    $('attackManifest').innerHTML = LETTERS.map(function (L) {
      var t = S.myTallies[L], cls = 'mf' + (isVowel(L) && t == null ? ' is-vowel' : '');
      var under = t == null ? '<span class="pips"></span>' : t ? pips(t, t, 'is-found') : '<span class="mf-none">none</span>';
      if (t != null) cls += t ? ' is-done' : ' is-zero';
      return '<div class="' + cls + '"><span class="mf-l">' + L + '</span>' + under + '</div>';
    }).join('');

    var fp = $('firePanel');
    var found = bullCount(S.myShots);
    var demandBtn = '<button class="btn btn--danger btn--wide" type="button" data-act="demand">Demand Surrender</button>';
    if (ui.demand && mine) {
      fp.innerHTML = demandForm();
    } else if (S.result) {
      fp.innerHTML = '<div class="card-title">' + S.result.title + '</div>' + S.result.html +
        (S.result.solve ? solveBox() : '') +
        (S.result.bonus ? '<p class="hint" style="margin-bottom:6px">Tap another square on the Attack Grid to take your bonus turn.</p>' + demandBtn
                        : mine ? '<button class="btn btn--primary btn--wide" type="button" data-act="endTurn">End Turn</button>'
                               : '<p class="waiting">AI Captain is choosing a square\u2026</p>');
    } else if (!mine) {
      fp.innerHTML = '<p class="waiting">AI Captain is choosing a square\u2026</p>';
    } else {
      fp.innerHTML = '<div class="card-title">Your Turn &middot; ' + found + ' of ' + FLEET_CELLS + ' letters revealed</div>' +
        (S.notice ? '<p class="notice">' + S.notice + '</p>' : '') +
        '<p class="hint" style="margin-top:0">Tap a square on the Attack Grid, then call a letter. Every square holding it is revealed. If it\'s in the square you picked, you get a <strong>bonus turn</strong>. Vowels cost your next turn.</p>' +
        demandBtn;
    }
  }

  function renderDefense() {
    var b = myBoard();
    var ev = S.lastFoe;
    var flashing = ev && ev.unseen && ui.tab === 'Defense';
    paint($('gridDefense'), function (r, c) {
      var k = key(r, c);
      var cell = b[k];
      var s = S.foeShots[k];
      var cls = cell ? 'is-ship' + (s && s.letter ? ' is-ship-lost' : '') : s && s.empty ? 'is-empty' : '';
      if (ui.tab === 'Defense' && (S.incoming || []).some(function (e) { return e.square === k; })) cls += ' is-aimed';
      if (flashing && ev.cells && ev.cells.indexOf(k) !== -1) cls += ' is-flash';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
    if (flashing) { ev.unseen = false; save(); $('defDot').hidden = true; }

    var counts = letterCounts(S.me.words), lost = {};
    Object.keys(S.foeShots).forEach(function (k) { var L = S.foeShots[k].letter; if (L) lost[L] = (lost[L] || 0) + 1; });
    $('defenseManifest').innerHTML = LETTERS.map(function (L) {
      var n = counts[L];
      return '<div class="mf' + (n === 0 ? ' is-dim' : '') + (isVowel(L) && n ? ' is-vowel' : '') + '"><span class="mf-l">' + L + '</span>' + pips(n, lost[L] || 0, 'is-lost') + '</div>';
    }).join('');

    // The AI Captain's moves since your last turn, one line each.
    var ic = $('incomingCard');
    var list = S.incoming || [];
    ic.hidden = !list.length;
    ic.innerHTML = list.length ? '<div class="incoming-title">Incoming fire from the AI Captain</div>' + list.map(incomingHtml).join('') +
      (S.turn === 'me' ? '<button class="btn btn--primary btn--wide" type="button" data-act="returnFire">Your Turn: Return Fire \u2192 Attack Grid</button>'
                       : '<p class="waiting">The AI Captain goes again…</p>') : '';
  }

  function incomingHtml(ev) {
    if (ev.skip) return '<p class="notice">You called a vowel, so you lose this turn.</p>';
    var h = '<div class="report ' + (ev.tally ? 'is-bad' : 'is-good') + '"><div class="report-q">' + coordK(ev.square) + ': "Calling ' + NATO[ev.letter] + '!"</div>' +
      '<div class="report-a">"' + ev.letter + ' tally ' + ev.tally + '."</div></div>';
    if (ev.cells && ev.cells.length && ev.tally) h += revealNote(ev.letter, ev.cells.slice(0, ev.tally), 'your');
    if (ev.bonus) h += '<p class="bonus is-foe">★ ' + ev.letter + ' was at ' + coordK(ev.square) + ': the AI Captain takes a bonus turn.</p>';
    if (ev.vowel) h += '<p class="notice">The AI Captain called a vowel, so it loses its next turn.</p>';
    if (ev.solve) {
      h += '<div class="report ' + (ev.solve.ok ? 'is-bad' : 'is-good') + '"><div class="report-q">"Solve: ' + ev.solve.word + '!"</div><div class="report-a">' + (ev.solve.ok ? '"Correct."' : '"Negative."') + '</div></div>' +
        (ev.solve.ok ? '<p class="hint">Your word-ship <strong>' + ev.solve.word + '</strong> is fully exposed.</p>' : '');
    }
    return h;
  }

  function renderLog() {
    $('log').innerHTML = S.log.length ? S.log.map(function (l) {
      return '<div class="log-item' + (l.who === 'foe' ? ' is-foe' : '') + '"><span class="log-who">' +
        (l.who === 'foe' ? 'AI Captain · ' + esc(S.foe.name) : l.who === 'me' ? 'Human Captain · ' + esc(S.me.name) : 'Fleet Command') + '</span>' + l.text + '</div>';
    }).join('') : '<p class="log-empty">No letters called yet.</p>';
  }

  function switchTab(tab) {
    ui.tab = tab;
    renderBattle();
    window.scrollTo(0, 0);
  }

  // Every square holding L is revealed, wherever it is. Returns the newly revealed squares.
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
    if (vowel) S.skip.me = true;
    var cells = revealLetter(S.myShots, foeBoard(), L);
    ui.flash = cells;
    log('me', coordK(k) + ': "Calling ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>' +
      (bonus ? ' It was at ' + coordK(k) + ': bonus turn.' : '') + (vowel ? ' A vowel: the Human Captain loses the next turn.' : ''));
    sfx('select');
    sfx(t ? 'fill' : 'zero', 0.2);
    if (bonus) sfx('bull', 0.5);
    if (vowel) sfx('error', 0.6);
    if (allRevealed(S.myShots, foeBoard())) { finish('me', 'reveal'); return; }
    var html = '<div class="report ' + (t ? 'is-good' : 'is-warn') + '"><div class="report-q">' + coordK(k) + ': "Calling ' + NATO[L] + '!"</div><div class="report-a">"' + L + ' tally ' + t + '."</div></div>' +
      (t ? revealNote(L, cells, 'the AI Captain\'s') : '<p class="hint">' + L + ' is nowhere in the AI Captain\'s fleet.</p>') +
      (bonus ? '<p class="bonus">\u2605 Bonus turn! ' + L + ' was hiding at ' + coordK(k) + '.</p>' : (at ? '' : '<p class="hint">' + coordK(k) + ' is open water.</p>')) +
      (vowel ? '<p class="notice">Vowel: you lose your next turn.</p>' : '');
    showResult('Calling ' + NATO[L], html, t > 0, bonus);
  }

  // --- solve a word (after calling a letter that is in the fleet) ---
  function solveBox() {
    return '<div class="solve" id="solveBox"><span class="label">Solve a Word (optional)</span>' +
      '<div class="input-row"><input class="input" id="solveIn" maxlength="5" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="WORD">' +
      '<button class="btn" type="button" data-act="solve">Solve</button></div>' +
      '<p class="hint">Name one of the AI Captain\'s word-ships. Get it right and the whole word is revealed.</p></div>';
  }

  // Fill in every square of the first unsolved word-ship spelling `word`.
  function solveWord(shots, ships, word) {
    for (var i = 0; i < ships.length; i++) {
      var ship = ships[i];
      if (ship.word !== word) continue;
      var cells = cellsOf(ship);
      if (cells.every(function (p) { var s = shots[key(p.r, p.c)]; return s && s.letter; })) continue;
      var filled = [];
      cells.forEach(function (p, j) {
        var k = key(p.r, p.c);
        if (!(shots[k] && shots[k].letter)) filled.push(k);
        shots[k] = { hit: true, letter: word[j], wrong: (shots[k] && shots[k].wrong) || [] };
      });
      return { idx: i, cells: filled };
    }
    return null;
  }

  function humanSolve() {
    var word = ($('solveIn').value || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (word.length < 2) { $('solveIn').focus(); return; }
    var res = solveWord(S.myShots, S.foe.ships, word);
    var html;
    sfx(res ? 'solveOk' : 'solveBad');
    if (res) {
      ui.flash = res.cells;
      log('me', '"Solve: ' + word + '!" &mdash; <span class="say">"Correct."</span>');
      if (allRevealed(S.myShots, foeBoard())) { finish('me', 'reveal'); return; }
      html = '<div class="report is-good"><div class="report-q">"Solve: ' + word + '!"</div><div class="report-a">"Correct."</div></div>';
    } else {
      log('me', '"Solve: ' + word + '!" &mdash; <span class="say">"Negative."</span>');
      html = '<div class="report is-bad"><div class="report-q">"Solve: ' + word + '!"</div><div class="report-a">"Negative."</div></div>';
    }
    S.result.html += html;
    S.result.solve = false;
    save();
    renderBattle();
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
    return '<div class="card-title" style="color:var(--red)">Demand Surrender</div>' +
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
    for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) if (!sh[key(r, c)]) hidden.push(key(r, c));
    return pick(hidden);
  }

  // Solve when the revealed letters pin a word down.
  function foeTrySolve(lvl) {
    var best = null, groups = {};
    eachFit(2, function (e, seg, known, len) {
      if (known / len < lvl.solve.known || (S.foeMissedSolves || []).indexOf(e.w) !== -1) return;
      var g = groups[seg.join('.') + len] = groups[seg.join('.') + len] || { known: known, len: len, total: 0, top: null };
      g.total += e.wt;
      if (!g.top || e.wt > g.top.wt) g.top = e;
    });
    Object.keys(groups).forEach(function (id) {
      var g = groups[id];
      if (g.top.wt / g.total < lvl.solve.share) return;
      var sc = g.known / g.len + g.top.wt / g.total;
      if (!best || sc > best.score) best = { word: g.top.w, score: sc };
    });
    return best && best.word;
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
    if (vowel) S.skip.foe = true;
    var ev = { letter: L, square: k, tally: t, vowel: vowel, bonus: bonus, cells: revealLetter(S.foeShots, myBoard(), L) };
    log('foe', coordK(k) + ': "Calling ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>' +
      (bonus ? ' It was at ' + coordK(k) + ': bonus turn.' : '') + (vowel ? ' A vowel: the AI Captain loses its next turn.' : ''));
    if (t && lvl.solve && !allRevealed(S.foeShots, myBoard())) {
      var guess = foeTrySolve(lvl);
      if (guess) {
        var res = solveWord(S.foeShots, S.me.ships, guess);
        ev.solve = { word: guess, ok: !!res };
        if (res) ev.cells = ev.cells.concat(res.cells);
        else (S.foeMissedSolves = S.foeMissedSolves || []).push(guess);
        log('foe', '"Solve: ' + guess + '!" &mdash; <span class="say">' + (res ? '"Correct."' : '"Negative."') + '</span>');
      }
    }
    sfx('incoming');
    sfx(t ? 'fill' : 'zero', 0.5);
    if (bonus) sfx('bull', 0.9);
    if (ev.solve) sfx(ev.solve.ok ? 'solveOk' : 'solveBad', 1.1);
    if (allRevealed(S.foeShots, myBoard())) { finish('foe', 'foe-reveal'); return; }
    ev.unseen = true;
    S.lastFoe = ev;
    S.incoming.push(ev);
    if (!bonus) passTurn('me');     // a bonus turn keeps it with the AI Captain
    save();
    // Show the damage on the Defense Grid; the report there leads back to the Attack Grid.
    switchTab('Defense');
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
    save();
    show('over');
  }

  function renderOver() {
    var won = S.winner === 'me';
    setBar(won ? 'Victory' : 'Defeat', won ? '' : 'is-foe');
    var eyebrow, title, quote;
    if (S.reason === 'reveal') { eyebrow = 'Total Victory'; title = 'Every letter of the ' + S.foe.name + ' is showing.'; quote = 'Their whole fleet is revealed. "You have won."'; }
    else if (S.reason === 'foe-reveal') { eyebrow = 'Fleet Exposed'; title = 'The AI Captain revealed your whole fleet.'; quote = 'Every letter of the ' + S.me.name + ' is showing.'; }
    else if (S.reason === 'demand-right') { eyebrow = 'Total Victory'; title = 'The ' + S.foe.name + ' surrenders.'; quote = '"You have won."'; }
    else if (S.reason === 'demand-wrong') { eyebrow = 'Surrender Refused'; title = 'Your demand missed the mark.'; quote = '"Victory is mine! You lose! Good day sir!"'; }
    else { eyebrow = 'Fleet Surrendered'; title = 'The ' + S.foe.name + ' named every ship.'; quote = 'You were obliged to answer: "You have won."'; }
    $('overEyebrow').textContent = eyebrow;
    $('overTitle').textContent = title;
    $('overQuote').textContent = quote;
    var called = Object.keys(S.myTallies);
    $('overStats').innerHTML =
      '<div class="stat"><b>' + called.length + '</b><span>Letters called</span></div>' +
      '<div class="stat"><b>' + called.filter(isVowel).length + '</b><span>Vowels</span></div>' +
      '<div class="stat"><b>' + bullCount(S.myShots) + '/' + FLEET_CELLS + '</b><span>Revealed</span></div>';
    $('overFoeWords').textContent = S.foe.words.join(' • ');
    $('overMyWords').textContent = S.me.words.join(' • ');
    var fb = foeBoard(), mb = myBoard();
    paint($('gridOverFoe'), function (r, c) {
      var k = key(r, c), cell = fb[k], s = S.myShots[k];
      var cls = cell ? (s && s.letter ? 'is-bull' : 'is-ship') : s && s.empty ? 'is-empty' : '';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
    paint($('gridOverMe'), function (r, c) {
      var k = key(r, c), cell = mb[k], s = S.foeShots[k];
      var cls = cell ? 'is-ship' + (s && s.letter ? ' is-ship-lost' : '') : s && s.empty ? 'is-empty' : '';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
  }

  // ------------------------------------------------------------
  // menu + rules
  // ------------------------------------------------------------
  function openMenu() {
    var live = S && S.phase !== 'over' && S.phase !== 'setup';
    openSheet('<h2>Word Fleet</h2><div class="menu-list">' +
      '<button class="btn btn--primary btn--wide" type="button" data-act="newBattle">New Battle</button>' +
      '<button class="btn btn--wide" type="button" data-act="rules">Rules of Engagement</button>' +
      (ui.installEvt ? '<button class="btn btn--wide" type="button" data-act="install">Install Word Fleet</button>' : '') +
      '<a class="btn btn--wide" href="https://thegamebureau.com/wordfleet/">Home Port</a>' +
      '<a class="btn btn--wide" href="https://thegamebureau.com/">By The Game Bureau</a>' +
      (live ? '<button class="btn btn--danger btn--wide" type="button" data-act="abandon">Abandon Battle</button>' : '') +
      (window.WFAudio ? '<div class="switches">' +
        '<label class="switch-row"><span>Sound Effects</span><input type="checkbox" class="switch" data-audio="sfx"' + (window.WFAudio.sfxOn() ? ' checked' : '') + '></label>' +
        '<label class="switch-row"><span>Music</span><input type="checkbox" class="switch" data-audio="music"' + (window.WFAudio.musicOn() ? ' checked' : '') + '></label>' +
        '</div>' : '') +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="close">Close</button></div>');
  }

  function openRules() {
    openSheet('<div class="sheet-eyebrow">Word Fleet</div><h2>Rules of Engagement</h2><div class="rules">' +
      '<h3>Fleet Deployment</h3><ul>' +
      '<li>Five word-ships: KETCH (5), SHIP (4), SUB (3), ARK (3), PT (2).</li>' +
      '<li>Place them left-to-right or top-to-bottom. No diagonals or backwards.</li>' +
      '<li>Ships may touch but not overlap. No proper nouns, abbreviations, or suffixes.</li></ul>' +
      '<h3>Who Goes First?</h3><p>Against the AI Captain, the Human Captain always goes first.</p>' +
      '<h3>Your Turn: Call a Letter</h3><ul>' +
      '<li>Tap a hidden square on the Attack Grid, then call a letter. Every square in the opponent\'s fleet that holds it is revealed, wherever it is.</li>' +
      '<li><strong>Bonus turn:</strong> if the letter is in the square you tapped, you go again. Otherwise the turn passes.</li>' +
      '<li><strong>Vowels</strong> (A E I O U) can be called and reveal the same way, but the caller loses their next turn.</li>' +
      '<li><strong>Solve a Word:</strong> after calling a letter that is in the opponent\'s fleet, you may name one whole word-ship. Right, and every square of it is revealed.</li></ul>' +
      '<h3>Winning</h3><ul>' +
      '<li>Reveal every letter of the opponent\'s fleet and you win.</li>' +
      '<li><strong>Demand Surrender:</strong> instead of calling a letter, name every one of your opponent\'s word-ships and exactly where it sits. All correct: <span class="say">"You have won."</span> Anything wrong: <span class="say">"Victory is mine! You lose! Good day sir!"</span></li></ul>' +
      '<h3>Reading the Tracker</h3><ul>' +
      '<li>Attack Grid: green squares are revealed letters of the AI Captain\'s fleet. Defense Grid: red squares are your letters the AI Captain has revealed.</li>' +
      '<li>Manifests: each dot under a letter is one copy of it in the fleet. The 5 4 3 3 2 circles turn yellow when some of that word-ship is showing and green when all of it is.</li></ul>' +
      '</div><button class="btn btn--primary btn--wide" type="button" data-act="close">Aye, Aye</button>');
  }

  // ------------------------------------------------------------
  // events
  // ------------------------------------------------------------
  function on(el, type, fn) { if (el) el.addEventListener(type, fn); }

  on($('btnMenu'), 'click', openMenu);
  function newBattle() {
    if (S && S.phase !== 'over' && S.phase !== 'setup' && !confirm('Abandon the current battle?')) return false;
    if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
    newGame(); show('setup');
    return true;
  }
  on($('btnNew'), 'click', newBattle);
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
  on($('inFleet'), 'input', function () { S.me.name = this.value.toUpperCase(); fitFleetName(); save(); });
  on($('btnRollName'), 'click', function () { S.me.name = randomFleetName(); $('inFleet').value = S.me.name; fitFleetName(); save(); });
  on($('segLevel'), 'click', function (e) {
    var v = e.target.getAttribute('data-v');
    if (!v) return;
    S.level = v;
    if (!S.wordsEdited) S.me.words = randomWords();   // drawn words follow the opponent; typed ones stay
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
    // Redraw any drawn word that is no longer allowed; typed words are checked at Deploy.
    if (!S.wordsEdited) S.me.words = S.me.words.map(function (w, i) { return inDictionary(w) ? w : randomWordFor(i, S.me.words); });
    save(); renderSetup();
  });
  // Prepare for Battle runs in three steps: 001 name/language, 002 opponent, 003 words.
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
  on($('segDir'), 'click', function (e) {
    var v = e.target.getAttribute('data-v');
    if (v) { ui.dir = v; renderDeploy(); }
  });
  on($('roster'), 'click', function (e) {
    var b = e.target.closest('[data-ship]');
    if (!b) return;
    var i = +b.getAttribute('data-ship');
    var s = S.me.ships[i];
    if (s.r != null) { s.r = null; s.c = null; save(); }
    ui.pick = i;
    renderDeploy();
  });
  on($('btnScatter'), 'click', function () { S.me.ships = scatter(S.me.words); ui.pick = -1; sfx('place'); save(); renderDeploy(); });
  on($('btnClear'), 'click', function () { S.me.ships.forEach(function (s) { s.r = null; s.c = null; }); ui.pick = 0; save(); renderDeploy(); });
  on($('btnDeployDone'), 'click', confirmDeploy);
  on($('btnDeployBack'), 'click', function () { S.phase = 'setup'; S.setupStep = 'words'; save(); show('words'); });

  // battle
  on($('firePanel'), 'click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'demand') { ui.demand = true; renderAttack(); $('firePanel').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    else if (act === 'belay') { ui.demand = false; renderAttack(); }
    else if (act === 'endTurn') endMyTurn();
    else if (act === 'solve') humanSolve();
    else if (act === 'submitDemand') submitDemand(false);
    else if (act === 'submitDemandSure') submitDemand(true);
  });
  on($('gridAttack'), 'click', function (e) {
    var c = e.target.closest('[data-k]');
    if (c) openManifest(c.getAttribute('data-k'));
  });
  on($('firePanel'), 'input', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('firePanel'), 'change', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('tabDefense'), 'click', function (e) {
    if (e.target.closest('[data-act="returnFire"]')) { S.incoming = []; save(); switchTab('Attack'); }
  });
  on($('tabbar'), 'click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    var tab = b.getAttribute('data-tab');
    // Heading back to the Attack Grid counts as reading the incoming report.
    if (tab === 'Attack' && S.turn === 'me' && S.incoming.length) { S.incoming = []; save(); }
    switchTab(tab);
  });

  on($('btnAgain'), 'click', function () { newGame(); show('setup'); });

  // sheet
  on($('scrim'), 'click', function () { if (sheetDismissible) closeSheet(); });
  on($('sheetBody'), 'click', function (e) {
    var k = e.target.closest('[data-letter]');
    if (k) { humanCall(k.getAttribute('data-letter')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'close') { closeSheet(); if (ui.sel && current === 'battle') { ui.sel = null; renderAttack(); } }
    else if (act === 'rules') openRules();
    else if (act === 'home') { closeSheet(); show('home'); }
    else if (act === 'newBattle') { if (newBattle()) closeSheet(); }
    else if (act === 'abandon') {
      if (!confirm('Abandon this battle? It counts as a loss.')) return;
      if (S.phase === 'battle') bumpRecord(false);
      closeSheet(); S = null; try { localStorage.removeItem(STORE); } catch (err) { /* ignore */ }
      newGame(); show('setup');
    }
    else if (act === 'install') { ui.installEvt.prompt(); ui.installEvt = null; closeSheet(); }
  });
  on($('sheetBody'), 'change', function (e) {
    var which = e.target.getAttribute('data-audio');
    if (which === 'sfx') window.WFAudio.setSfx(e.target.checked);
    if (which === 'music') window.WFAudio.setMusic(e.target.checked);
  });
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && !$('sheet').hidden && sheetDismissible) closeSheet();
    if ((e.key === 'r' || e.key === 'R') && current === 'deploy' && document.activeElement.tagName !== 'INPUT') {
      ui.dir = ui.dir === 'H' ? 'V' : 'H'; renderDeploy();
    }
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
    if (S && S.phase === 'setup' && !S.wordsEdited && !S.me.words.every(inDictionary)) {
      S.me.words = randomWords(); save();
    }
    // MOBILE-HOME is parked: the app opens on 001-MOBILE-PREPARE (or the battle in progress).
    if (S && S.phase === 'battle' && S.incoming.length) ui.tab = 'Defense';
    resume();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
