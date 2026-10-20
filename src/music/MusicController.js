/**
 * MusicController - facade that mediates between UI and concrete adapters.
 * UI code only talks to this controller; adapters are swapped on provider change.
 */

import { MusicState, PROVIDERS } from './MusicState.js';
import { WebAudioAdapter } from './WebAudioAdapter.js';
import { YouTubeAdapter }  from './YouTubeAdapter.js';
import { SpotifyAdapter }  from './SpotifyAdapter.js';

export class MusicController {
  constructor() {
    this._adapter   = null;
    this._callbacks = { onStateChange: null, onProgress: null };
    this._ensureAdapter();
  }

  setCallbacks({ onStateChange, onProgress }) {
    this._callbacks = { onStateChange, onProgress };
    if (this._adapter) this._adapter.init(this._callbacks);
  }

  // -- Public controls -------------------------------------------------------

  play()   { if (this._adapter) this._adapter.play(); }
  pause()  { if (this._adapter) this._adapter.pause(); }
  toggle() {
    if (MusicState.isPlaying) this.pause();
    else                      this.play();
  }
  next()   { if (this._adapter && this._adapter.nextTrack) this._adapter.nextTrack(); }
  prev()   { if (this._adapter && this._adapter.prevTrack) this._adapter.prevTrack(); }

  setVolume(v)   { if (this._adapter) this._adapter.setVolume(v); }
  setMuted(m)    { if (this._adapter) this._adapter.setMuted(m); }
  seek(pct)      { if (this._adapter) this._adapter.seek(pct); }

  selectProvider(p) {
    if (!Object.values(PROVIDERS).includes(p)) return;
    if (MusicState.provider === p) return;
    if (this._adapter && this._adapter.destroy) this._adapter.destroy();
    MusicState.patch({ provider: p, isPlaying: false, error: null });
    this._ensureAdapter();
    if (this._adapter) this._adapter.init(this._callbacks);
    if (this._callbacks.onStateChange) this._callbacks.onStateChange();
  }

  setYouTubeVideoId(id) {
    if (MusicState.provider !== PROVIDERS.YOUTUBE) this.selectProvider(PROVIDERS.YOUTUBE);
    if (this._adapter && this._adapter.setVideoId) this._adapter.setVideoId(id);
  }

  setSpotifyUri(uri) {
    if (MusicState.provider !== PROVIDERS.SPOTIFY) this.selectProvider(PROVIDERS.SPOTIFY);
    if (this._adapter && this._adapter.setUri) this._adapter.setUri(uri);
  }

  // -- Internal --------------------------------------------------------------

  _ensureAdapter() {
    switch (MusicState.provider) {
      case PROVIDERS.YOUTUBE:  this._adapter = new YouTubeAdapter();  break;
      case PROVIDERS.SPOTIFY:  this._adapter = new SpotifyAdapter();  break;
      default:                 this._adapter = new WebAudioAdapter();
    }
  }
}