/**
 * SpotifyAdapter - uses the Spotify Embed iframe via postMessage.
 *
 * Supported: play, pause via postMessage.
 * Not supported: volume (no API), seek (no API), next/prev (no API).
 * Requires: user has an active Spotify account and Spotify is accessible.
 */

import { MusicState } from './MusicState.js';

export class SpotifyAdapter {
  constructor() {
    this._iframe        = null;
    this._onStateChange = null;
    this._onProgress    = null;
    this._progressTimer = null;
  }

  init(callbacks) {
    this._onStateChange = callbacks.onStateChange;
    this._onProgress    = callbacks.onProgress;
    this._injectIframe();
    MusicState.patch({
      trackTitle:  'Spotify',
      trackArtist: 'Paste a playlist or track URL',
      trackGenre:  'Spotify',
    });
    if (this._onStateChange) this._onStateChange();
  }

  destroy() {
    this._stopProgress();
    if (this._iframe) {
      this._iframe.remove();
      this._iframe = null;
    }
  }

  play() {
    if (!this._iframe) return;
    this._postMessage({ method: 'play' });
    this._startProgress();
    MusicState.patch({ isPlaying: true });
    if (this._onStateChange) this._onStateChange();
  }

  pause() {
    if (!this._iframe) return;
    this._postMessage({ method: 'pause' });
    this._stopProgress();
    MusicState.patch({ isPlaying: false });
    if (this._onStateChange) this._onStateChange();
  }

  setVolume(v) {
    MusicState.patch({ volume: v });
    // Spotify Embed does not expose a volume API
  }

  setMuted(m) {
    MusicState.patch({ isMuted: m });
  }

  seek(_pct) {
    // Seek is not supported via postMessage on Spotify embeds
  }

  nextTrack() {}
  prevTrack() {}

  setUri(uri) {
    MusicState.patch({ spotifyUri: uri, error: null });
    if (this._iframe) { this._iframe.remove(); this._iframe = null; }
    this._injectIframe();
  }

  _injectIframe() {
    const container = document.getElementById('spotify-embed-container');
    if (!container) return;
    const uri = MusicState.spotifyUri;
    // Normalise: accept plain id, type/id, or full URL
    let embedPath = uri;
    const urlMatch = uri.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
    if (urlMatch) embedPath = urlMatch[1] + '/' + urlMatch[2];
    const src = 'https://open.spotify.com/embed/' + embedPath;
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width  = '0';
    iframe.height = '0';
    iframe.allow  = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.style.cssText = 'border:none;position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';
    container.appendChild(iframe);
    this._iframe = iframe;
  }

  _postMessage(msg) {
    if (this._iframe && this._iframe.contentWindow) {
      this._iframe.contentWindow.postMessage(JSON.stringify(msg), '*');
    }
  }

  _startProgress() {
    this._stopProgress();
    this._progressTimer = setInterval(() => {
      const elapsed = (MusicState.trackElapsed || 0) + 1;
      MusicState.patch({ trackElapsed: elapsed });
      if (this._onProgress) this._onProgress(elapsed, 0);
    }, 1000);
  }

  _stopProgress() {
    clearInterval(this._progressTimer);
    this._progressTimer = null;
  }
}