/* ============================================================
   WORD FLEET - sound effects and background music
   Everything is synthesized with the Web Audio API: no audio
   files to download or license, and it all works offline.
   ============================================================ */
(function () {
  'use strict';

  var PREFS = 'wordfleet-audio';
  var prefs = { sfx: true, music: true };
  try { var saved = JSON.parse(localStorage.getItem(PREFS)); if (saved) prefs = { sfx: saved.sfx !== false, music: saved.music !== false }; } catch (e) { /* defaults */ }

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;

  function savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }

  // Browsers only allow audio after a user gesture, so the context is made on the first tap.
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended' && !document.hidden) ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  // --- building blocks -------------------------------------------------
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone(bus, type, f0, f1, t, dur, peak, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, attack || 0.005, peak, dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(bus, filterType, f0, f1, t, dur, peak, q) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = filterType; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.01, peak, dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  function notes(bus, type, list, t, step, dur, peak) {
    list.forEach(function (m, i) { if (m != null) tone(bus, type, hz(m), null, t + i * step, dur, peak, 0.01); });
  }

  // --- sound effects ---------------------------------------------------
  var SFX = {
    select: function (t) { tone(sfxBus, 'sine', 900, 700, t, 0.06, 0.12); },
    key: function (t) { tone(sfxBus, 'triangle', 660, 660, t, 0.05, 0.12); },
    place: function (t) { tone(sfxBus, 'sine', 190, 90, t, 0.14, 0.5); noise(sfxBus, 'lowpass', 900, 300, t, 0.08, 0.25); },
    rotate: function (t) { noise(sfxBus, 'bandpass', 500, 2400, t, 0.18, 0.25, 2); },
    error: function (t) { tone(sfxBus, 'square', 150, 120, t, 0.16, 0.12); tone(sfxBus, 'square', 110, 100, t + 0.12, 0.2, 0.1); },
    fire: function (t) { noise(sfxBus, 'bandpass', 300, 2600, t, 0.4, 0.45, 1.5); tone(sfxBus, 'sine', 320, 70, t, 0.35, 0.35); },
    miss: function (t) { noise(sfxBus, 'lowpass', 2200, 180, t, 0.6, 0.5); tone(sfxBus, 'sine', 500, 180, t, 0.25, 0.12); },
    hit: function (t) { noise(sfxBus, 'lowpass', 1400, 70, t, 0.9, 0.9); tone(sfxBus, 'sine', 140, 38, t, 0.6, 0.9); },
    bull: function (t) { notes(sfxBus, 'sine', [88, 95], t, 0.12, 0.6, 0.3); notes(sfxBus, 'triangle', [76, 83], t, 0.12, 0.5, 0.12); },
    tally: function (t) { notes(sfxBus, 'square', [67, 62], t, 0.13, 0.12, 0.08); },
    zero: function (t) { tone(sfxBus, 'sawtooth', 110, 100, t, 0.35, 0.1); },
    fill: function (t) { notes(sfxBus, 'sine', [79, 83, 86, 91], t, 0.06, 0.25, 0.18); },
    solveOk: function (t) { notes(sfxBus, 'square', [60, 64, 67, 72], t, 0.11, 0.3, 0.12); notes(sfxBus, 'triangle', [48, null, null, 60], t, 0.11, 0.5, 0.25); },
    solveBad: function (t) { tone(sfxBus, 'sawtooth', 233, 220, t, 0.3, 0.14); tone(sfxBus, 'sawtooth', 220, 196, t + 0.32, 0.55, 0.14); },
    incoming: function (t) { tone(sfxBus, 'sine', 1300, 500, t, 0.55, 0.18); },
    win: function (t) {
      notes(sfxBus, 'square', [60, 64, 67, 72, null, 67, 72], t, 0.14, 0.3, 0.12);
      notes(sfxBus, 'triangle', [48, null, 55, null, 60, null, 48], t, 0.14, 0.4, 0.3);
      tone(sfxBus, 'square', hz(76), null, t + 0.98, 0.9, 0.12, 0.02);
    },
    lose: function (t) {
      notes(sfxBus, 'triangle', [67, 65, 63, 62], t, 0.28, 0.35, 0.25);
      tone(sfxBus, 'sawtooth', hz(38), null, t + 1.12, 1.1, 0.12, 0.05);
    }
  };

  function play(name, delay) {
    if (!prefs.sfx || !SFX[name] || !ensure()) return;
    SFX[name](ctx.currentTime + 0.01 + (delay || 0));
  }

  // --- background music: a quiet sea march in D minor -------------------
  // 8 bars of eighth notes (null = rest). Chords: Dm Dm Bb C Dm Dm Bb A.
  var MELODY = [
    69, null, 74, null, 69, 65, 62, null,
    65, 67, 69, null, 69, null, 67, 65,
    74, null, 72, 70, 69, null, 65, null,
    67, null, 64, null, 67, 69, 67, 64,
    69, null, 74, null, 69, 65, 62, null,
    65, 67, 69, 70, 72, null, 70, 69,
    70, null, 69, 67, 65, null, 62, null,
    61, null, 64, null, 69, null, null, null
  ];
  var BASS = [38, 38, 34, 36, 38, 38, 34, 33];
  var BPM = 84, EIGHTH = 60 / BPM / 2;
  var step = 0, nextAt = 0, timer = null, loop = 0;

  function scheduleStep(i, t) {
    var bar = Math.floor(i / 8), inBar = i % 8;
    // Bass on each beat, with a fifth on beat three.
    if (inBar % 2 === 0) {
      var root = BASS[bar];
      tone(musicBus, 'triangle', hz(inBar === 4 ? root + 7 : root), null, t, EIGHTH * 1.8, 0.32, 0.01);
    }
    // Kick on 1 and 3, snare on 2 and 4, a little roll into the next phrase.
    if (inBar === 0 || inBar === 4) tone(musicBus, 'sine', 110, 45, t, 0.18, 0.35);
    if (inBar === 2 || inBar === 6) noise(musicBus, 'highpass', 1800, 1800, t, 0.12, 0.09);
    if (bar === 7 && inBar === 7) { noise(musicBus, 'highpass', 1800, 1800, t, 0.06, 0.06); noise(musicBus, 'highpass', 1800, 1800, t + EIGHTH / 2, 0.06, 0.07); }
    // Melody: full on odd loops, every other bar on even loops, for some variety.
    var m = MELODY[i];
    if (m != null && (loop % 2 === 0 || bar % 2 === 0)) {
      var len = 1;
      while (i + len < MELODY.length && MELODY[i + len] == null && len < 3) len++;
      tone(musicBus, 'square', hz(m), null, t, EIGHTH * len * 0.9, 0.05, 0.02);
      tone(musicBus, 'triangle', hz(m + 12), null, t, EIGHTH * len * 0.7, 0.03, 0.02);
    }
  }

  function tick() {
    while (nextAt < ctx.currentTime + 0.2) {
      scheduleStep(step, nextAt);
      nextAt += EIGHTH;
      step++;
      if (step >= MELODY.length) { step = 0; loop++; }
    }
  }

  function startMusic() {
    if (!prefs.music || timer || !ensure()) return;
    step = 0; loop = 0;
    nextAt = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    timer = setInterval(tick, 50);
    tick();
  }

  function stopMusic() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  }

  // Start once the player first touches the page (browser autoplay rules).
  function unlock() {
    if (!ensure()) return;
    if (prefs.music) startMusic();
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  // Go quiet when the app is in the background.
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { stopMusic(); ctx.suspend(); }
    else { ctx.resume(); if (prefs.music) startMusic(); }
  });

  window.WFAudio = {
    play: play,
    sfxOn: function () { return prefs.sfx; },
    musicOn: function () { return prefs.music; },
    setSfx: function (on) { prefs.sfx = !!on; savePrefs(); if (on) play('select'); },
    setMusic: function (on) { prefs.music = !!on; savePrefs(); if (on) startMusic(); else stopMusic(); }
  };
})();
