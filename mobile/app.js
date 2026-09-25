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

  // Difficulty = how common the AI Captain's words are, and how sharply it hunts.
  var LEVELS = {
    ensign:    { name: 'Ensign',    tiers: ['common'],   example: 'PIANO \u2022 JUMP \u2022 BED',
                 hint: 'Everyday words anyone knows. The AI Captain fires wide and guesses letters by gut.',
                 hunt: 'random',  target: 'loose', follow: 0.5, pattern: false, refire: 0.9, solve: null },
    commander: { name: 'Commander', tiers: ['everyday'], example: 'WHARF \u2022 HOOF \u2022 KEG',
                 hint: 'Familiar but less frequent words. The AI Captain follows up hits and reads the grid for likely words.',
                 hunt: 'parity',  target: 'line',  follow: 1,   pattern: true,  refire: 0.6, solve: { known: 0.6, share: 1 } },
    admiral:   { name: 'Admiral',   tiers: ['rare'],     example: 'GLYPH \u2022 YURT \u2022 ASP',
                 hint: 'Uncommon words that hide well. The AI Captain hunts by probability and cracks words from every tally.',
                 hunt: 'density', target: 'density', follow: 1, pattern: true, refire: 0.5, words: true, solve: { known: 0.4, share: 0.7 } }
  };

  var FLEET_ADJ = ['Salty', 'Barnacle-Crusted', 'Rum-Soaked', 'Royal', 'Crabby', 'Peg-Legged', 'Stormy', 'Treacherous', 'Cursed', 'Ghostly', 'Iron-Bound', 'Sea-Worn', 'Soggy-Bottom', 'Windswept', 'Ironclad', 'Thunderhead', 'Bloodwake', 'Scurvy', "Admiral's", "Commodore's", 'Steel-Hulled', 'Storm-Battered', 'Salt-Crusted', 'Rust-Stained', 'Sun-Bleached', 'Cannon-Heavy', 'Torpedo-Laden', 'Merciless', 'Grog-Fueled', 'Hook-Handed', "Kraken's", "Siren's", "Neptune's", 'Abyssal', 'Phantom', 'Half-Sunk', 'Creaking', 'Patched-Up', 'Battle-Scarred'];
  var FLEET_NOUN = ['Armada', 'Fleet', 'Flotilla', 'Squadron', 'Convoy', 'Navy', 'Task Force', 'Krewe', 'Battlegroup', 'Regatta', 'Patrol', 'Strike Force', 'Vanguard', 'Blockade', 'Tempest', 'Gale', 'Maelstrom', 'Admiralty', 'Legion', 'Brotherhood', 'Alliance', 'Trench', 'Reef', 'Harbor', 'Siege', 'Bombardment', 'Expedition', 'Voyage', 'Odyssey'];

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
  function randomFleetName() { return (pick(FLEET_ADJ) + ' ' + pick(FLEET_NOUN)).toUpperCase(); }
  function allSame(w) { return w.split('').every(function (ch) { return ch === w[0]; }); }

  // ------------------------------------------------------------
  // dictionary
  // One JSON file per language in /dictionaries, listed in dictionaries/languages.json.
  // Each file holds words in commonness tiers (see dictionaries/build-en-US.js).
  // ------------------------------------------------------------
  var TIER_WEIGHT = { common: 4, everyday: 2, rare: 1, extra: 0.5 };
  var languages = [];   // dictionaries/languages.json
  var lang = null;      // { code, name, tiers, offensive }
  var offensiveSet = {};
  var dictSet = {};     // every playable word -> tier name
  var guessPool = {};   // length -> [{ w, wt }] for the AI Captain's letter reads

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
    var tiers = (LEVELS[S && S.level] || LEVELS.commander).tiers;
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
      v: 1,
      phase: 'setup',
      level: (S && S.level) || 'commander',
      lang: (S && S.lang) || (lang && lang.code) || 'en-US',
      offensiveOk: !!(S && S.offensiveOk),
      mode: (S && S.mode) || 'auto',
      me: { name: '', words: randomWords(), ships: null },
      foe: null,
      myShots: {}, myTallies: {},
      foeShots: {}, foeTallies: {},
      turn: null, alpha: null, incoming: null, lastFoe: null,
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
  var SCREENS = { home: 'scrHome', setup: 'scrSetup', deploy: 'scrDeploy', battle: 'scrBattle', over: 'scrOver' };
  var current = 'home';

  function show(name) {
    current = name;
    Object.keys(SCREENS).forEach(function (n) { $(SCREENS[n]).classList.toggle('is-on', n === name); });
    window.scrollTo(0, 0);
    render();
  }

  function setBar(sub, chip, cls) {
    $('barSub').textContent = sub || 'Mobile Mode';
    var el = $('barChip');
    el.hidden = !chip;
    el.textContent = chip || '';
    el.className = 'chip' + (cls ? ' ' + cls : '');
  }

  function render() {
    if (current === 'home') renderHome();
    else if (current === 'setup') renderSetup();
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
    setBar('Mobile Mode', null);
    var live = S && S.phase !== 'over' && S.phase !== 'setup';
    $('btnContinue').hidden = !live;
    $('btnNew').className = 'btn btn--wide ' + (live ? '' : 'btn--primary');
    var r = record();
    $('homeRecord').textContent = r.won + r.lost ? 'SERVICE RECORD: ' + r.won + ' WON / ' + r.lost + ' LOST' : '';
  }

  function resume() {
    if (!S) return show('home');
    if (S.phase === 'setup') show('setup');
    else if (S.phase === 'deploy') show('deploy');
    else if (S.phase === 'battle') show('battle');
    else show('over');
  }

  // ------------------------------------------------------------
  // SETUP
  // ------------------------------------------------------------
  function renderSetup() {
    setBar('Fleet Setup', 'Setup', 'is-quiet');
    if (document.activeElement !== $('inFleet')) $('inFleet').value = S.me.name;
    $('selLang').innerHTML = languages.map(function (l) {
      return '<option value="' + esc(l.code) + '"' + (lang && l.code === lang.code ? ' selected' : '') + '>' + esc(l.name) + '</option>';
    }).join('');
    $('selLang').disabled = languages.length < 2;
    $('chkOffensive').checked = offensiveOk();
    setSeg('segMode', S.mode);
    setSeg('segLevel', S.level);
    $('levelHint').innerHTML = esc(LEVELS[S.level].hint) + ' <strong>e.g. ' + LEVELS[S.level].example + '</strong>';
    $('modeHint').textContent = S.mode === 'auto'
      ? 'Words are drawn from the ' + (lang ? lang.name : '') + ' dictionary at your chosen difficulty. Tap \u21bb to redraw one. The AI Captain draws its fleet the same way.'
      : 'Pick your own words \u2014 they must be in the ' + (lang ? lang.name : '') + ' dictionary. No proper nouns, abbreviations, or suffixes. The AI Captain draws its fleet at your chosen difficulty.';
    var html = '<div class="words">';
    SPECS.forEach(function (spec, i) {
      var w = S.me.words[i] || '';
      html += '<div class="word"><div class="word-class"><b>' + spec.cls + '</b>' + spec.len + ' letters</div>';
      if (S.mode === 'auto') {
        html += '<div class="word-fixed">' + esc(w) + '</div>' +
          '<button class="btn btn--sq" type="button" data-reroll="' + i + '" aria-label="Redraw ' + spec.cls + '">↻</button>';
      } else {
        html += '<input class="input" data-word="' + i + '" maxlength="' + spec.len + '" value="' + esc(w) + '" ' +
          'autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="' + '_'.repeat(spec.len) + '">' +
          '<span></span>';
      }
      html += '</div>';
    });
    html += '</div>';
    $('wordList').innerHTML = html;
    if (S.mode === 'manual') {
      Array.prototype.forEach.call($('wordList').querySelectorAll('[data-word]'), markWordInput);
    }
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
    var name = $('inFleet').value.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!name) { name = randomFleetName(); $('inFleet').value = name; }
    S.me.name = name;
    if (S.mode === 'manual') {
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
    setBar(S.me.name, 'Deploy', 'is-quiet');
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
    setBar(S.me.name + ' vs ' + S.foe.name, mine ? (S.alpha ? 'Alpha Strike' : 'Your Turn') : 'AI Captain\'s Turn', mine ? '' : 'is-foe');
    Array.prototype.forEach.call($('tabbar').children, function (b) { b.classList.toggle('is-on', b.getAttribute('data-tab') === ui.tab); });
    $('tabAttack').hidden = ui.tab !== 'Attack';
    $('tabDefense').hidden = ui.tab !== 'Defense';
    $('tabLog').hidden = ui.tab !== 'Log';
    $('defDot').hidden = !(S.lastFoe && S.lastFoe.unseen);
    renderAttack();
    renderDefense();
    renderLog();
    if (S.incoming && $('sheet').hidden) showIncoming();
    if (S.turn === 'foe' && !S.incoming && !ui.aiTimer) ui.aiTimer = setTimeout(foeTurn, 1100);
  }

  function renderAttack() {
    var mine = S.turn === 'me';
    // Ship status: yellow once every square of it has been hit, green once every letter is in.
    $('bubbles').innerHTML = S.foe.ships.map(function (ship, i) {
      var shots = cellsOf(ship).map(function (p) { return S.myShots[key(p.r, p.c)]; });
      var located = shots.every(function (s) { return s && s.hit; });
      var solved = shots.every(function (s) { return s && s.letter; });
      var state = solved ? 'solved' : located ? 'located' : 'hidden';
      return '<span class="bubble is-' + state + '" title="' + SPECS[i].cls + ': ' + state + '">' + SPECS[i].len + '</span>';
    }).join('');
    paint($('gridAttack'), function (r, c) {
      var k = key(r, c);
      var s = S.myShots[k];
      var o = {};
      if (s && !s.hit) o = { cls: 'is-miss', off: true };
      else if (s && s.letter) o = { cls: 'is-bull', text: s.letter, off: true };
      else if (s) o = { cls: 'is-hit', text: '<span class="q">?</span>' };
      if (ui.sel === k || S.alpha === k) o.cls = (o.cls || '') + ' is-target';
      if (ui.flash && ui.flash.indexOf(k) !== -1) o.cls = (o.cls || '') + ' is-flash';
      if (!mine) o.off = true;
      return o;
    }, true);

    var fp = $('firePanel');
    var found = bullCount(S.myShots);
    if (!mine) {
      fp.innerHTML = '<p class="waiting">AI Captain is taking aim…</p>';
    } else if (S.alpha) {
      fp.innerHTML = '<div class="card-title">Alpha Strike</div>' +
        '<div class="fire-coord">' + coordK(S.alpha) + ' is a hit.</div>' +
        '<div class="fire-call">Guess the letter hiding at ' + callK(S.alpha) + '.</div>' +
        '<button class="btn btn--primary btn--wide" type="button" data-act="alpha">Call Alpha Strike</button>';
    } else if (ui.sel) {
      var again = S.myShots[ui.sel] && S.myShots[ui.sel].hit;
      fp.innerHTML = '<div class="card-title">Fire!</div>' +
        '<div class="fire-coord">' + coordK(ui.sel) + '</div>' +
        '<div class="fire-call">"Fire on coordinate ' + callK(ui.sel) + '!"' + (again ? ' — a known hit. Fire again to try another letter.' : '') + '</div>' +
        '<div class="fire-actions"><button class="btn btn--primary" type="button" data-act="fire">Fire</button>' +
        '<button class="btn" type="button" data-act="unsel">Hold</button></div>' +
        '<button class="btn btn--danger btn--wide" type="button" data-act="demand">Demand Surrender</button>';
    } else {
      fp.innerHTML = '<div class="card-title">Your Turn &middot; ' + found + ' of ' + FLEET_CELLS + ' letters found</div>' +
        '<p class="hint" style="margin-top:0">Tap a coordinate to target it, or double-tap to fire at once. Tap a gold hit to fire again and try a different letter.</p>' +
        '<button class="btn btn--danger btn--wide" type="button" data-act="demand">Demand Surrender</button>';
    }

    $('attackManifest').innerHTML = LETTERS.map(function (L) {
      var t = S.myTallies[L];
      var f = Object.keys(S.myShots).filter(function (k) { return S.myShots[k].letter === L; }).length;
      var cls = 'mf';
      var n = '';
      if (t === 0) { cls += ' is-zero'; n = '0'; }
      else if (t != null && f >= t) { cls += ' is-done'; n = f + '/' + t; }
      else if (t != null) { cls += ' is-known'; n = f + '/' + t; }
      else if (f) { n = f + '/?'; }
      if (VOWELS.indexOf(L) !== -1 && cls === 'mf') cls += ' is-vowel';
      return '<div class="' + cls + '"><span class="mf-l">' + L + '</span><span class="mf-n">' + n + '</span></div>';
    }).join('');
  }

  function renderDefense() {
    var b = myBoard();
    var last = S.lastFoe && S.lastFoe.key;
    $('defenseWords').textContent = S.me.words.join(' • ');
    paint($('gridDefense'), function (r, c) {
      var k = key(r, c);
      var cell = b[k];
      var s = S.foeShots[k];
      var cls = '';
      if (cell) cls = 'is-ship';
      if (s && !s.hit) cls = 'is-miss';
      if (s && s.hit && s.letter) cls = 'is-ship is-ship-lost';
      else if (s && s.hit) cls = 'is-ship is-ship-hit';
      if ((k === last || (S.lastFoe && S.lastFoe.filled && S.lastFoe.filled.indexOf(k) !== -1)) && S.lastFoe.unseen && ui.tab === 'Defense') cls += ' is-flash';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
    if (ui.tab === 'Defense' && S.lastFoe && S.lastFoe.unseen) { S.lastFoe.unseen = false; save(); $('defDot').hidden = true; }

    var counts = letterCounts(S.me.words);
    var lost = {};
    Object.keys(S.foeShots).forEach(function (k) { var L = S.foeShots[k].letter; if (L) lost[L] = (lost[L] || 0) + 1; });
    $('defenseManifest').innerHTML = LETTERS.map(function (L) {
      var n = counts[L];
      var cls = 'mf' + (n === 0 ? ' is-dim' : '') + (n && lost[L] >= n ? ' is-ship-lost is-dim' : '') + (VOWELS.indexOf(L) !== -1 && n ? ' is-vowel' : '');
      return '<div class="' + cls + '"><span class="mf-l">' + L + '</span><span class="mf-n">' + n + '</span></div>';
    }).join('');
  }

  function renderLog() {
    $('log').innerHTML = S.log.length ? S.log.map(function (l) {
      return '<div class="log-item' + (l.who === 'foe' ? ' is-foe' : '') + '"><span class="log-who">' +
        (l.who === 'foe' ? 'AI Captain \u00b7 ' + esc(S.foe.name) : l.who === 'me' ? 'Human Captain \u00b7 ' + esc(S.me.name) : 'Fleet Command') + '</span>' + l.text + '</div>';
    }).join('') : '<p class="log-empty">No shots fired yet.</p>';
  }

  // --- player fires ---
  function attackTap(k) {
    if (S.turn !== 'me' || S.alpha) return;
    var s = S.myShots[k];
    if (s && (!s.hit || s.letter)) return;
    // Double tap fires straight away.
    if (ui.sel === k && Date.now() - (ui.selAt || 0) < 400) { fire(); return; }
    ui.sel = ui.sel === k ? null : k;
    ui.selAt = ui.sel ? Date.now() : 0;
    if (ui.sel) sfx('select');
    ui.flash = null;
    renderAttack();
    // Bring the Fire button into view, but not mid double tap (it would move the grid).
    if (ui.sel) setTimeout(function () {
      if (ui.sel === k && S.turn === 'me') $('firePanel').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 400);
  }

  function fire() {
    var k = ui.sel;
    if (!k || S.turn !== 'me') return;
    ui.sel = null;
    var cell = foeBoard()[k];
    S.turns++;
    if (!cell) {
      S.myShots[k] = { hit: false };
      log('me', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Miss!"</span>');
      sfx('fire'); sfx('miss', 0.3);
      toast(coordK(k) + ': Miss!');
      endMyTurn();
      return;
    }
    if (!S.myShots[k]) S.myShots[k] = { hit: true, letter: null, wrong: [] };
    if (S.myTallies[cell.letter] != null) {   // letter already called: it shows on the hit
      S.myShots[k].letter = cell.letter;
      ui.flash = [k];
      log('me', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Hit."</span> ' + cell.letter + ' was already called, so it fills in.');
      sfx('fire'); sfx('hit', 0.3); sfx('fill', 0.9);
      toast(coordK(k) + ': Hit! ' + cell.letter + ' fills in.');
      endMyTurn();
      return;
    }
    S.alpha = k;
    sfx('fire'); sfx('hit', 0.3);
    log('me', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Hit."</span>');
    save();
    renderBattle();
    openAlpha();
  }

  function openAlpha() {
    var k = S.alpha;
    var shot = S.myShots[k];
    var keys = LETTERS.map(function (L) {
      var t = S.myTallies[L];
      var tried = shot.wrong.indexOf(L) !== -1 || t != null;
      return '<button type="button" class="key' + (t === 0 ? ' is-zero' : '') + '" data-letter="' + L + '"' + (tried ? ' disabled' : '') + '>' + L +
        (t != null ? '<span class="key-n">' + t + '</span>' : '') + '</button>';
    }).join('');
    openSheet(
      '<div class="sheet-eyebrow">Hit at ' + coordK(k) + '</div>' +
      '<h2>Alpha Strike</h2>' +
      '<p class="hint" style="margin:4px 0 0">Call the letter at ' + callK(k) + '. Right letter is a Bullseye. Wrong letter and the AI Captain reports how many times it appears across their whole fleet. Either way, every square holding that letter gets filled in.' +
      (shot.wrong.length ? ' Already tried here: <strong>' + shot.wrong.join(' ') + '</strong>.' : '') + '</p>' +
      '<div class="keys">' + keys + '</div>' +
      '<p class="hint" style="margin:0">Letters already called are crossed out; they are all filled in.</p>', false);
  }

  function alphaStrike(L) {
    var k = S.alpha;
    if (!k) return;
    var cell = foeBoard()[k];
    var shot = S.myShots[k];
    var report;
    S.myTallies[L] = countOf(S.foe.words.join(''), L);
    if (cell.letter === L) {
      shot.letter = L;
      log('me', '"Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"Bullseye."</span>');
      report = '<div class="report is-good"><div class="report-q">"Alpha Strike ' + NATO[L] + '!"</div><div class="report-a">"Bullseye."</div></div>';
      sfx('bull');
    } else {
      var t = countOf(S.foe.words.join(''), L);
      S.myTallies[L] = t;
      if (shot.wrong.indexOf(L) === -1) shot.wrong.push(L);
      log('me', '"Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>');
      sfx(t ? 'tally' : 'zero');
      report = '<div class="report is-warn"><div class="report-q">"Alpha Strike ' + NATO[L] + '!"</div><div class="report-a">"' + L + ' tally ' + t + '."</div></div>' +
        '<p class="hint">' + (t === 0 ? L + ' is nowhere in the AI Captain\'s fleet.' : L + ' appears ' + t + (t === 1 ? ' time' : ' times') + ' across the AI Captain\'s fleet \u2014 just not at ' + coordK(k) + '.') + '</p>';
    }
    S.alpha = null;
    var filled = fillLetter(S.myShots, foeBoard(), L);
    if (filled.length) sfx('fill', 0.45);
    ui.flash = [k].concat(filled);
    renderAttack();
    report += fillNote(L, filled, 'the AI Captain\'s');
    var found = bullCount(S.myShots);
    openSheet('<div class="sheet-eyebrow">' + coordK(k) + '</div><h2>Strike Report</h2>' + report +
      (found === FLEET_CELLS ? '<p class="hint"><strong>All 17 letters found.</strong> Next turn, demand their surrender.</p>' : '') +
      (S.myTallies[L] > 0 && found < FLEET_CELLS ? solveBox() : '') +
      '<button class="btn btn--primary btn--wide" type="button" data-act="endTurn">End Turn</button>', false);
    save();
  }

  // --- solve a word (after calling a letter that is in the fleet) ---
  function solveBox() {
    return '<div class="solve" id="solveBox"><span class="label">Solve a Word</span>' +
      '<div class="input-row"><input class="input" id="solveIn" maxlength="5" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="WORD">' +
      '<button class="btn" type="button" data-act="solve">Solve</button></div>' +
      '<p class="hint">Name one of the AI Captain\'s word-ships. Get it right and the whole word fills in. One try per turn.</p></div>';
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
      html = '<div class="report is-good"><div class="report-q">"Solve: ' + word + '!"</div><div class="report-a">"Correct."</div></div>' +
        '<p class="hint"><strong>' + word + '</strong> filled in' + (res.cells.length ? ' at ' + res.cells.map(coordK).join(', ') : '') + '.</p>';
    } else {
      log('me', '"Solve: ' + word + '!" &mdash; <span class="say">"Negative."</span>');
      html = '<div class="report is-bad"><div class="report-q">"Solve: ' + word + '!"</div><div class="report-a">"Negative."</div></div>' +
        '<p class="hint">No unsolved word-ship ' + word + ' in the AI Captain\'s fleet.</p>';
    }
    $('solveBox').outerHTML = html;
    save();
    renderAttack();
  }

  // AI Captain: solve when the letters it has pin a word down.
  function foeTrySolve(lvl) {
    var sh = S.foeShots, best = null;
    Object.keys(FLEET_LENS).forEach(function (lenStr) {
      var len = +lenStr;
      for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
        ['H', 'V'].forEach(function (dir) {
          if (dir === 'H' ? c + len > 10 : r + len > 10) return;
          var seg = [], known = 0;
          for (var i = 0; i < len; i++) {
            var s = sh[dir === 'H' ? key(r, c + i) : key(r + i, c)];
            if (s && !s.hit) return;
            if (s && s.letter) known++;
            seg.push(s || null);
          }
          if (known === len || known < 2 || known / len < lvl.solve.known) return;
          var pat = segPattern(seg);
          var re = new RegExp('^' + pat + '$'), ex = excludedLetters(), total = 0, top = null;
          (guessPool[len] || []).forEach(function (e) {
            if (!allowed(e.w) || !re.test(e.w) || (S.foeMissedSolves || []).indexOf(e.w) !== -1) return;
            for (var j = 0; j < len; j++) if (!seg[j] || !seg[j].letter) { if (ex[e.w[j]]) return; }
            total += e.wt;
            if (!top || e.wt > top.wt) top = e;
          });
          if (!top || top.wt / total < lvl.solve.share) return;
          var score = known / len + top.wt / total;
          if (!best || score > best.score) best = { word: top.w, score: score };
        });
      }
    });
    return best && best.word;
  }

  // Wheel of Fortune: a called letter fills in on every square already hit that holds it.
  // Squares not yet hit stay hidden; they show the letter the moment they are hit.
  function fillLetter(shots, board, L) {
    var filled = [];
    Object.keys(board).forEach(function (k) {
      var s = shots[k];
      if (board[k].letter !== L || !s || !s.hit || s.letter) return;
      s.letter = L;
      filled.push(k);
    });
    return filled;
  }

  function fillNote(L, filled, whose) {
    if (!filled.length) return '';
    return '<p class="hint"><strong>' + L + ' filled in at ' + filled.map(coordK).join(', ') + '</strong> \u2014 every hit square in ' + whose + ' fleet holding ' + L + ' now shows it.</p>';
  }

  function endMyTurn() {
    closeSheet();
    S.turn = 'foe';
    save();
    renderBattle();
  }

  // --- demand surrender (player) ---
  function openDemand() {
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
    openSheet('<div class="sheet-eyebrow is-foe">Decisive Strike</div><h2>Demand Surrender</h2>' +
      '<p class="hint" style="margin-top:4px">Name every one of the AI Captain\'s word-ships, its first square, and its heading. All correct and you win. <strong>Anything wrong and you lose on the spot.</strong> Uses your whole turn.</p>' +
      rows + '<p class="note" id="claimNote"></p>' +
      '<button class="btn btn--danger-solid btn--wide" type="button" data-act="submitDemand">I Demand Your Surrender!</button>' +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="close">Belay That</button>');
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
    closeSheet();
    finish(right ? 'me' : 'foe', right ? 'demand-right' : 'demand-wrong');
  }

  // ------------------------------------------------------------
  // THE AI CAPTAIN
  // ------------------------------------------------------------
  function foeTurn() {
    ui.aiTimer = null;
    if (S.phase !== 'battle' || S.turn !== 'foe') return;
    var sh = S.foeShots;
    var lvl = LEVELS[S.level];
    S.turns++;

    if (bullCount(sh) >= FLEET_CELLS) {
      var said = S.me.ships.map(function (s) { return s.word + ' at ' + coord(s.r, s.c) + (s.dir === 'H' ? ' across' : ' down'); }).join(', ');
      log('foe', '"I demand your surrender! Your fleet consists of: ' + esc(said) + '!"');
      finish('foe', 'foe-demand');
      return;
    }

    var k = foeChooseCell(lvl);
    var cell = myBoard()[k];
    var ev = { key: k, hit: !!cell };
    if (!cell) {
      sh[k] = { hit: false };
      log('foe', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Miss!"</span>');
    } else {
      if (!sh[k]) sh[k] = { hit: true, letter: null, wrong: [] };
    }
    if (cell && S.foeTallies[cell.letter] != null) {   // letter already called: it shows on the hit
      sh[k].letter = cell.letter;
      ev.auto = cell.letter;
      log('foe', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Hit."</span> ' + cell.letter + ' was already called, so it fills in.');
    } else if (cell) {
      var L = foeGuessLetter(k, lvl);
      ev.letter = L;
      S.foeTallies[L] = countOf(S.me.words.join(''), L);
      if (cell.letter === L) {
        sh[k].letter = L;
        ev.bull = true;
        log('foe', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Hit."</span> "Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"Bullseye."</span>');
      } else {
        var t = countOf(S.me.words.join(''), L);
        S.foeTallies[L] = t;
        if (sh[k].wrong.indexOf(L) === -1) sh[k].wrong.push(L);
        ev.tally = t;
        log('foe', '"Fire on ' + callK(k) + '!" &mdash; <span class="say">"Hit."</span> "Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>');
      }
    }
    if (ev.letter) ev.filled = fillLetter(sh, myBoard(), ev.letter);
    if (ev.letter && S.foeTallies[ev.letter] > 0 && lvl.solve && bullCount(sh) < FLEET_CELLS) {
      var guess = foeTrySolve(lvl);
      if (guess) {
        var res = solveWord(sh, S.me.ships, guess);
        ev.solve = { word: guess, ok: !!res, cells: res ? res.cells : [] };
        if (!res) (S.foeMissedSolves = S.foeMissedSolves || []).push(guess);
        log('foe', '"Solve: ' + guess + '!" &mdash; <span class="say">' + (res ? '"Correct."' : '"Negative."') + '</span>');
      }
    }
    sfx('incoming');
    sfx(ev.hit ? 'hit' : 'miss', 0.5);
    if (ev.auto) sfx('fill', 1.1);
    else if (ev.letter) sfx(ev.bull ? 'bull' : ev.tally ? 'tally' : 'zero', 1.1);
    if (ev.filled && ev.filled.length) sfx('fill', 1.5);
    if (ev.solve) sfx(ev.solve.ok ? 'solveOk' : 'solveBad', 1.9);
    ev.unseen = true;
    S.lastFoe = ev;
    S.incoming = ev;
    S.turn = 'me';
    save();
    renderBattle();
  }

  function showIncoming() {
    var ev = S.incoming;
    var p = unkey(ev.key);
    var b = myBoard();
    var lines = '<div class="report ' + (ev.hit ? 'is-bad' : 'is-good') + '"><div class="report-q">"Fire on coordinate ' + callOut(p.r, p.c) + '!"</div>' +
      '<div class="report-a">' + (ev.hit ? '"Hit."' : '"Miss!"') + '</div></div>';
    if (ev.auto) {
      lines += '<p class="hint"><strong>' + ev.auto + '</strong> was already called, so it fills in on the hit. No Alpha Strike needed.</p>';
    } else if (ev.hit) {
      lines += '<div class="report ' + (ev.bull ? 'is-bad' : 'is-warn') + '"><div class="report-q">"Alpha Strike ' + NATO[ev.letter] + '!"</div>' +
        '<div class="report-a">' + (ev.bull ? '"Bullseye."' : '"' + ev.letter + ' tally ' + ev.tally + '."') + '</div></div>';
    }
    openSheet('<div class="sheet-eyebrow is-foe">Incoming Fire &middot; ' + esc(S.foe.name) + '</div>' +
      '<h2>' + coord(p.r, p.c) + (ev.hit ? (ev.auto ? ' \u2014 ' + ev.auto + ' is lost' : ev.bull ? ' \u2014 ' + ev.letter + ' is lost' : ' — hit, letter safe') : ' — clean miss') + '</h2>' +
      (ev.filled ? fillNote(ev.letter, ev.filled, 'your') : '') +
      (ev.solve ? '<div class="report ' + (ev.solve.ok ? 'is-bad' : 'is-good') + '"><div class="report-q">"Solve: ' + ev.solve.word + '!"</div><div class="report-a">' + (ev.solve.ok ? '"Correct."' : '"Negative."') + '</div></div>' +
        (ev.solve.ok ? '<p class="hint">Your word-ship <strong>' + ev.solve.word + '</strong> is fully exposed.</p>' : '') : '') +
      lines + '<div class="mini-wrap"><div class="grid-label">DEFENSE GRID <span>' + esc(S.me.name) + '</span></div><div class="grid" id="gridIncoming"></div></div>' +
      '<button class="btn btn--primary btn--wide" type="button" data-act="returnFire">Return Fire</button>', false);
    paint($('gridIncoming'), function (r, c) {
      var k = key(r, c);
      var cell = b[k];
      var s = S.foeShots[k];
      var cls = cell ? 'is-ship' : '';
      if (s && !s.hit) cls = 'is-miss';
      if (s && s.hit) cls = 'is-ship ' + (s.letter ? 'is-ship-lost' : 'is-ship-hit');
      if (k === ev.key || (ev.filled && ev.filled.indexOf(k) !== -1) || (ev.solve && ev.solve.cells.indexOf(k) !== -1)) cls += ' is-flash';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
  }

  // Shot selection, after classic Battleship strategy.
  //   Ensign    - random hunting; follows up a hit only half the time, on any side.
  //   Commander - hunt/target: checkerboard hunting (every ship spans 2+ squares),
  //               then probes around a hit and runs along a line of hits.
  //   Admiral   - probability density: counts every way the fleet could still lie,
  //               weighting placements through known hits, and throws out any
  //               placement no dictionary word fits (known and ruled-out letters).
  var FLEET_LENS = { 5: 1, 4: 1, 3: 2, 2: 1 };

  function foeChooseCell(lvl) {
    var sh = S.foeShots;
    var unknown = [], hits = [], unresolved = [];
    for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
      var k = key(r, c), s = sh[k];
      if (!s) unknown.push(k);
      else if (s.hit) { hits.push(k); if (!s.letter) unresolved.push(k); }
    }
    var bestUnresolved = null, bestConf = 0;
    unresolved.forEach(function (k) {
      var g = letterScores(k, lvl);
      if (g.conf > bestConf || !bestUnresolved) { bestConf = g.conf; bestUnresolved = k; }
    });
    // Every ship square already found: only letters are left to crack.
    if (!unknown.length || hits.length >= FLEET_CELLS) return bestUnresolved;

    var targets = lvl.target === 'density' ? densityTargets(unknown, lvl, 'target') : neighborTargets(lvl);
    var inTarget = targets.length > 0;

    // Re-fire a known hit for another letter when a guess is likely to land,
    // or when there is nothing better to shoot at.
    if (bestUnresolved) {
      if (bestConf >= lvl.refire) return bestUnresolved;
      if (!inTarget && bestConf >= lvl.refire / 2) return bestUnresolved;
      if (lvl.hunt === 'random' && Math.random() < 0.25) return bestUnresolved;
    }
    if (inTarget && Math.random() < lvl.follow) return pick(targets);

    if (lvl.hunt === 'density') { var d = densityTargets(unknown, lvl, 'hunt'); if (d.length) return pick(d); }
    if (lvl.hunt === 'parity') {
      var parity = unknown.filter(function (k) { var p = unkey(k); return (p.r + p.c) % 2 === 0; });
      if (parity.length) return pick(parity);
    }
    return pick(unknown);
  }

  // Ensign: any open square next to any hit. Commander: extend lines of hits first.
  function neighborTargets(lvl) {
    var sh = S.foeShots;
    var open = function (r, c) { return r >= 0 && r < 10 && c >= 0 && c < 10 && !sh[key(r, c)]; };
    var isHit = function (r, c) { var s = sh[key(r, c)]; return !!(s && s.hit); };
    var line = {}, side = {};
    Object.keys(sh).forEach(function (k) {
      if (!sh[k].hit) return;
      var p = unkey(k);
      [[0, 1], [1, 0]].forEach(function (d) {
        var inLine = isHit(p.r + d[0], p.c + d[1]) || isHit(p.r - d[0], p.c - d[1]);
        [1, -1].forEach(function (sgn) {
          var r2 = p.r + d[0] * sgn, c2 = p.c + d[1] * sgn;
          if (!open(r2, c2)) return;
          if (inLine && lvl.target === 'line') line[key(r2, c2)] = true;
          else side[key(r2, c2)] = true;
        });
      });
    });
    var l = Object.keys(line);
    return l.length ? l : Object.keys(side);
  }

  // Can any allowed dictionary word sit on these squares, given what is known?
  var fitCache = {};
  function wordFits(seg) {
    var pat = segPattern(seg);
    var ck = pat + (offensiveOk() ? '+' : '');
    if (fitCache[ck] == null) {
      var re = new RegExp('^' + pat + '$');
      fitCache[ck] = (guessPool[seg.length] || []).some(function (e) { return allowed(e.w) && re.test(e.w); });
    }
    return fitCache[ck];
  }

  // Heat map over open squares; returns the hottest ones.
  // mode 'target' returns nothing unless some placement runs through a known hit.
  function densityTargets(unknown, lvl, mode) {
    var sh = S.foeShots, heat = {}, hot = false;
    Object.keys(FLEET_LENS).forEach(function (lenStr) {
      var len = +lenStr, mult = FLEET_LENS[len];
      for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
        ['H', 'V'].forEach(function (dir) {
          if (dir === 'H' ? c + len > 10 : r + len > 10) return;
          var cells = [], seg = [], hitsIn = 0, known = false;
          for (var i = 0; i < len; i++) {
            var k = dir === 'H' ? key(r, c + i) : key(r + i, c);
            var s = sh[k];
            if (s && !s.hit) return;
            if (s && s.hit) { hitsIn++; if (s.letter || (s.wrong && s.wrong.length)) known = true; }
            cells.push(k); seg.push(s || null);
          }
          if (lvl.words && known && !wordFits(seg)) return;
          var w = mult * Math.pow(30, hitsIn);
          if (hitsIn) hot = true;
          cells.forEach(function (k) { if (!sh[k]) heat[k] = (heat[k] || 0) + w; });
        });
      }
    });
    if (mode === 'target' && !hot) return [];
    var best = 0, out = [];
    unknown.forEach(function (k) {
      var h = heat[k] || 0;
      if (h > best) { best = h; out = [k]; } else if (h === best && h > 0) out.push(k);
    });
    return out;
  }

  // Letters already called: an unsolved hit can't hold one (it would have filled in).
  function calledLetters() {
    var out = {};
    Object.keys(S.foeTallies).forEach(function (L) { out[L] = true; });
    return out;
  }

  // Regex pattern for a run of squares from what the AI Captain knows.
  function segPattern(seg) {
    var called = Object.keys(calledLetters());
    return seg.map(function (s) {
      if (!s) return '.';
      if (s.letter) return s.letter;
      var no = (s.wrong || []).concat(s.hit ? called : []);
      return no.length ? '[^' + no.join('') + ']' : '.';
    }).join('');
  }

  function excludedLetters() {
    var sh = S.foeShots, found = {}, ex = {};
    Object.keys(sh).forEach(function (k) { var L = sh[k].letter; if (L) found[L] = (found[L] || 0) + 1; });
    Object.keys(S.foeTallies).forEach(function (L) {
      var t = S.foeTallies[L];
      if (t === 0 || (found[L] || 0) >= t) ex[L] = true;
    });
    return ex;
  }

  // Score each letter for a hit cell by fitting dictionary words through it.
  function letterScores(k, lvl) {
    var sh = S.foeShots;
    var here = sh[k];
    var ex = excludedLetters();
    var called = calledLetters();
    var scores = {};
    var total = 0;
    if (lvl.pattern) {
      var p = unkey(k);
      ['H', 'V'].forEach(function (dir) {
        [2, 3, 4, 5].forEach(function (len) {
          for (var off = 0; off < len; off++) {
            var r0 = dir === 'H' ? p.r : p.r - off;
            var c0 = dir === 'H' ? p.c - off : p.c;
            if (r0 < 0 || c0 < 0 || (dir === 'H' ? c0 + len > 10 : r0 + len > 10)) continue;
            var seg = [], blocked = false, hitsIn = 0;
            for (var i = 0; i < len; i++) {
              var kk = dir === 'H' ? key(r0, c0 + i) : key(r0 + i, c0);
              var s = sh[kk];
              if (s && !s.hit) { blocked = true; break; }
              if (s && s.hit) hitsIn++;
              seg.push(s || null);
            }
            if (blocked) continue;
            var weight = 1 + hitsIn * 2;
            (guessPool[len] || []).forEach(function (entry) {
              var w = entry.w;
              if (!allowed(w)) return;
              for (var j = 0; j < len; j++) {
                var sj = seg[j], ch = w[j];
                if (sj && sj.letter && sj.letter !== ch) return;
                if (sj && sj.wrong && sj.wrong.indexOf(ch) !== -1) return;
                if (sj && sj.hit && !sj.letter && called[ch]) return;
                if (S.foeTallies[ch] === 0) return;
                if (!(sj && sj.letter) && ex[ch]) return;
              }
              var L = w[off];
              scores[L] = (scores[L] || 0) + weight * entry.wt;
              total += weight * entry.wt;
            });
          }
        });
      });
    }
    var best = null, bestS = 0;
    Object.keys(scores).forEach(function (L) {
      if (ex[L] || called[L] || here.wrong.indexOf(L) !== -1) return;
      var s = scores[L] * (0.9 + Math.random() * 0.2);
      if (s > bestS) { bestS = s; best = L; }
    });
    return { letter: best, conf: total ? (scores[best] || 0) / total : 0 };
  }

  function foeGuessLetter(k, lvl) {
    var here = S.foeShots[k];
    var g = letterScores(k, lvl);
    if (g.letter) return g.letter;
    var ex = excludedLetters();
    var called = calledLetters();
    var order = FREQ.split('').filter(function (L) { return !ex[L] && !called[L] && here.wrong.indexOf(L) === -1; });
    if (!order.length) order = LETTERS.filter(function (L) { return !called[L] && here.wrong.indexOf(L) === -1; });
    if (!order.length) order = LETTERS.filter(function (L) { return here.wrong.indexOf(L) === -1; });
    // an ensign doesn't always pick the most common letter
    if (!lvl.pattern && order.length > 3 && Math.random() < 0.4) return order[rnd(Math.min(6, order.length))];
    return order[0];
  }

  // ------------------------------------------------------------
  // GAME OVER
  // ------------------------------------------------------------
  function finish(winner, reason) {
    S.phase = 'over';
    S.winner = winner;
    S.reason = reason;
    S.turn = null; S.alpha = null; S.incoming = null;
    if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
    bumpRecord(winner === 'me');
    sfx(winner === 'me' ? 'win' : 'lose', 0.2);
    save();
    show('over');
  }

  function renderOver() {
    var won = S.winner === 'me';
    setBar(S.me.name + ' vs ' + S.foe.name, won ? 'Victory' : 'Defeat', won ? '' : 'is-foe');
    var eyebrow, title, quote;
    if (S.reason === 'demand-right') { eyebrow = 'Total Victory'; title = 'The ' + S.foe.name + ' surrenders.'; quote = '"You have won."'; }
    else if (S.reason === 'demand-wrong') { eyebrow = 'Surrender Refused'; title = 'Your demand missed the mark.'; quote = '"Victory is mine! You lose! Good day sir!"'; }
    else { eyebrow = 'Fleet Surrendered'; title = 'The ' + S.foe.name + ' named every ship.'; quote = 'You were obliged to answer: "You have won."'; }
    $('overEyebrow').textContent = eyebrow;
    $('overTitle').textContent = title;
    $('overQuote').textContent = quote;
    var shots = Object.keys(S.myShots).length;
    var hits = Object.keys(S.myShots).filter(function (k) { return S.myShots[k].hit; }).length;
    $('overStats').innerHTML =
      '<div class="stat"><b>' + shots + '</b><span>Squares</span></div>' +
      '<div class="stat"><b>' + hits + '</b><span>Hits</span></div>' +
      '<div class="stat"><b>' + bullCount(S.myShots) + '</b><span>Bullseyes</span></div>';
    $('overFoeWords').textContent = S.foe.words.join(' • ');
    $('overMyWords').textContent = S.me.words.join(' • ');
    var fb = foeBoard(), mb = myBoard();
    paint($('gridOverFoe'), function (r, c) {
      var k = key(r, c), cell = fb[k], s = S.myShots[k];
      var cls = cell ? (s && s.letter ? 'is-bull' : s && s.hit ? 'is-hit' : 'is-ship') : (s ? 'is-miss' : '');
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
    paint($('gridOverMe'), function (r, c) {
      var k = key(r, c), cell = mb[k], s = S.foeShots[k];
      var cls = cell ? 'is-ship' + (s && s.letter ? ' is-ship-lost' : s && s.hit ? ' is-ship-hit' : '') : (s ? 'is-miss' : '');
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
      (current !== 'home' ? '<button class="btn btn--wide" type="button" data-act="home">Main Menu</button>' : '') +
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
      '<h3>Who Goes First?</h3><p>Against the AI Captain, the Human Captain always fires first.</p>' +
      '<h3>Standard Attack</h3><ul>' +
      '<li><strong>Initial Strike:</strong> fire on a coordinate. <span class="say">"Miss!"</span> ends your turn. <span class="say">"Hit."</span> earns an Alpha Strike.</li>' +
      '<li><strong>Alpha Strike:</strong> guess the letter there. <span class="say">"Bullseye."</span> writes it in. A wrong letter gets a tally: how many times that letter appears across the opponent\'s whole fleet. Either way your turn ends.</li>' +
      '<li><strong>Solve a Word:</strong> after calling a letter that is in the opponent\'s fleet, you may name one whole word-ship. Right, and every square of it fills in.</li>' +
      '<li><strong>Wheel of Fortune:</strong> whatever letter is called, right or wrong, fills in on every square already hit that holds it. Squares not yet hit stay hidden; hit one later and a called letter shows at once (no Alpha Strike needed). This works for both captains.</li>' +
      '<li>Fire on the same hit again later to try another letter.</li></ul>' +
      '<h3>Demand Surrender</h3><p>Instead of taking a turn, name every one of your opponent\'s word-ships and exactly where it sits. All correct: <span class="say">"You have won."</span> Anything wrong: <span class="say">"Victory is mine! You lose! Good day sir!"</span></p>' +
      '<h3>Reading the Tracker</h3><ul>' +
      '<li>Grey dot: miss. Gold square with ?: hit, letter unknown. Green: letter found.</li>' +
      '<li>Attack Manifest shows <em>found / tally</em> for each letter. The 5 4 3 3 2 circles turn yellow when every square of that word-ship has been hit and green when every letter is in.</li></ul>' +
      '</div><button class="btn btn--primary btn--wide" type="button" data-act="close">Aye, Aye</button>');
  }

  // ------------------------------------------------------------
  // events
  // ------------------------------------------------------------
  function on(el, type, fn) { el.addEventListener(type, fn); }

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
  on($('inFleet'), 'input', function () { S.me.name = this.value.toUpperCase(); save(); });
  on($('btnRollName'), 'click', function () { S.me.name = randomFleetName(); $('inFleet').value = S.me.name; save(); });
  on($('segMode'), 'click', function (e) {
    var v = e.target.getAttribute('data-v');
    if (!v || v === S.mode) return;
    S.mode = v;
    S.me.words = v === 'auto' ? randomWords() : ['', '', '', '', ''];
    save(); renderSetup();
  });
  on($('segLevel'), 'click', function (e) {
    var v = e.target.getAttribute('data-v');
    if (!v) return;
    S.level = v;
    if (S.mode === 'auto') S.me.words = randomWords();
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
    markWordInput(el);
    save();
  });
  on($('selLang'), 'change', function () {
    S.lang = this.value;
    save();
    loadDictionary(S.lang).then(function () {
      if (S.mode === 'auto') { S.me.words = randomWords(); save(); }
      renderSetup();
    });
  });
  on($('chkOffensive'), 'change', function () {
    S.offensiveOk = this.checked;
    if (S.mode === 'auto' && !S.me.words.every(inDictionary)) S.me.words = randomWords();
    save(); renderSetup();
  });
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
  on($('btnDeployBack'), 'click', function () { S.phase = 'setup'; save(); show('setup'); });

  // battle
  on($('gridAttack'), 'click', function (e) {
    var c = e.target.closest('[data-k]');
    if (c) attackTap(c.getAttribute('data-k'));
  });
  on($('firePanel'), 'click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'fire') fire();
    else if (act === 'unsel') { ui.sel = null; renderAttack(); }
    else if (act === 'alpha') openAlpha();
    else if (act === 'demand') openDemand();
  });
  on($('tabbar'), 'click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    ui.tab = b.getAttribute('data-tab');
    renderBattle();
    window.scrollTo(0, 0);
  });

  on($('btnAgain'), 'click', function () { newGame(); show('setup'); });

  // sheet
  on($('scrim'), 'click', function () { if (sheetDismissible) closeSheet(); });
  on($('sheetBody'), 'click', function (e) {
    var k = e.target.closest('[data-letter]');
    if (k && !k.disabled) { alphaStrike(k.getAttribute('data-letter')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'close') closeSheet();
    else if (act === 'rules') openRules();
    else if (act === 'home') { closeSheet(); show('home'); }
    else if (act === 'newBattle') { if (newBattle()) closeSheet(); }
    else if (act === 'abandon') {
      if (!confirm('Abandon this battle? It counts as a loss.')) return;
      if (S.phase === 'battle') bumpRecord(false);
      closeSheet(); S = null; try { localStorage.removeItem(STORE); } catch (err) { /* ignore */ }
      show('home');
    }
    else if (act === 'install') { ui.installEvt.prompt(); ui.installEvt = null; closeSheet(); }
    else if (act === 'endTurn') endMyTurn();
    else if (act === 'solve') humanSolve();
    else if (act === 'submitDemand') submitDemand(false);
    else if (act === 'submitDemandSure') submitDemand(true);
    else if (act === 'returnFire') {
      S.incoming = null; save(); closeSheet();
      ui.tab = 'Attack'; renderBattle();
    }
  });
  on($('sheetBody'), 'input', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('sheetBody'), 'change', function (e) {
    if (e.target.hasAttribute('data-claim')) claimInput(e.target);
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
  S = load();
  if (S && (S.v !== 1 || !LEVELS[S.level])) S = null;
  // Games saved while the launch-codes screen still existed go straight to battle.
  if (S && S.phase === 'codes') { S.phase = 'battle'; S.turn = 'me'; }
  loadDictionary(S && S.lang).then(function () {
    if (S && S.phase === 'setup' && S.mode === 'auto' && !S.me.words.every(inDictionary)) {
      S.me.words = randomWords(); save();
    }
    if (S && S.phase === 'battle') { show('battle'); if (S.alpha && !S.incoming) openAlpha(); }
    else show('home');
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
