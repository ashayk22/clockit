/**
 * WebAudioAdapter - zero-dependency synthesized lo-fi / ambient audio engine.
 * Implements the common MusicController adapter interface.
 */

import { MusicState } from './MusicState.js';

const TRACKS = [
  {
    title:    '01 - Deep Flow : Sprint Beats',
    artist:   'Tracker Lo-Fi - 48kHz Stereo',
    genre:    'Lo-Fi Rhodes Chords',
    duration: 200,
    type:     'lofi',
    chords: [
      [174.61, 261.63, 329.63, 392.00, 440.00],
      [146.83, 220.00, 261.63, 329.63, 349.23],
      [116.54, 174.61, 220.00, 261.63, 293.66],
      [130.81, 196.00, 233.08, 349.23, 392.00],
    ],
  },
  {
    title:    '02 - Midnight Code : Dreamwave',
    artist:   'Tracker Ambient - Lush Chorus',
    genre:    'Atmospheric Synth Pad',
    duration: 240,
    type:     'synth',
    chords: [
      [110.00, 164.81, 220.00, 261.63, 329.63],
      [87.31, 130.81, 174.61, 220.00, 329.63],
      [65.41, 98.00, 164.81, 246.94, 293.66],
      [98.00, 146.83, 196.00, 246.94, 293.66],
    ],
  },
  {
    title:    '03 - Velocity High : Focus Drone',
    artist:   'Tracker Acoustic - 432Hz Alpha',
    genre:    'Binaural Focus Drone',
    duration: 180,
    type:     'drone',
    chords: [
      [108.00, 216.00, 324.00, 432.00],
      [108.00, 162.00, 324.00, 432.00],
      [144.00, 216.00, 288.00, 432.00],
      [108.00, 216.00, 324.00, 432.00],
    ],
  },
];

export class WebAudioAdapter {
  constructor() {
    this._trackIdx   = 0;
    this._elapsed    = 0;
    this._chordStep  = 0;
    this._isPlaying  = false;
    this._audioCtx   = null;
    this._masterGain = null;
    this._chordTimer = null;
    this._progressTimer = null;
    this._onStateChange  = null;
    this._onProgress     = null;
  }

  get trackCount() { return TRACKS.length; }
  get currentTrack() { return TRACKS[this._trackIdx]; }

  init(callbacks) {
    this._onStateChange = callbacks.onStateChange;
    this._onProgress    = callbacks.onProgress;
    this._emitTrackMeta();
  }

  destroy() {
    this._stopTimers();
    if (this._audioCtx) {
      this._audioCtx.close();
      this._audioCtx = null;
    }
  }

  async play() {
    this._ensureAudioCtx();
    if (this._audioCtx.state === 'suspended') await this._audioCtx.resume();
    this._isPlaying = true;
    this._playChord();
    this._startTimers();
    this._emitStateChange(true);
  }

  async pause() {
    this._isPlaying = false;
    this._stopTimers();
    if (this._audioCtx && this._audioCtx.state === 'running') await this._audioCtx.suspend();
    this._emitStateChange(false);
  }

  setVolume(v) {
    MusicState.patch({ volume: v });
    if (this._masterGain && this._audioCtx) {
      this._masterGain.gain.setValueAtTime(MusicState.isMuted ? 0 : v, this._audioCtx.currentTime);
    }
  }

  setMuted(muted) {
    MusicState.patch({ isMuted: muted });
    if (this._masterGain && this._audioCtx) {
      this._masterGain.gain.setValueAtTime(muted ? 0 : MusicState.volume, this._audioCtx.currentTime);
    }
  }

  seek(pct) {
    const t = this.currentTrack;
    this._elapsed = Math.floor(pct * t.duration);
    if (this._onProgress) this._onProgress(this._elapsed, t.duration);
  }

  nextTrack() {
    this._trackIdx = (this._trackIdx + 1) % TRACKS.length;
    this._reset();
    if (this._isPlaying) this.play();
    else this._emitTrackMeta();
  }

