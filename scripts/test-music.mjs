// Test script for Music Architecture & Logic
import { MusicState, PROVIDERS } from '../src/music/MusicState.js';
import { MusicController } from '../src/music/MusicController.js';
import { WebAudioAdapter } from '../src/music/WebAudioAdapter.js';
import { YouTubeAdapter } from '../src/music/YouTubeAdapter.js';
import { SpotifyAdapter } from '../src/music/SpotifyAdapter.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

// Mock window and document if not in browser
globalThis.window = globalThis.window || { location: { origin: 'http://localhost:5173' } };
globalThis.document = globalThis.document || {
  getElementById: (id) => ({
    id,
    style: {},
    appendChild: () => {},
    remove: () => {}
  }),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    setAttribute: () => {},
    appendChild: () => {},
    remove: () => {}
  }),
  head: { appendChild: () => {} }
};

console.log('--- Testing MusicState ---');
assert(MusicState.provider !== undefined, 'MusicState has provider');
assert(MusicState.volume >= 0 && MusicState.volume <= 1, 'MusicState volume is valid');
MusicState.patch({ volume: 0.85, isPlaying: false });
assert(MusicState.volume === 0.85, 'MusicState.patch updates volume');

console.log('\n--- Testing MusicController & Adapter Switching ---');
const controller = new MusicController();
assert(controller !== null, 'MusicController initializes');

// Test Provider Switching
controller.selectProvider(PROVIDERS.YOUTUBE);
assert(MusicState.provider === PROVIDERS.YOUTUBE, 'Provider switched to YouTube');
assert(controller._adapter instanceof YouTubeAdapter, 'Adapter swapped to YouTubeAdapter');

controller.selectProvider(PROVIDERS.SPOTIFY);
assert(MusicState.provider === PROVIDERS.SPOTIFY, 'Provider switched to Spotify');
assert(controller._adapter instanceof SpotifyAdapter, 'Adapter swapped to SpotifyAdapter');

controller.selectProvider(PROVIDERS.WEBAUDIO);
assert(MusicState.provider === PROVIDERS.WEBAUDIO, 'Provider switched to WebAudio');
assert(controller._adapter instanceof WebAudioAdapter, 'Adapter swapped to WebAudioAdapter');

console.log('\n--- Testing WebAudioAdapter track navigation ---');
const webAdapter = controller._adapter;
const initialTrack = webAdapter.currentTrack;
assert(initialTrack !== null, 'Current track is present');
assert(webAdapter.trackCount === 3, 'Has 3 synthesized tracks');

webAdapter.nextTrack();
assert(webAdapter._trackIdx === 1, 'nextTrack advanced track index to 1');

webAdapter.prevTrack();
assert(webAdapter._trackIdx === 0, 'prevTrack decremented track index to 0');

webAdapter.setTrack(2);
assert(webAdapter._trackIdx === 2, 'setTrack(2) set track index to 2');

console.log('\n--- Testing YouTubeAdapter input formatting ---');
controller.selectProvider(PROVIDERS.YOUTUBE);
controller.setYouTubeVideoId('jfKfPfyJRdk');
assert(MusicState.youtubeVideoId === 'jfKfPfyJRdk', 'YouTube video ID set correctly');

console.log('\n--- Testing SpotifyAdapter URI formatting ---');
controller.selectProvider(PROVIDERS.SPOTIFY);
controller.setSpotifyUri('playlist/37i9dQZF1DX8NTLI2TtZa6');
assert(MusicState.spotifyUri === 'playlist/37i9dQZF1DX8NTLI2TtZa6', 'Spotify URI set correctly');

console.log('\n--- Testing Callbacks & State Synchronization ---');
let stateChanged = false;
let progressUpdated = false;

controller.setCallbacks({
  onStateChange: () => { stateChanged = true; },
  onProgress: (elapsed, dur) => { progressUpdated = true; }
});

controller.selectProvider(PROVIDERS.WEBAUDIO);
assert(stateChanged, 'onStateChange triggered on provider switch');

controller.setVolume(0.42);
assert(MusicState.volume === 0.42, 'Volume updated to 0.42 via controller');

controller.setMuted(true);
assert(MusicState.isMuted === true, 'Muted state set to true via controller');

controller.setMuted(false);
assert(MusicState.isMuted === false, 'Muted state reset to false via controller');

controller.seek(0.5);
assert(controller._adapter._elapsed === 100, 'Seek 50% calculated correctly (100s for 200s track)');

console.log('\n--- Testing Error Handling ---');
controller.selectProvider(PROVIDERS.YOUTUBE);
MusicState.patch({ youtubeVideoId: '' });
controller.play();
assert(MusicState.error === 'No video ID set.', 'Error state set when video ID is missing');

console.log(`\n========================================`);
console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) process.exit(1);
