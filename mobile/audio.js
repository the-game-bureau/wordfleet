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

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null, oceanBuf = null;

  // Stereo impulse response: decaying noise, for reverb.
  function impulse(seconds, decay) {
    var len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

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
    // A long synthetic hall for the score: open sea, lots of space.
    var verb = ctx.createConvolver(), wet = ctx.createGain();
    verb.buffer = impulse(3.5, 2.8);
    wet.gain.value = 0.55;
    musicBus.connect(verb); verb.connect(wet); wet.connect(master);
    oceanBuf = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
    var od = oceanBuf.getChannelData(0);
    for (var n = 0; n < od.length; n++) od[n] = Math.random() * 2 - 1;
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

  // --- background music: a dark naval score -------------------------------
  // Slow D minor (Dm - Bb - Gm - A), 16-bar cycle: a sparse opening of drone,
  // strings and sonar, then a pulsing low-string ostinato and timpani, with a
  // lonely horn line on alternate passes. Ocean swell underneath throughout.
  var BPM = 66, EIGHTH = 60 / BPM / 2, BAR = EIGHTH * 8, CYCLE = 16;
  var PROG = [
    { root: 38, chord: [50, 53, 57] },   // Dm
    { root: 34, chord: [50, 53, 58] },   // Bb
    { root: 31, chord: [50, 55, 58] },   // Gm
    { root: 33, chord: [49, 52, 57] }    // A
  ];
  var OSTINATO = [0, 0, 7, 0, 0, 7, 8, 7];   // semitones over the bar's root; the 8 is the uneasy minor sixth
  // Horn line for bars 8-15: [midi, eighths] pairs.
  var HORN = [
    [[69, 8]], [[65, 5], [67, 3]], [[70, 6], [69, 2]], [[64, 8]],
    [[65, 4], [62, 4]], [[62, 8]], [[67, 5], [65, 3]], [[64, 8]]
  ];
  var step = 0, nextAt = 0, timer = null, cycle = 0, ocean = null;

  function voice(type, f, t, dur, peak, attack, release, cutoff, detune) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f1 = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    f1.type = 'lowpass'; f1.frequency.setValueAtTime(cutoff || 800, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); f1.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + dur + 0.1);
  }

  function pad(chord, root, t) {
    chord.forEach(function (m) {
      voice('sawtooth', hz(m), t, BAR * 1.15, 0.035, 1.4, 1.2, 650, -7);
      voice('sawtooth', hz(m), t, BAR * 1.15, 0.035, 1.4, 1.2, 650, 7);
    });
    voice('triangle', hz(root), t, BAR * 1.1, 0.16, 0.8, 1.0, 400);        // low string bass
    voice('sine', hz(root - 12), t, BAR * 1.1, 0.12, 1.2, 1.0, 200);       // sub drone
  }

  function sonar(t) {
    tone(musicBus, 'sine', 1250, 1240, t, 1.6, 0.07, 0.005);
    tone(musicBus, 'sine', 1250, 1240, t + 0.55, 1.2, 0.025, 0.005);      // faint return echo
  }

  function timpani(t, peak) {
    tone(musicBus, 'sine', 95, 48, t, 1.1, peak, 0.005);
    noise(musicBus, 'lowpass', 400, 120, t, 0.25, peak * 0.5);
  }

  function scheduleStep(i, t) {
    var bar = Math.floor(i / 8), inBar = i % 8, chord = PROG[bar % 4];
    if (inBar === 0) {
      pad(chord.chord, chord.root, t);
      if (bar === 4 || bar === 8 || bar === 12) timpani(t, 0.4);
      if (bar === 1 || bar === 9 || (bar === 13 && cycle % 2)) sonar(t + BAR * 0.4);
      // Horn on alternate passes, once the ostinato is going.
      if (bar >= 8 && cycle % 2 === 0) {
        var at = t;
        HORN[bar - 8].forEach(function (n) {
          var d = n[1] * EIGHTH;
          voice('sawtooth', hz(n[0]), at, d * 1.05, 0.045, 0.35, 0.5, 1100);
          voice('triangle', hz(n[0] - 12), at, d * 1.05, 0.05, 0.35, 0.5, 900);
          at += d;
        });
      }
    }
    // Pulsing low-string ostinato from bar 4 (every bar after the first pass).
    if (bar >= 4 || cycle > 0) {
      var accent = inBar === 0 || inBar === 3 || inBar === 6;
      voice('sawtooth', hz(chord.root + 12 + OSTINATO[inBar]), t, EIGHTH * 0.8, accent ? 0.07 : 0.045, 0.01, 0.12, accent ? 900 : 650);
    }
    // Timpani roll into the top of the cycle.
    if (bar === 15 && inBar >= 4) timpani(t, 0.12 + (inBar - 4) * 0.06);
  }

  function tick() {
    while (nextAt < ctx.currentTime + 0.25) {
      scheduleStep(step, nextAt);
      nextAt += EIGHTH;
      step++;
      if (step >= CYCLE * 8) { step = 0; cycle++; }
    }
  }

  // Ocean swell: looped low-passed noise, its volume rolling like waves.
  function startOcean() {
    var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    var lfo = ctx.createOscillator(), depth = ctx.createGain();
    src.buffer = oceanBuf; src.loop = true;
    lp.type = 'lowpass'; lp.frequency.value = 380;
    g.gain.value = 0.07;
    lfo.frequency.value = 0.09; depth.gain.value = 0.05;
    lfo.connect(depth); depth.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(musicBus);
    src.start(); lfo.start();
    ocean = { src: src, lfo: lfo };
  }

  function startMusic() {
    if (!prefs.music || timer || !ensure()) return;
    step = 0; cycle = 0;
    nextAt = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 3);
    startOcean();
    timer = setInterval(tick, 50);
    tick();
  }

  function stopMusic() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    if (ocean) {
      var o = ocean; ocean = null;
      o.src.stop(ctx.currentTime + 0.5); o.lfo.stop(ctx.currentTime + 0.5);
    }
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
