import { notesStorage, type GraphLink, type GraphNode, type NoteFolder, type NoteItem } from '../notesStorage';
import { crossTab, NOTES_SCOPE } from './crossTab';
import { LocalJsonStore, ObservableRepository } from './storage';
import type { NoteFolderRepository, NoteRepository } from './types';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value);

const QUICK_NOTES_KEY = 'clockit_quick_notes';

/**
 * IndexedDB backed note repository.
 *
 * IndexedDB has no `storage` event, so every mutation is announced on the
 * cross-tab channel instead — that is how a note edited here shows up in
 * another open tab. Quick notes are a small local-storage companion list, so
 * they ride the ordinary `storage` event as well.
 */
export class LocalNoteRepository extends ObservableRepository implements NoteRepository {
  readonly keys = [NOTES_SCOPE, QUICK_NOTES_KEY];

  private readonly quickNotes = new LocalJsonStore<string[]>(
    QUICK_NOTES_KEY,
    [],
    isStringArray,
  );

  init(): Promise<void> {
    return notesStorage.init();
  }

  getAll(): Promise<NoteItem[]> {
    return notesStorage.getAllNotes();
  }

  getTrash(): Promise<NoteItem[]> {
    return notesStorage.getTrashNotes();
  }

  getById(id: string): Promise<NoteItem | undefined> {
    return notesStorage.getNoteById(id);
  }

  async create(folderId?: string, title?: string): Promise<NoteItem> {
    const note = await notesStorage.createNote(folderId, title);
    this.announce();
    return note;
  }

  async update(id: string, updates: Partial<NoteItem>): Promise<NoteItem> {
    const note = await notesStorage.updateNote(id, updates);
    this.announce();
    return note;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const result = await notesStorage.toggleFavorite(id);
    this.announce();
    return result;
  }

  async moveToTrash(id: string): Promise<void> {
    await notesStorage.moveToTrash(id);
    this.announce();
  }

  async restoreFromTrash(id: string): Promise<void> {
    await notesStorage.restoreFromTrash(id);
    this.announce();
  }

  async deletePermanently(id: string): Promise<void> {
    await notesStorage.deletePermanently(id);
    this.announce();
  }

  extractInternalLinks(content: string): string[] {
    return notesStorage.extractInternalLinks(content);
  }

  buildKnowledgeGraph(
    notes: NoteItem[],
    folders: NoteFolder[],
  ): { nodes: GraphNode[]; links: GraphLink[] } {
    return notesStorage.buildKnowledgeGraph(notes, folders);
  }

  getBacklinks(notes: NoteItem[], targetTitle: string): NoteItem[] {
    return notesStorage.getBacklinks(notes, targetTitle);
  }

  getQuickNotes(): string[] {
    return [...this.quickNotes.value];
  }

  addQuickNote(note: string): string[] {
    const trimmed = note.trim();
    if (!trimmed) return this.getQuickNotes();
    this.quickNotes.save([trimmed, ...this.quickNotes.value]);
    this.emit();
    return this.getQuickNotes();
  }

  updateQuickNote(index: number, content: string): string[] {
    const trimmed = content.trim();
    const current = [...this.quickNotes.value];
    if (index < 0 || index >= current.length || !trimmed) return this.getQuickNotes();
    current[index] = trimmed;
    this.quickNotes.save(current);
    this.emit();
    return this.getQuickNotes();
  }

  deleteQuickNote(index: number): string[] {
    const current = [...this.quickNotes.value];
    if (index < 0 || index >= current.length) return this.getQuickNotes();
    current.splice(index, 1);
    this.quickNotes.save(current);
    this.emit();
    return this.getQuickNotes();
  }

  setQuickNotes(notes: string[]): string[] {
    const cleaned = notes.map((n) => n.trim()).filter(Boolean);
    this.quickNotes.save(cleaned);
    this.emit();
    return this.getQuickNotes();
  }

  refreshFromStorage(): boolean {
    this.quickNotes.refresh();
    this.emit();
    return true;
  }

  private announce(): void {
    crossTab.broadcast(NOTES_SCOPE);
    this.emit();
  }
}

/** IndexedDB backed note-folder repository. Shares the notebook database. */
export class LocalNoteFolderRepository
  extends ObservableRepository
  implements NoteFolderRepository
{
  readonly keys = [NOTES_SCOPE];

  async getAll(): Promise<NoteFolder[]> {
    return notesStorage.getAllFolders();
  }

  async create(name: string, color = '#3b82f6', parentId: string | null = null): Promise<NoteFolder> {
    const folder = await notesStorage.createFolder(name, color, parentId);
    crossTab.broadcast(NOTES_SCOPE);
    this.emit();
    return folder;
  }

  async rename(id: string, newName: string): Promise<void> {
    await notesStorage.renameFolder(id, newName);
    crossTab.broadcast(NOTES_SCOPE);
    this.emit();
  }

  async remove(id: string): Promise<void> {
    await notesStorage.deleteFolder(id);
    crossTab.broadcast(NOTES_SCOPE);
    this.emit();
  }

  refreshFromStorage(): boolean {
    this.emit();
    return false;
  }
}
