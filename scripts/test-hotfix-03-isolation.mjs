import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const storageSource = await read('src/services/repositories/storage.ts');
const transpiled = (await transform(storageSource, { loader: 'ts', format: 'esm', target: 'es2022' })).code;
const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
  },
};
const storage = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);

function storeFor(owner) {
  storage.setStorageOwner(owner);
  return new storage.LocalJsonStore('records', [], Array.isArray);
}

const demo = storeFor('demo');
demo.save(['demo note']);
const accountA = storeFor('user:A');
assert.deepEqual(accountA.value, []);
accountA.save(['A note', 'pending A operation']);
const accountB = storeFor('user:B');
assert.deepEqual(accountB.value, []);
accountB.save(['B note']);
assert.deepEqual(storeFor('user:A').value, ['A note', 'pending A operation']);
assert.deepEqual(storeFor('demo').value, ['demo note']);
assert.deepEqual(storeFor('local').value, []);
assert.deepEqual(storeFor('user:A').value, ['A note', 'pending A operation']); // reload persistence

const sync = await read('src/services/cloud/syncEngine.ts');
const notes = await read('src/services/notesStorage.ts');
const auth = await read('src/auth/AuthContext.tsx');
const focusNotes = await read('src/components/focus/FocusNotesPanel.tsx');
const homepage = await read('src/landing/LandingPage.tsx');
assert.match(sync, /clockit-sync-queue:\$\{encodeURIComponent\(owner\)\}/);
assert.match(sync, /op\.ownerId !== owner/);
assert.match(sync, /op\.payload\.user_id !== owner/);
assert.match(sync, /queue === ownerQueue/);
assert.match(sync, /userId !== uid\) return/);
assert.match(notes, /openDB\(`\$\{DB_NAME\}:\$\{encodeURIComponent\(owner\)\}`/);
assert.match(notes, /record\.userId === currentOwner\(\)/);
assert.match(notes, /Notes owner changed during/);
assert.match(notes, /updateNoteForOwner\(owner: string/);
assert.match(auth, /setRepositoryOwner\(storageOwnerFor\(next\)\)/);
assert.match(focusNotes, /clockit-focus-note-draft/);
assert.match(focusNotes, /updateNoteForOwner\(owner, noteId/);
assert.match(homepage, /Your time\.<br \/>Your space\.<br \/><em>Your pace\./);
assert.doesNotMatch(homepage, /SOC 2|GDPR|Datadog|Monzo|Sprint velocity|Jira|Linear/i);

console.log('Hotfix 03 isolation checks passed (owner-scoped storage runtime + queue/IndexedDB/auth guards).');
console.log('Note: these are local unit/source-guard checks; no browser, Supabase, or real IndexedDB integration ran.');
