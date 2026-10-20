/**
 * YouTubeAdapter - drives the official YouTube IFrame Player API.
 *
 * Browser limitations:
 *   - Autoplay requires a prior user gesture (play is deferred until user clicks).
 *   - Volume control via player.setVolume(0-100).
 *   - Seeking via player.seekTo(seconds).
 *
 * The adapter loads the YT IFrame API script once, then creates a hidden player
 * that renders into #yt-player-frame inside the music widget.
 */

import { MusicState } from './MusicState.js';

const API_SCRIPT_ID  = 'yt-iframe-api';
const PLAYER_FRAME_ID = 'yt-player-frame';

let apiReady = false;
let apiReadyCallbacks = [];

function loadYTScript() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(API_SCRIPT_ID)) return;
  const tag = document.createElement('script');
  tag.id  = API_SCRIPT_ID;
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

if (typeof window !== 'undefined') {
  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    apiReadyCallbacks.forEach(cb => cb());
    apiReadyCallbacks = [];
  };
}

function whenApiReady(cb) {
  if (typeof window !== 'undefined' && apiReady && window.YT && window.YT.Player) { cb(); return; }
  apiReadyCallbacks.push(cb);
  loadYTScript();
}

export class YouTubeAdapter {
  constructor() {
    this._player         = null;
    this._onStateChange  = null;
    this._onProgress     = null;
    this._progressTimer  = null;
    this._pendingPlay    = false;
    this._lastVideoId    = null;
  }

  init(callbacks) {
    this._onStateChange = callbacks.onStateChange;
    this._onProgress    = callbacks.onProgress;
    loadYTScript();
    MusicState.patch({
      trackTitle:  'YouTube',
      trackArtist: 'Enter a Video ID or URL',
      trackGenre:  'YouTube',
    });
    if (this._onStateChange) this._onStateChange();
  }

  destroy() {
    this._stopProgress();
    try { if (this._player) this._player.destroy(); } catch (e) { /* ignore */ }
    this._player = null;
  }

  async play() {
    const videoId = MusicState.youtubeVideoId;
    if (!videoId) { this._setError('No video ID set.'); return; }

    if (!this._player) {
      this._pendingPlay = true;
      this._createPlayer(videoId);
      return;
    }

    if (this._lastVideoId !== videoId) {
      this._lastVideoId = videoId;
      this._player.loadVideoById(videoId);
    } else {
      this._player.playVideo();
    }
  }

  async pause() {
    if (this._player) this._player.pauseVideo();
    this._stopProgress();
    MusicState.patch({ isPlaying: false });
    if (this._onStateChange) this._onStateChange();
  }

  setVolume(v) {
    MusicState.patch({ volume: v });
    if (this._player) this._player.setVolume(Math.round(v * 100));
  }

  setMuted(muted) {
    MusicState.patch({ isMuted: muted });
    if (this._player) {
      if (muted) this._player.mute();
      else       this._player.unMute();
    }
  }

  seek(pct) {
    if (!this._player) return;
    const duration = this._player.getDuration ? this._player.getDuration() : 0;
    if (duration > 0) this._player.seekTo(pct * duration, true);
  }

  nextTrack() {}
  prevTrack() {}

  setVideoId(id) {
    MusicState.patch({ youtubeVideoId: id, error: null });
    if (this._player) {
      this._lastVideoId = id;
      this._player.loadVideoById(id);
    }
  }

  _createPlayer(videoId) {
    const container = document.getElementById(PLAYER_FRAME_ID);
    if (!container) return;

    whenApiReady(() => {
      this._lastVideoId = videoId;
      this._player = new window.YT.Player(container, {
        height:  '1',
        width:   '1',
        videoId: videoId,
        playerVars: {
          autoplay:       1,
          controls:       0,
          disablekb:      1,
          fs:             0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel:            0,
          origin:         window.location.origin,
        },
        events: {
          onReady:       (e) => this._onReady(e),
          onStateChange: (e) => this._onYTStateChange(e),
          onError:       (e) => this._onYTError(e),
        },
      });
    });
  }

  _onReady(event) {
    MusicState.patch({ error: null });
    event.target.setVolume(Math.round(MusicState.volume * 100));
    if (MusicState.isMuted) event.target.mute();
    if (this._pendingPlay) {
      this._pendingPlay = false;
      event.target.playVideo();
    }
  }

  _onYTStateChange(event) {
    const YT = window.YT;
    if (!YT) return;
    switch (event.data) {
      case YT.PlayerState.PLAYING: {
        MusicState.patch({ error: null });
        const dur = event.target.getDuration();
        const vid = event.target.getVideoData ? event.target.getVideoData() : {};
        MusicState.patch({
          isPlaying:     true,
          trackTitle:    vid.title  || 'YouTube Track',
          trackArtist:   vid.author || 'YouTube',
          trackGenre:    'YouTube',
          trackDuration: dur || 0,
        });
        if (this._onStateChange) this._onStateChange();
        this._startProgress();
        break;
      }
      case YT.PlayerState.PAUSED:
        this._stopProgress();
        MusicState.patch({ isPlaying: false });
        if (this._onStateChange) this._onStateChange();
        break;
      case YT.PlayerState.ENDED:
        this._stopProgress();
        MusicState.patch({ isPlaying: false });
        if (this._onStateChange) this._onStateChange();
        break;
    }
  }

  _onYTError(event) {
    const codes = {
      2:   'Invalid video ID',
      5:   'HTML5 player error',
      100: 'Video not found',
      101: 'Embedding not allowed',
      150: 'Embedding not allowed',
    };
    this._setError(codes[event.data] || ('YouTube error ' + event.data));
  }

  _startProgress() {
    this._stopProgress();
    this._progressTimer = setInterval(() => {
      if (!this._player) return;
      const elapsed  = this._player.getCurrentTime ? this._player.getCurrentTime() : 0;
      const duration = this._player.getDuration    ? this._player.getDuration()    : 0;
      MusicState.patch({ trackElapsed: elapsed });
      if (this._onProgress) this._onProgress(elapsed, duration);
    }, 1000);
  }

  _stopProgress() {
    clearInterval(this._progressTimer);
    this._progressTimer = null;
  }

  _setError(msg) {
    MusicState.patch({ error: msg, isPlaying: false });
    if (this._onStateChange) this._onStateChange();
  }
}