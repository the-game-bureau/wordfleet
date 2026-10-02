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
    // Right letter in the right square: two ship's-bell strikes, a rising fanfare, a sparkle on top.
    bonus: function (t) {
      [0, 0.22].forEach(function (d) {
        tone(sfxBus, 'sine', 1319, 1319, t + d, 1.4, 0.22, 0.005);      // bell
        tone(sfxBus, 'sine', 2637, 2637, t + d, 0.7, 0.07, 0.005);      // its ring
        tone(sfxBus, 'triangle', 659, 659, t + d, 0.9, 0.1, 0.005);     // its body
      });
      notes(sfxBus, 'square', [67, 72, 76, 79], t + 0.5, 0.08, 0.22, 0.09);
      notes(sfxBus, 'triangle', [null, null, null, 84], t + 0.5, 0.08, 0.9, 0.22);
      notes(sfxBus, 'sine', [96, 100, 103, 108], t + 0.86, 0.045, 0.3, 0.08);
    },
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

  // --- background music: a naval song in sections ---------------------------
  // Intro, then Verse > Refrain > Chorus > Refrain > Verse 2 > Refrain > Chorus >
  // Bridge > Chorus (up a step) > Refrain, looping back to the Verse (~3 minutes).
  // Verses are dark D minor; the Refrain is a short horn hook that keeps coming
  // back; the Chorus lifts into F major with a driving beat.
  var BPM = 84, EIGHTH = 60 / BPM / 2, BAR = EIGHTH * 8;
  var Dm = { root: 38, chord: [50, 53, 57] }, Bb = { root: 34, chord: [50, 53, 58] },
      Gm = { root: 31, chord: [50, 55, 58] }, A = { root: 33, chord: [49, 52, 57] },
      F = { root: 41, chord: [53, 57, 60] }, C = { root: 36, chord: [52, 55, 60] };
  var MINOR = [Dm, Bb, Gm, A], CHORUS = [F, C, Dm, Bb, F, C, Dm, A];
  var OSTINATO = [0, 0, 7, 0, 0, 7, 8, 7];   // semitones over the bar's root; the 8 is the uneasy minor sixth
  // Melodies: one entry per bar, each a list of [midi, eighths].
  var VERSE = [[[69, 8]], [[65, 5], [67, 3]], [[70, 6], [69, 2]], [[64, 8]],
               [[65, 4], [62, 4]], [[62, 8]], [[67, 5], [65, 3]], [[64, 8]]];
  var VERSE2 = [[[74, 8]], [[70, 5], [72, 3]], [[74, 6], [72, 2]], [[69, 8]],
                [[70, 4], [67, 4]], [[65, 8]], [[67, 5], [69, 3]], [[69, 8]]];
  var HOOK = [[[74, 1], [74, 1], [69, 2], [65, 2], [69, 1], [74, 1]], [[74, 2], [72, 2], [70, 4]],
              [[70, 1], [70, 1], [67, 2], [62, 2], [67, 1], [70, 1]], [[69, 3], [67, 1], [64, 2], [61, 2]]];
  var CHORUS_TUNE = [[[72, 2], [72, 1], [74, 1], [77, 2], [72, 2]], [[76, 3], [74, 1], [72, 4]],
                     [[74, 2], [72, 1], [69, 1], [72, 2], [74, 2]], [[70, 2], [69, 2], [67, 4]],
                     [[72, 2], [72, 1], [74, 1], [77, 2], [81, 2]], [[79, 3], [77, 1], [76, 4]],
                     [[74, 2], [76, 2], [77, 2], [74, 2]], [[73, 4], [76, 4]]];
  var BRIDGE = [[[62, 8]], [[65, 8]], [[67, 8]], [[70, 8]], [[69, 8]], [[65, 8]], [[64, 8]], [[61, 8]]];
  var SONG = [
    { style: 'intro',   chords: MINOR, bars: 4 },
    { style: 'verse',   chords: MINOR, bars: 8, tune: VERSE },
    { style: 'refrain', chords: MINOR, bars: 4, tune: HOOK },
    { style: 'chorus',  chords: CHORUS, bars: 8, tune: CHORUS_TUNE },
    { style: 'refrain', chords: MINOR, bars: 4, tune: HOOK },
    { style: 'verse',   chords: MINOR, bars: 8, tune: VERSE2 },
    { style: 'refrain', chords: MINOR, bars: 4, tune: HOOK },
    { style: 'chorus',  chords: CHORUS, bars: 8, tune: CHORUS_TUNE },
    { style: 'bridge',  chords: [Bb, Bb, Gm, Gm, Dm, Dm, A, A], bars: 8, tune: BRIDGE },
    { style: 'chorus',  chords: CHORUS, bars: 8, tune: CHORUS_TUNE, up: 2 },
    { style: 'refrain', chords: MINOR, bars: 4, tune: HOOK }
  ];
  // Flatten into bars; after the first pass the song loops from the first verse.
  var BARS = [], LOOP_FROM = SONG[0].bars;
  SONG.forEach(function (sec) {
    for (var b = 0; b < sec.bars; b++) {
      BARS.push({ style: sec.style, chord: sec.chords[b % sec.chords.length], tune: sec.tune && sec.tune[b], up: sec.up || 0, first: b === 0, last: b === sec.bars - 1 });
    }
  });
  // HUNT: what plays on the Attack Grid. Same tempo and key, so the two themes hand over at a bar line:
  // a heartbeat, a low string pulse with an uneasy half-step, regular sonar, high held strings, and a
  // short "searching" horn motif every four bars. 16 bars, looping.
  var Eb = { root: 39, chord: [51, 55, 58] };
  var HUNT_CHORDS = [Dm, Dm, Eb, Dm, Dm, Bb, A, A];
  var SEARCH = [[[62, 3], [65, 1], [64, 4]], null, null, null, [[62, 3], [65, 1], [69, 4]], null, [[70, 2], [69, 2], [67, 2], [64, 2]], null];
  var HUNT_BARS = [];
  for (var hb = 0; hb < 16; hb++) {
    HUNT_BARS.push({ style: 'hunt', chord: HUNT_CHORDS[hb % 8], tune: SEARCH[hb % 8], up: 0, first: hb === 0, last: hb === 15, n: hb });
  }
  var MAIN_RETURN = 12;   // coming back from the hunt, the main theme picks up at the refrain's horn hook
  var seq = BARS, mood = 'main', moodChanged = false;

  var step = 0, nextAt = 0, timer = null, ocean = null;

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

  function pad(chord, root, t, bright) {
    chord.forEach(function (m) {
      voice('sawtooth', hz(m), t, BAR * 1.1, bright ? 0.03 : 0.035, bright ? 0.3 : 1.2, 1.0, bright ? 1400 : 650, -7);
      voice('sawtooth', hz(m), t, BAR * 1.1, bright ? 0.03 : 0.035, bright ? 0.3 : 1.2, 1.0, bright ? 1400 : 650, 7);
    });
    if (!bright) {
      voice('triangle', hz(root), t, BAR * 1.05, 0.16, 0.6, 0.8, 400);     // low string bass
      voice('sine', hz(root - 12), t, BAR * 1.05, 0.12, 1.0, 0.8, 200);    // sub drone
    }
  }

  function sonar(t) {
    tone(musicBus, 'sine', 1250, 1240, t, 1.6, 0.07, 0.005);
    tone(musicBus, 'sine', 1250, 1240, t + 0.55, 1.2, 0.025, 0.005);      // faint return echo
  }

  function timpani(t, peak) {
    tone(musicBus, 'sine', 95, 48, t, 1.1, peak, 0.005);
    noise(musicBus, 'lowpass', 400, 120, t, 0.25, peak * 0.5);
  }

  function kick(t, peak) { tone(musicBus, 'sine', 120, 45, t, 0.22, peak, 0.003); }
  function snare(t, peak) { noise(musicBus, 'highpass', 1600, 1600, t, 0.14, peak); tone(musicBus, 'triangle', 190, 150, t, 0.08, peak * 0.6, 0.002); }
  function hat(t, peak) { noise(musicBus, 'highpass', 7000, 7000, t, 0.04, peak); }

  // A melody bar: horn for verse/refrain, bright lead for the chorus, soft strings for the bridge.
  function tune(notes, t, style, up) {
    var at = t;
    notes.forEach(function (n) {
      var d = n[1] * EIGHTH, f = hz(n[0] + up);
      if (style === 'chorus') {
        voice('square', f, at, d * 0.95, 0.04, 0.02, 0.1, 2600);
        voice('triangle', f * 2, at, d * 0.9, 0.025, 0.02, 0.1, 3000);
      } else if (style === 'bridge') {
        voice('triangle', f * 2, at, d * 1.05, 0.04, 0.8, 0.8, 1800);
      } else {
        voice('sawtooth', f, at, d * 1.05, 0.05, style === 'refrain' ? 0.04 : 0.3, 0.3, 1300);
        voice('triangle', f / 2, at, d * 1.05, 0.05, style === 'refrain' ? 0.04 : 0.3, 0.3, 900);
      }
      at += d;
    });
  }

  function huntStep(bar, inBar, t) {
    var root = bar.chord.root;
    if (inBar === 0) {
      // Dark low pad, plus thin high strings holding the chord's fifth.
      pad(bar.chord.chord, root, t, false);
      voice('triangle', hz(bar.chord.chord[2] + 24), t, BAR * 1.05, 0.018, 1.2, 1.0, 2400, 6);
      if (bar.tune) tune(bar.tune, t + EIGHTH * 2, 'verse', 0);
      if (bar.n % 2 === 0) sonar(t + EIGHTH);
      if (bar.n % 8 === 0) timpani(t, 0.3);
    }
    // Heartbeat: lub-dub on beat one, again softer on beat three.
    if (inBar === 0) { kick(t, 0.28); kick(t + EIGHTH * 0.5, 0.18); }
    if (inBar === 4) { kick(t, 0.16); kick(t + EIGHTH * 0.5, 0.1); }
    // Low string pulse on every eighth; the half-step above the root keeps it uneasy.
    var pulse = [0, 0, 0, 1, 0, 0, 12, 1][inBar];
    voice('sawtooth', hz(root + 12 + pulse), t, EIGHTH * 0.7, inBar % 3 === 0 ? 0.055 : 0.035, 0.008, 0.1, 700);
    if (bar.last && inBar >= 4) snare(t, 0.04 + (inBar - 4) * 0.025);
  }

  function scheduleStep(i, t) {
    var bar = seq[Math.floor(i / 8)], inBar = i % 8, up = bar.up;
    if (bar.style === 'hunt') { huntStep(bar, inBar, t); return; }
    var root = bar.chord.root + up, style = bar.style;
    if (inBar === 0) {
      pad(bar.chord.chord.map(function (m) { return m + up; }), root, t, style === 'chorus');
      if (bar.tune) tune(bar.tune, t, style, up);
      if (bar.first && (style === 'verse' || style === 'refrain')) timpani(t, 0.35);
      if ((style === 'intro' || style === 'bridge') && (bar.first || Math.floor(i / 8) % 4 === 2)) sonar(t + BAR * 0.4);
    }
    if (style === 'verse' || style === 'refrain') {
      // Pulsing low-string ostinato.
      var accent = inBar === 0 || inBar === 3 || inBar === 6;
      voice('sawtooth', hz(root + 12 + OSTINATO[inBar]), t, EIGHTH * 0.8, accent ? 0.065 : 0.04, 0.01, 0.12, accent ? 900 : 650);
      if (inBar === 0) kick(t, 0.3);
      if (style === 'refrain' && (inBar === 2 || inBar === 6)) snare(t, 0.12);
      if (style === 'refrain' && bar.last && inBar >= 4) { snare(t, 0.06 + (inBar - 4) * 0.03); snare(t + EIGHTH / 2, 0.06 + (inBar - 4) * 0.03); }
    } else if (style === 'chorus') {
      // Driving: octave-bouncing bass, kick and backbeat, eighth-note hats.
      voice('sawtooth', hz(root + (inBar % 2 ? 12 : 0)), t, EIGHTH * 0.85, 0.11, 0.005, 0.08, 700);
      if (inBar === 0 || inBar === 3 || inBar === 4) kick(t, 0.45);
      if (inBar === 2 || inBar === 6) snare(t, 0.16);
      hat(t, inBar % 2 ? 0.05 : 0.03);
      if (bar.last && inBar >= 6) { snare(t + EIGHTH / 2, 0.12); }
    }
  }

  function tick() {
    while (nextAt < ctx.currentTime + 0.25) {
      // A change of mood waits for the next bar line, then hands over with a sonar ping and a timpani hit.
      if (moodChanged && step % 8 === 0) {
        moodChanged = false;
        var toHunt = mood === 'hunt';
        if ((seq === HUNT_BARS) !== toHunt) {
          seq = toHunt ? HUNT_BARS : BARS;
          step = toHunt ? 0 : MAIN_RETURN * 8;
          timpani(nextAt, 0.32);
          if (toHunt) sonar(nextAt + EIGHTH * 0.5);
        }
      }
      scheduleStep(step, nextAt);
      nextAt += EIGHTH;
      step++;
      if (step >= seq.length * 8) step = seq === HUNT_BARS ? 0 : LOOP_FROM * 8;
    }
  }

  // 'hunt' on the Attack Grid, 'main' everywhere else.
  function setMood(m) {
    if (m === mood) return;
    mood = m;
    if (timer) moodChanged = true;
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
    seq = mood === 'hunt' ? HUNT_BARS : BARS;
    step = 0; moodChanged = false;
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
    setMood: setMood,
    nowPlaying: function () { return timer ? (seq === HUNT_BARS ? 'hunt' : 'main') : 'off'; },
    sfxOn: function () { return prefs.sfx; },
    musicOn: function () { return prefs.music; },
    setSfx: function (on) { prefs.sfx = !!on; savePrefs(); if (on) play('select'); },
    setMusic: function (on) { prefs.music = !!on; savePrefs(); if (on) startMusic(); else stopMusic(); }
  };
})();
