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
                 adj: 0.5, pattern: false, density: false, bluff: 0.15 },
    commander: { name: 'Commander', tiers: ['everyday'], example: 'WHARF \u2022 HOOF \u2022 KEG',
                 hint: 'Familiar but less frequent words. The AI Captain follows up hits and reads the grid for likely words.',
                 adj: 1, pattern: true, density: false, bluff: 0.25 },
    admiral:   { name: 'Admiral',   tiers: ['rare'],     example: 'GLYPH \u2022 YURT \u2022 ASP',
                 hint: 'Uncommon words that hide well. The AI Captain hunts by probability and cracks words from every tally.',
                 adj: 1, pattern: true, density: true, bluff: 0.35 }
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

  function codes5() {
    var seen = {}, out = [];
    while (out.length < 5) {
      var n = rnd(1000);
      if (!seen[n]) { seen[n] = true; out.push(n); }
    }
    return out.sort(function (a, b) { return a - b; });
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
      me: { name: '', words: randomWords(), ships: null, codes: codes5() },
      foe: null,
      myShots: {}, myTallies: {},
      foeShots: {}, foeTallies: {},
      bubbles: [false, false, false, false, false],
      turn: null, alpha: null, incoming: null, lastFoe: null,
      wfg: null, claims: null, log: [], turns: 0,
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
  var SCREENS = { home: 'scrHome', setup: 'scrSetup', deploy: 'scrDeploy', codes: 'scrCodes', battle: 'scrBattle', over: 'scrOver' };
  var current = 'home';

  function show(name) {
    current = name;
    Object.keys(SCREENS).forEach(function (n) { $(SCREENS[n]).classList.toggle('is-on', n === name); });
    window.scrollTo(0, 0);
    render();
  }

  function setBar(sub, chip, cls) {
    $('barSub').textContent = sub || 'Sink or Spell';
    var el = $('barChip');
    el.hidden = !chip;
    el.textContent = chip || '';
    el.className = 'chip' + (cls ? ' ' + cls : '');
  }

  function render() {
    if (current === 'home') renderHome();
    else if (current === 'setup') renderSetup();
    else if (current === 'deploy') renderDeploy();
    else if (current === 'codes') renderCodes();
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
    setBar('Sink or Spell', null);
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
    else if (S.phase === 'codes') show('codes');
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
    $('deployCount').textContent = placed + ' of 5 berthed';
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
    if (b[k]) {                       // lift a berthed ship back into port
      var idx = b[k].ship;
      ships[idx].r = null; ships[idx].c = null;
      ui.pick = idx;
      save(); renderDeploy();
      return;
    }
    if (ui.pick < 0 || ships[ui.pick].r != null) ui.pick = nextUnplaced(0);
    if (ui.pick < 0) { toast('All five word-ships are berthed.'); return; }
    if (!fits(ships, ui.pick, p.r, p.c, ui.dir)) {
      toast(ships[ui.pick].word + " won't fit " + (ui.dir === 'H' ? 'across' : 'down') + ' from ' + coord(p.r, p.c));
      return;
    }
    var s = ships[ui.pick];
    s.r = p.r; s.c = p.c; s.dir = ui.dir;
    ui.pick = nextUnplaced(ui.pick);
    save(); renderDeploy();
  }

  function confirmDeploy() {
    var foeWords = randomWords();
    S.foe = { name: randomFleetName(), words: foeWords, ships: scatter(foeWords), codes: codes5() };
    S.phase = 'codes';
    S.wfg = { calls: [], done: false, first: null, lines: [] };
    save();
    show('codes');
  }

  // ------------------------------------------------------------
  // WHO GOES FIRST? (launch codes)
  // ------------------------------------------------------------
  function wfgLine(who, text) { S.wfg.lines.push({ who: who, text: text }); }

  function renderCodes() {
    setBar(S.me.name, 'Who Goes First?', 'is-quiet');
    $('myCodes').textContent = S.me.codes.map(pad3).join(' ');
    var w = S.wfg;
    $('codesRadio').innerHTML = w.lines.length ? w.lines.map(function (l) {
      return '<div class="radio-line' + (l.who === 'foe' ? ' is-foe' : '') + '"><span class="radio-who">' +
        (l.who === 'foe' ? 'AI Captain' : l.who === 'me' ? 'Human Captain' : 'Radio') + '</span><span>' + l.text + '</span></div>';
    }).join('') : '<div class="radio-line"><span class="radio-who">Radio</span><span>Channel open. Who hails first?</span></div>';

    var last = w.calls[w.calls.length - 1];
    var html = '';
    if (w.done) {
      html = '<button class="btn btn--primary btn--wide" type="button" data-act="toBattle">Battle Stations!</button>';
    } else if (w.thinking) {
      html = '<p class="waiting">AI Captain is deciding…</p>';
    } else if (!last) {
      html = '<div class="row" style="display:grid;grid-template-columns:1fr 1fr;">' +
        '<button class="btn btn--primary" type="button" data-act="iHail">I\'ll Hail</button>' +
        '<button class="btn" type="button" data-act="theyHail">Let Them Hail</button></div>';
    } else if (last.who === 'foe') {
      html = '<div class="row" style="display:grid;grid-template-columns:1fr 1fr;margin-bottom:12px;">' +
        '<button class="btn" type="button" data-act="concede">Concede</button>' +
        '<button class="btn btn--danger" type="button" data-act="challenge">Challenge!</button></div>' +
        '<span class="label">Or counter with ' + pad3(last.code) + ' or higher</span>' + codePad(last.code);
    } else {
      html = '<span class="label">Hail a launch code</span>' + codePad(0);
    }
    $('codesActions').innerHTML = html;
  }

  function codePad(min) {
    var html = '<div class="codepad">' + S.me.codes.map(function (n) {
      return '<button class="btn" type="button" data-code="' + n + '"' + (n < min ? ' disabled' : '') + '>' + pad3(n) + '</button>';
    }).join('') + '</div>' +
      '<div class="bluff"><input class="input" id="bluffCode" inputmode="numeric" maxlength="3" placeholder="' + pad3(min) + '" autocomplete="off">' +
      '<button class="btn" type="button" data-act="bluff">Bluff</button></div>' +
      '<p class="hint">Any three digits. Real codes are safe; fake ones are only safe if nobody challenges.</p>';
    return html;
  }

  function myCall(code) {
    var w = S.wfg;
    var last = w.calls[w.calls.length - 1];
    var min = last ? last.code : 0;
    if (code < min) { toast('Counter must be ' + pad3(min) + ' or higher.'); return; }
    w.calls.push({ who: 'me', code: code });
    wfgLine('me', last ? 'Counter: <span class="radio-say">"' + pad3(code) + '"</span>' : 'Hail: <span class="radio-say">"' + pad3(code) + '"</span>');
    w.thinking = true;
    save(); renderCodes();
    setTimeout(foeRespondCode, 900 + rnd(700));
  }

  function foeHail() {
    var w = S.wfg;
    var codes = S.foe.codes;
    var top = codes[codes.length - 1];
    var code = top;
    if (Math.random() < LEVELS[S.level].bluff && top < 990) code = top + 1 + rnd(Math.min(80, 999 - top));
    w.calls.push({ who: 'foe', code: code });
    wfgLine('foe', 'Hail: <span class="radio-say">"' + pad3(code) + '"</span>');
  }

  function foeRespondCode() {
    var w = S.wfg;
    w.thinking = false;
    var last = w.calls[w.calls.length - 1];
    var x = last.code;
    var codes = S.foe.codes;
    var honest = codes.filter(function (n) { return n >= x; })[0];
    var rounds = w.calls.length;
    var suspicion = Math.max(0, (x - 600) / 400) * 0.85 + (rounds >= 4 ? 0.25 : 0);
    if (honest != null && rounds < 12) {
      w.calls.push({ who: 'foe', code: honest });
      wfgLine('foe', 'Counter: <span class="radio-say">"' + pad3(honest) + '"</span>');
    } else if (Math.random() < suspicion || rounds >= 12) {
      wfgLine('foe', '<span class="radio-say">"Challenge!"</span>');
      resolveChallenge('foe');
    } else if (Math.random() < LEVELS[S.level].bluff && x < 999) {
      var b = x + 1 + rnd(Math.min(40, 999 - x));
      w.calls.push({ who: 'foe', code: b });
      wfgLine('foe', 'Counter: <span class="radio-say">"' + pad3(b) + '"</span>');
    } else {
      wfgLine('foe', '<span class="radio-say">"We concede."</span>');
      settleFirst('me', 'The AI Captain conceded.');
    }
    save(); renderCodes();
  }

  function resolveChallenge(challenger) {
    var last = S.wfg.calls[S.wfg.calls.length - 1];
    var caller = last.who;
    var owner = caller === 'me' ? S.me : S.foe;
    var real = owner.codes.indexOf(last.code) !== -1;
    if (real) {
      settleFirst(caller, (caller === 'me' ? 'Your' : 'The AI Captain\'s') + ' code ' + pad3(last.code) + ' is verified.');
    } else {
      settleFirst(challenger, (caller === 'me' ? 'Your' : 'The AI Captain\'s') + ' code ' + pad3(last.code) + ' was a bluff!');
    }
  }

  function settleFirst(who, why) {
    S.wfg.done = true;
    S.wfg.first = who;
    wfgLine('sys', why + ' <strong>' + (who === 'me' ? 'You strike first.' : 'The AI Captain strikes first.') + '</strong>');
  }

  function codesAct(act) {
    var w = S.wfg;
    if (act === 'iHail') { renderCodesHail(); return; }
    if (act === 'theyHail') { foeHail(); save(); renderCodes(); return; }
    if (act === 'concede') {
      wfgLine('me', '<span class="radio-say">"We concede."</span>');
      settleFirst('foe', 'You conceded.');
    } else if (act === 'challenge') {
      wfgLine('me', '<span class="radio-say">"Challenge!"</span>');
      resolveChallenge('me');
    } else if (act === 'bluff') {
      var v = $('bluffCode').value.replace(/\D/g, '');
      if (!v) { $('bluffCode').focus(); return; }
      myCall(Math.min(999, +v));
      return;
    } else if (act === 'toBattle') {
      startBattle(w.first);
      return;
    }
    save(); renderCodes();
  }

  function renderCodesHail() {
    $('codesActions').innerHTML = '<span class="label">Hail a launch code</span>' + codePad(0);
  }

  // ------------------------------------------------------------
  // BATTLE
  // ------------------------------------------------------------
  function startBattle(first) {
    S.phase = 'battle';
    S.turn = first;
    log('sys', (first === 'me' ? S.me.name : S.foe.name) + ' won the first strike. The Human Captain\'s ' + S.me.name + ' versus the AI Captain\'s ' + S.foe.name + '.');
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
    $('bubbles').innerHTML = SPECS.map(function (spec, i) {
      return '<button type="button" class="bubble' + (S.bubbles[i] ? ' is-x' : '') + '" data-bubble="' + i + '" aria-label="Mark ' + spec.cls + ' as found">' + spec.len + '</button>';
    }).join('');
    paint($('gridAttack'), function (r, c) {
      var k = key(r, c);
      var s = S.myShots[k];
      var o = {};
      if (s && !s.hit) o = { cls: 'is-miss', off: true };
      else if (s && s.letter) o = { cls: 'is-bull', text: s.letter, off: true };
      else if (s) o = { cls: 'is-hit', text: s.wrong.length ? '<span class="tries">' + s.wrong.length + '</span>' : '' };
      if (ui.sel === k || S.alpha === k) o.cls = (o.cls || '') + ' is-target';
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
        '<p class="hint" style="margin-top:0">Tap a coordinate to target it. Tap a gold hit to fire again and try a different letter.</p>' +
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
      if (k === last && S.lastFoe.unseen && ui.tab === 'Defense') cls += ' is-flash';
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
    ui.sel = ui.sel === k ? null : k;
    renderAttack();
    if (ui.sel) $('firePanel').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
      toast(coordK(k) + ': Miss!');
      endMyTurn();
      return;
    }
    if (!S.myShots[k]) S.myShots[k] = { hit: true, letter: null, wrong: [] };
    S.alpha = k;
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
      var tried = shot.wrong.indexOf(L) !== -1;
      return '<button type="button" class="key' + (t === 0 ? ' is-zero' : '') + '" data-letter="' + L + '"' + (tried ? ' disabled' : '') + '>' + L +
        (t != null ? '<span class="key-n">' + t + '</span>' : '') + '</button>';
    }).join('');
    openSheet(
      '<div class="sheet-eyebrow">Hit at ' + coordK(k) + '</div>' +
      '<h2>Alpha Strike</h2>' +
      '<p class="hint" style="margin:4px 0 0">Call the letter at ' + callK(k) + '. Right letter is a Bullseye. Wrong letter and the AI Captain reports how many times it appears across their whole fleet.' +
      (shot.wrong.length ? ' Already tried here: <strong>' + shot.wrong.join(' ') + '</strong>.' : '') + '</p>' +
      '<div class="keys">' + keys + '</div>' +
      '<p class="hint" style="margin:0">Small red numbers are tallies already reported.</p>', false);
  }

  function alphaStrike(L) {
    var k = S.alpha;
    if (!k) return;
    var cell = foeBoard()[k];
    var shot = S.myShots[k];
    var report;
    if (cell.letter === L) {
      shot.letter = L;
      log('me', '"Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"Bullseye."</span>');
      report = '<div class="report is-good"><div class="report-q">"Alpha Strike ' + NATO[L] + '!"</div><div class="report-a">"Bullseye."</div></div>';
    } else {
      var t = countOf(S.foe.words.join(''), L);
      S.myTallies[L] = t;
      if (shot.wrong.indexOf(L) === -1) shot.wrong.push(L);
      log('me', '"Alpha Strike ' + NATO[L] + '!" &mdash; <span class="say">"' + L + ' tally ' + t + '."</span>');
      report = '<div class="report is-warn"><div class="report-q">"Alpha Strike ' + NATO[L] + '!"</div><div class="report-a">"' + L + ' tally ' + t + '."</div></div>' +
        '<p class="hint">' + (t === 0 ? L + ' is nowhere in the AI Captain\'s fleet.' : L + ' appears ' + t + (t === 1 ? ' time' : ' times') + ' across the AI Captain\'s fleet \u2014 just not at ' + coordK(k) + '.') + '</p>';
    }
    S.alpha = null;
    var found = bullCount(S.myShots);
    openSheet('<div class="sheet-eyebrow">' + coordK(k) + '</div><h2>Strike Report</h2>' + report +
      (found === FLEET_CELLS ? '<p class="hint"><strong>All 17 letters found.</strong> Next turn, demand their surrender.</p>' : '') +
      '<button class="btn btn--primary btn--wide" type="button" data-act="endTurn">End Turn</button>', false);
    save();
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
      var L = foeGuessLetter(k, lvl);
      ev.letter = L;
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
    if (ev.hit) {
      lines += '<div class="report ' + (ev.bull ? 'is-bad' : 'is-warn') + '"><div class="report-q">"Alpha Strike ' + NATO[ev.letter] + '!"</div>' +
        '<div class="report-a">' + (ev.bull ? '"Bullseye."' : '"' + ev.letter + ' tally ' + ev.tally + '."') + '</div></div>';
    }
    openSheet('<div class="sheet-eyebrow is-foe">Incoming Fire &middot; ' + esc(S.foe.name) + '</div>' +
      '<h2>' + coord(p.r, p.c) + (ev.hit ? (ev.bull ? ' — ' + ev.letter + ' is lost' : ' — hit, letter safe') : ' — clean miss') + '</h2>' +
      lines + '<div class="mini-wrap"><div class="grid" id="gridIncoming"></div></div>' +
      '<button class="btn btn--primary btn--wide" type="button" data-act="returnFire">Return Fire</button>', false);
    paint($('gridIncoming'), function (r, c) {
      var k = key(r, c);
      var cell = b[k];
      var s = S.foeShots[k];
      var cls = cell ? 'is-ship' : '';
      if (s && !s.hit) cls = 'is-miss';
      if (s && s.hit) cls = 'is-ship ' + (s.letter ? 'is-ship-lost' : 'is-ship-hit');
      if (k === ev.key) cls += ' is-flash';
      return { cls: cls, text: cell ? cell.letter : '' };
    }, false);
  }

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
    if (!unknown.length || hits.length >= FLEET_CELLS) return bestUnresolved;

    // cells touching a hit, weighted up when they extend a line of hits
    var adj = {};
    hits.forEach(function (k) {
      var p = unkey(k);
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) {
        var r2 = p.r + d[0], c2 = p.c + d[1];
        if (r2 < 0 || r2 > 9 || c2 < 0 || c2 > 9) return;
        var k2 = key(r2, c2);
        if (sh[k2]) return;
        var back = sh[key(p.r - d[0], p.c - d[1])];
        adj[k2] = (adj[k2] || 0) + 1 + (back && back.hit ? 3 : 0);
      });
    });
    var adjKeys = Object.keys(adj);

    if (bestUnresolved && (!adjKeys.length || (lvl.pattern && bestConf > 0.55) || Math.random() < 0.2)) return bestUnresolved;
    if (adjKeys.length && Math.random() < lvl.adj) {
      var top = Math.max.apply(null, adjKeys.map(function (k) { return adj[k]; }));
      return pick(adjKeys.filter(function (k) { return adj[k] === top; }));
    }
    if (lvl.density) return densityPick(unknown);
    if (lvl.pattern) {
      var parity = unknown.filter(function (k) { var p = unkey(k); return (p.r + p.c) % 2 === 0; });
      if (parity.length) return pick(parity);
    }
    return pick(unknown);
  }

  function densityPick(unknown) {
    var sh = S.foeShots, heat = {};
    [5, 4, 3, 3, 2].forEach(function (len) {
      for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
        ['H', 'V'].forEach(function (dir) {
          if (dir === 'H' ? c + len > 10 : r + len > 10) return;
          var cells = [];
          for (var i = 0; i < len; i++) {
            var k = dir === 'H' ? key(r, c + i) : key(r + i, c);
            if (sh[k] && !sh[k].hit) return;
            cells.push(k);
          }
          cells.forEach(function (k) { heat[k] = (heat[k] || 0) + 1; });
        });
      }
    });
    var best = -1, out = [];
    unknown.forEach(function (k) {
      var h = heat[k] || 0;
      if (h > best) { best = h; out = [k]; } else if (h === best) out.push(k);
    });
    return pick(out);
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
      if (ex[L] || here.wrong.indexOf(L) !== -1) return;
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
    var order = FREQ.split('').filter(function (L) { return !ex[L] && here.wrong.indexOf(L) === -1; });
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
      '<button class="btn btn--wide" type="button" data-act="rules">Rules of Engagement</button>' +
      (current !== 'home' ? '<button class="btn btn--wide" type="button" data-act="home">Home Port</button>' : '') +
      (ui.installEvt ? '<button class="btn btn--wide" type="button" data-act="install">Install Word Fleet</button>' : '') +
      '<a class="btn btn--wide" href="../pandp.html">Print a Paper Battle Tracker</a>' +
      (live ? '<button class="btn btn--danger btn--wide" type="button" data-act="abandon">Abandon Battle</button>' : '') +
      '<button class="btn btn--ghost btn--wide" type="button" data-act="close">Close</button></div>');
  }

  function openRules() {
    openSheet('<div class="sheet-eyebrow">Word Fleet</div><h2>Rules of Engagement</h2><div class="rules">' +
      '<h3>Fleet Deployment</h3><ul>' +
      '<li>Five word-ships: KETCH (5), SHIP (4), SUB (3), ARK (3), PT (2).</li>' +
      '<li>Place them left-to-right or top-to-bottom. No diagonals or backwards.</li>' +
      '<li>Ships may touch but not overlap. No proper nouns, abbreviations, or suffixes.</li></ul>' +
      '<h3>Who Goes First?</h3><p>Hail a launch code, real or fake. Your opponent concedes, challenges, or counters with an equal or higher code. A challenged real code wins the first strike; a challenged bluff loses it.</p>' +
      '<h3>Standard Attack</h3><ul>' +
      '<li><strong>Initial Strike:</strong> fire on a coordinate. <span class="say">"Miss!"</span> ends your turn. <span class="say">"Hit."</span> earns an Alpha Strike.</li>' +
      '<li><strong>Alpha Strike:</strong> guess the letter there. <span class="say">"Bullseye."</span> writes it in. A wrong letter gets a tally: how many times that letter appears across the opponent\'s whole fleet. Either way your turn ends.</li>' +
      '<li>Fire on the same hit again later to try another letter.</li></ul>' +
      '<h3>Demand Surrender</h3><p>Instead of taking a turn, name every one of your opponent\'s word-ships and exactly where it sits. All correct: <span class="say">"You have won."</span> Anything wrong: <span class="say">"Victory is mine! You lose! Good day sir!"</span></p>' +
      '<h3>Reading the Tracker</h3><ul>' +
      '<li>Grey dot: miss. Gold square: hit, letter unknown (red number = letters tried). Green: bullseye.</li>' +
      '<li>Attack Manifest shows <em>found / tally</em> for each letter. Tap the 5 4 3 3 2 bubbles to cross off ships you have solved.</li></ul>' +
      '</div><button class="btn btn--primary btn--wide" type="button" data-act="close">Aye, Aye</button>');
  }

  // ------------------------------------------------------------
  // events
  // ------------------------------------------------------------
  function on(el, type, fn) { el.addEventListener(type, fn); }

  on($('btnMenu'), 'click', openMenu);
  on($('btnNew'), 'click', function () {
    if (S && S.phase !== 'over' && S.phase !== 'setup' && !confirm('Abandon the current battle?')) return;
    newGame(); show('setup');
  });
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
    var c = e.target.closest('[data-k]');
    if (c) deployTap(c.getAttribute('data-k'));
  });
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
  on($('btnScatter'), 'click', function () { S.me.ships = scatter(S.me.words); ui.pick = -1; save(); renderDeploy(); });
  on($('btnClear'), 'click', function () { S.me.ships.forEach(function (s) { s.r = null; s.c = null; }); ui.pick = 0; save(); renderDeploy(); });
  on($('btnDeployDone'), 'click', confirmDeploy);
  on($('btnDeployBack'), 'click', function () { S.phase = 'setup'; save(); show('setup'); });

  // codes
  on($('codesActions'), 'click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-code')) { myCall(+b.getAttribute('data-code')); return; }
    var act = b.getAttribute('data-act');
    if (act) codesAct(act);
  });
  on($('codesActions'), 'input', function (e) {
    if (e.target.id === 'bluffCode') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
  });

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
  on($('bubbles'), 'click', function (e) {
    var b = e.target.closest('[data-bubble]');
    if (!b) return;
    var i = +b.getAttribute('data-bubble');
    S.bubbles[i] = !S.bubbles[i];
    save(); renderAttack();
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
    else if (act === 'abandon') {
      if (!confirm('Abandon this battle? It counts as a loss.')) return;
      if (S.phase === 'battle' || S.phase === 'codes') bumpRecord(false);
      closeSheet(); S = null; try { localStorage.removeItem(STORE); } catch (err) { /* ignore */ }
      show('home');
    }
    else if (act === 'install') { ui.installEvt.prompt(); ui.installEvt = null; closeSheet(); }
    else if (act === 'endTurn') endMyTurn();
    else if (act === 'submitDemand') submitDemand(false);
    else if (act === 'submitDemandSure') submitDemand(true);
    else if (act === 'returnFire') {
      S.incoming = null; save(); closeSheet();
      ui.tab = 'Attack'; renderBattle();
    }
  });
  on($('sheetBody'), 'input', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
  on($('sheetBody'), 'change', function (e) { if (e.target.hasAttribute('data-claim')) claimInput(e.target); });
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