  prevTrack() {
    this._trackIdx = (this._trackIdx - 1 + TRACKS.length) % TRACKS.length;
    this._reset();
    if (this._isPlaying) this.play();
    else this._emitTrackMeta();
  }

  setTrack(idx) {
    if (idx === this._trackIdx) return;
    this._trackIdx = idx;
    this._reset();
    if (this._isPlaying) this.play();
    else this._emitTrackMeta();
  }

  _ensureAudioCtx() {
    if (this._audioCtx) return;
    const Cls = window.AudioContext || window.webkitAudioContext;
    if (!Cls) throw new Error('Web Audio API not supported');
    this._audioCtx = new Cls();
    this._masterGain = this._audioCtx.createGain();
    this._masterGain.gain.setValueAtTime(
      MusicState.isMuted ? 0 : MusicState.volume,
      this._audioCtx.currentTime,
    );
    const lpf = this._audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(3200, this._audioCtx.currentTime);
    this._masterGain.connect(lpf);
    lpf.connect(this._audioCtx.destination);
  }

  _playChord() {
    if (!this._audioCtx || this._audioCtx.state !== 'running') return;
    const t    = this.currentTrack;
    const freq = t.chords[this._chordStep % t.chords.length];
    this._chordStep++;

    freq.forEach((f, i) => {
      const osc    = this._audioCtx.createOscillator();
      const gain   = this._audioCtx.createGain();
      const filter = this._audioCtx.createBiquadFilter();
      osc.type = t.type === 'lofi' ? 'triangle' : t.type === 'synth' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f, this._audioCtx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(t.type === 'synth' ? 1400 : 900, this._audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, this._audioCtx.currentTime + 3.8);
      const now = this._audioCtx.currentTime + i * 0.04;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08 / freq.length, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
      osc.connect(filter); filter.connect(gain); gain.connect(this._masterGain);
      osc.start(now); osc.stop(now + 4.4);
    });

    if (freq.length > 0) {
      const sub = this._audioCtx.createOscillator();
      const sg  = this._audioCtx.createGain();
      sub.type  = 'sine';
      sub.frequency.setValueAtTime(freq[0] / 2, this._audioCtx.currentTime);
      sg.gain.setValueAtTime(0.0001, this._audioCtx.currentTime);
      sg.gain.linearRampToValueAtTime(0.04, this._audioCtx.currentTime + 0.3);
      sg.gain.exponentialRampToValueAtTime(0.0001, this._audioCtx.currentTime + 3.8);
      sub.connect(sg); sg.connect(this._masterGain);
      sub.start(this._audioCtx.currentTime);
      sub.stop(this._audioCtx.currentTime + 4.0);
    }
  }

  _startTimers() {
    this._stopTimers();
    this._chordTimer = setInterval(() => {
      if (this._isPlaying) this._playChord();
    }, 4200);

    this._progressTimer = setInterval(() => {
      this._elapsed++;
      const t = this.currentTrack;
      if (this._elapsed >= t.duration) {
        this.nextTrack();
        return;
      }
      if (this._onProgress) this._onProgress(this._elapsed, t.duration);
    }, 1000);
  }

  _stopTimers() {
    clearInterval(this._chordTimer);
    clearInterval(this._progressTimer);
  }

  _reset() {
    this._elapsed   = 0;
    this._chordStep = 0;
  }

  _emitTrackMeta() {
    const t = this.currentTrack;
    MusicState.patch({
      trackTitle:    t.title,
      trackArtist:   t.artist,
      trackGenre:    t.genre,
      trackDuration: t.duration,
      trackElapsed:  0,
    });
    if (this._onStateChange) this._onStateChange();
    if (this._onProgress) this._onProgress(0, t.duration);
  }

  _emitStateChange(playing) {
    MusicState.patch({ isPlaying: playing });
    if (this._onStateChange) this._onStateChange();
  }
}