import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus2, Layers2, PencilLine, RefreshCw } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { noteFolderRepository, noteRepository } from '../../services/repositories';
import { getStorageOwner, localStore, scopedStorageKey } from '../../services/repositories/storage';
import { notesStorage, type NoteFolder, type NoteItem } from '../../services/notesStorage';
import { NotesEditor } from '../notes/NotesEditor';
import { markOwnerLocalChange } from '../../services/cloud';

type NoteSaveState = 'saved' | 'saving' | 'error';
type FocusNoteView = 'notes' | 'session';
interface FocusNoteDraft { owner: string; noteId: string; content: string; updatedAt: number }

export const FocusNotesPanel: React.FC = () => {
  const { user, isDemo } = useAuth();
  const owner = isDemo ? 'demo' : user ? `user:${user.id}` : 'local';
  const [view, setView] = useState<FocusNoteView>('notes');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<NoteSaveState>('saved');
  const pendingContent = useRef<{ owner: string; noteId: string; content: string } | null>(null);
  const pendingTitle = useRef<{ owner: string; noteId: string; title: string } | null>(null);
  const saveQueues = useRef(new Map<string, Promise<NoteItem>>());
  const loadToken = useRef(0);

  const loadNotes = useCallback(async () => {
    const token = ++loadToken.current;
    setLoading(true);
    setLoadError(false);
    setNotes([]);
    setFolders([]);
    setActiveNoteId('');
    setSaveState('saved');
    pendingContent.current = null;
    pendingTitle.current = null;
    try {
      await noteRepository.init();
      const [loadedNotes, loadedFolders] = await Promise.all([
        noteRepository.getAll(),
        noteFolderRepository.getAll(),
      ]);
      if (token !== loadToken.current || getStorageOwner() !== owner) return;
      const draft = localStore.readJson<FocusNoteDraft>(scopedStorageKey('clockit-focus-note-draft', owner));
      const restoredNotes = draft.status === 'ok' && draft.value.owner === owner
        ? loadedNotes.map((note) => note.id === draft.value.noteId ? { ...note, content: draft.value.content } : note)
        : loadedNotes;
      setNotes(restoredNotes);
      setFolders(loadedFolders);
      const restoredDraft = draft.status === 'ok' && draft.value.owner === owner
        ? restoredNotes.find((note) => note.id === draft.value.noteId)
        : undefined;
      if (restoredDraft && draft.status === 'ok') {
        pendingContent.current = { owner, noteId: restoredDraft.id, content: draft.value.content };
        setSaveState('error');
      }
      const firstNote = restoredDraft ?? restoredNotes.find((note) => note.tags?.includes('#focus-session')) ?? restoredNotes[0];
      setActiveNoteId(firstNote?.id ?? '');
    } catch (error) {
      console.error('[clockit/focus-notes] Could not load notes', error);
      if (token === loadToken.current) setLoadError(true);
    } finally {
      if (token === loadToken.current) setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    void loadNotes();
    return () => { loadToken.current += 1; };
  }, [loadNotes]);

  useEffect(() => {
    const refresh = async () => {
      if (getStorageOwner() !== owner) return;
      try {
        const [latestNotes, latestFolders] = await Promise.all([
          noteRepository.getAll(),
          noteFolderRepository.getAll(),
        ]);
        if (getStorageOwner() !== owner) return;
        setNotes((current) => {
          const pending = pendingContent.current;
          if (!pending || pending.owner !== owner) return latestNotes;
          return latestNotes.map((note) => note.id === pending.noteId
            ? { ...note, content: pending.content }
            : note);
        });
        setFolders(latestFolders);
        setActiveNoteId((current) => latestNotes.some((note) => note.id === current)
          ? current
          : latestNotes[0]?.id ?? '');
      } catch (error) {
        console.error('[clockit/focus-notes] Could not refresh notes', error);
      }
    };
    const unsubscribeNotes = noteRepository.subscribe(() => { void refresh(); });
    const unsubscribeFolders = noteFolderRepository.subscribe(() => { void refresh(); });
    return () => { unsubscribeNotes(); unsubscribeFolders(); };
  }, [owner]);

  const visibleNotes = useMemo(
    () => (view === 'session' ? notes.filter((note) => note.tags?.includes('#focus-session')) : notes),
    [notes, view],
  );
  const activeNote = visibleNotes.find((note) => note.id === activeNoteId) ?? null;

  useEffect(() => {
    if (activeNoteId && visibleNotes.some((note) => note.id === activeNoteId)) return;
    setActiveNoteId(visibleNotes[0]?.id ?? '');
  }, [activeNoteId, visibleNotes]);

  const createNote = async () => {
    setSaveState('saving');
    try {
      let folder = folders.find((item) => item.name.toLowerCase() === 'focus notes');
      if (!folder) {
        folder = await noteFolderRepository.create('Focus Notes', '#879d6c');
        setFolders((current) => [...current, folder!]);
      }
      const title = view === 'session'
        ? `Focus session · ${new Date().toLocaleDateString()}`
        : 'Untitled note';
      let created = await noteRepository.create(folder.id, title);
      if (view === 'session') {
        created = await noteRepository.update(created.id, { tags: ['#focus-session'] });
      }
      setNotes((current) => [created, ...current]);
      setActiveNoteId(created.id);
      setSaveState('saved');
    } catch (error) {
      console.error('[clockit/focus-notes] Could not create note', error);
      setSaveState('error');
    }
  };

  const saveContent = async (noteId: string, content: string) => {
    const pending = { owner, noteId, content };
    pendingContent.current = pending;
    const draftKey = scopedStorageKey('clockit-focus-note-draft', owner);
    localStore.writeJson<FocusNoteDraft>(draftKey, { owner, noteId, content, updatedAt: Date.now() });
    setSaveState('saving');
    try {
      const queueKey = `${owner}:${noteId}`;
      const previous = saveQueues.current.get(queueKey);
      const operation = (previous ? previous.catch(() => undefined) : Promise.resolve())
        .then(() => notesStorage.updateNoteForOwner(owner, noteId, { content }));
      saveQueues.current.set(queueKey, operation);
      const updated = await operation;
      if (saveQueues.current.get(`${owner}:${noteId}`) === operation) saveQueues.current.delete(`${owner}:${noteId}`);
      if (owner.startsWith('user:')) markOwnerLocalChange(owner.slice('user:'.length));
      const currentDraft = localStore.readJson<FocusNoteDraft>(draftKey);
      if (currentDraft.status === 'ok' && currentDraft.value.content === content) localStore.remove(draftKey);
      if (getStorageOwner() === owner) {
        noteRepository.refreshFromStorage();
        setNotes((current) => current.map((note) => note.id === updated.id
          ? pendingContent.current?.owner === owner && pendingContent.current.noteId === note.id
            ? { ...note, content: pendingContent.current.content }
            : updated
          : note));
      }
      if (pendingContent.current === pending) {
        pendingContent.current = null;
        if (getStorageOwner() === owner) setSaveState('saved');
      }
    } catch (error) {
      console.error('[clockit/focus-notes] Could not save note', error);
      if (getStorageOwner() === owner) setSaveState('error');
    }
  };

  const retrySave = () => {
    const pending = pendingContent.current;
    if (pending && pending.owner === owner) {
      void saveContent(pending.noteId, pending.content);
      return;
    }
    const title = pendingTitle.current;
    if (title && title.owner === owner) void saveTitle(title.title, title.noteId);
  };

  const saveTitle = async (title: string, targetId = activeNote?.id) => {
    const target = notes.find((note) => note.id === targetId);
    if (!target || title === target.title) return;
    pendingTitle.current = { owner, noteId: target.id, title };
    setSaveState('saving');
    try {
      const updated = await notesStorage.updateNoteForOwner(owner, target.id, { title: title.trim() || 'Untitled note' });
      if (owner.startsWith('user:')) markOwnerLocalChange(owner.slice('user:'.length));
      if (getStorageOwner() === owner) {
        noteRepository.refreshFromStorage();
        setNotes((current) => current.map((note) => note.id === updated.id ? updated : note));
      }
      if (pendingTitle.current?.title === title && pendingTitle.current.noteId === target.id) {
        pendingTitle.current = null;
        if (getStorageOwner() === owner) setSaveState('saved');
      }
    } catch (error) {
      console.error('[clockit/focus-notes] Could not save note title', error);
      if (getStorageOwner() === owner) setSaveState('error');
    }
  };

  return (
    <aside className="focus-notes-panel focus-notes-live" aria-label="Focus notes">
      <div className="focus-notes-header">
        <div className="focus-notes-tabs" role="tablist" aria-label="Note type">
          <button type="button" role="tab" aria-selected={view === 'notes'} className={`focus-notes-tab${view === 'notes' ? ' is-active' : ''}`} onClick={() => setView('notes')}>
            <PencilLine size={15} /> Notes
          </button>
          <button type="button" role="tab" aria-selected={view === 'session'} className={`focus-notes-tab${view === 'session' ? ' is-active' : ''}`} onClick={() => setView('session')}>
            <Layers2 size={16} /> Session Notes
          </button>
        </div>
        <button type="button" className="focus-notes-create" onClick={() => void createNote()} aria-label={view === 'session' ? 'Create session note' : 'Create note'} title="Create note">
          <FilePlus2 size={17} />
        </button>
      </div>

      {loading ? (
        <div className="focus-notes-message" role="status">Loading notes…</div>
      ) : loadError ? (
        <div className="focus-notes-message is-error" role="alert">
          <span>Notes could not be loaded. Your saved content was not changed.</span>
          <button type="button" onClick={() => void loadNotes()}><RefreshCw size={14} /> Retry</button>
        </div>
      ) : activeNote ? (
        <>
          <div className="focus-note-title-row">
            <input
              key={`${owner}:${activeNote.id}:${activeNote.title}`}
              aria-label="Note title"
              defaultValue={activeNote.title}
              onBlur={(event) => void saveTitle(event.currentTarget.value)}
            />
            <select
              aria-label="Choose note"
              value={activeNote.id}
              onChange={(event) => setActiveNoteId(event.target.value)}
            >
              {visibleNotes.map((note) => <option key={note.id} value={note.id}>{note.title || 'Untitled note'}</option>)}
            </select>
          </div>
          <div className="focus-notes-editor-wrap">
            <NotesEditor
              key={`${owner}:${activeNote.id}`}
              initialContent={activeNote.content}
              noteId={activeNote.id}
              allNotes={notes}
              onChange={(content) => void saveContent(activeNote.id, content)}
              onNavigateToNote={(title) => {
                const match = visibleNotes.find((note) => note.title.toLowerCase().trim() === title.toLowerCase().trim());
                if (match) setActiveNoteId(match.id);
              }}
              isSaving={saveState === 'saving'}
              saveError={saveState === 'error'}
            />
          </div>
          {saveState === 'error' && (
            <div className="focus-notes-error" role="alert">
              <span>Save failed. Your editor content is still here.</span>
              <button type="button" onClick={retrySave}>Retry save</button>
            </div>
          )}
          {typeof navigator !== 'undefined' && navigator.onLine === false && saveState === 'saved' && (
            <div className="focus-notes-offline" role="status">Saved on this device · will sync when online</div>
          )}
        </>
      ) : (
        <div className="focus-notes-empty">
          <p>{view === 'session' ? 'No session notes yet.' : 'Your notes will appear here.'}</p>
          <button type="button" onClick={() => void createNote()}><FilePlus2 size={15} /> Create a note</button>
        </div>
      )}
    </aside>
  );
};

export default FocusNotesPanel;
