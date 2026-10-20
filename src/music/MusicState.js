/**
 * MusicState - singleton that owns all music-related state.
 * Providers read from and write to this; the controller brokers updates to the UI.
 */

export const PROVIDERS = {
  WEBAUDIO: 'webaudio',
  YOUTUBE:  'youtube',
  SPOTIFY:  'spotify',
};

const LS_KEY = 'tracker-music-prefs';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function savePrefs(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      provider:       state.provider,
      volume:         state.volume,
      youtubeVideoId: state.youtubeVideoId,
      spotifyUri:     state.spotifyUri,
    }));
  } catch { /* storage may be blocked */ }
}

const prefs = loadPrefs();

export const MusicState = {
  provider:       prefs.provider       ?? PROVIDERS.WEBAUDIO,
  isPlaying:      false,
  volume:         prefs.volume         ?? 0.7,
  isMuted:        false,
  trackTitle:     '',
  trackArtist:    '',
  trackGenre:     '',
  trackDuration:  0,
  trackElapsed:   0,
  error:          null,
  youtubeVideoId: prefs.youtubeVideoId ?? 'jfKfPfyJRdk',
  spotifyUri:     prefs.spotifyUri     ?? '37i9dQZF1DX8NTLI2TtZa6',

  patch(partial) {
    Object.assign(this, partial);
    savePrefs(this);
  },
};