import { openDB, IDBPDatabase } from 'idb';

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  folderId: string;
  content: string; // Rich HTML content
  tags: string[];
  isFavorite: boolean;
  isTrash: boolean;
  isTemplate: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GraphNode {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  folderName?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

const DB_NAME = 'clockit-notes-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('parentId', 'parentId');
        }
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('folderId', 'folderId');
          noteStore.createIndex('isFavorite', 'isFavorite');
          noteStore.createIndex('isTrash', 'isTrash');
          noteStore.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
};

// Default seed data matching ClockIt's visual reference
const DEFAULT_FOLDERS: NoteFolder[] = [
  { id: 'f-personal', name: 'Personal', color: '#f59e0b', parentId: null, createdAt: Date.now() - 300000 },
  { id: 'f-personal-ideas', name: 'Ideas', color: '#f59e0b', parentId: 'f-personal', createdAt: Date.now() - 290000 },
  { id: 'f-personal-goals', name: 'Goals', color: '#f59e0b', parentId: 'f-personal', createdAt: Date.now() - 280000 },
  { id: 'f-personal-journal', name: 'Journal', color: '#f59e0b', parentId: 'f-personal', createdAt: Date.now() - 270000 },

  { id: 'f-dev', name: 'Development', color: '#3b82f6', parentId: null, createdAt: Date.now() - 260000 },
  { id: 'f-dev-webdev', name: 'Web Dev', color: '#10b981', parentId: 'f-dev', createdAt: Date.now() - 250000 },
  { id: 'f-dev-projects', name: 'Projects', color: '#3b82f6', parentId: 'f-dev', createdAt: Date.now() - 240000 },
  { id: 'f-dev-resources', name: 'Resources', color: '#3b82f6', parentId: 'f-dev', createdAt: Date.now() - 230000 },

  { id: 'f-college', name: 'College', color: '#8b5cf6', parentId: null, createdAt: Date.now() - 220000 },
  { id: 'f-freelance', name: 'Freelance', color: '#f97316', parentId: null, createdAt: Date.now() - 210000 },
];

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'n-clockit-features',
    title: 'ClockIt Features',
    folderId: 'f-dev-webdev',
    tags: ['#product', '#ideas', '#development'],
    isFavorite: true,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 3600000,
    content: `
      <h2>Feature Ideas</h2>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Task management with deadlines &amp; prioritization</p></div></li>
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Focus timer with ambient audio &amp; session analytics</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Notes with rich text, tables, and code embeds</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Knowledge graph view connecting [[UI Ideas]] and [[Tech Stack]]</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Multiple workspaces for [[Task Management]] and [[Habit Tracker]]</p></div></li>
      </ul>
      <p>Refer to the [[Release Plan]] for launch milestones and dependencies.</p>
      <h3>Development Stack</h3>
      <pre><code>const features = [
  'Tasks',
  'Notes',
  'Focus Timer',
  'Habits',
  'Analytics'
];</code></pre>
      <h3>Ideas Table</h3>
      <table>
        <tbody>
          <tr>
            <th>Feature</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
          <tr>
            <td>Task reminders</td>
            <td>High</td>
            <td>In Progress</td>
            <td>Add notifications</td>
          </tr>
          <tr>
            <td>Notes (Obsidian like)</td>
            <td>High</td>
            <td>In Progress</td>
            <td>Rich editor + graph</td>
          </tr>
          <tr>
            <td>Habit tracker</td>
            <td>Medium</td>
            <td>Not Started</td>
            <td>Keep it simple</td>
          </tr>
          <tr>
            <td>Calendar integration</td>
            <td>Medium</td>
            <td>Not Started</td>
            <td>Google Calendar (later)</td>
          </tr>
          <tr>
            <td>Themes (Dark/Light)</td>
            <td>Low</td>
            <td>Done</td>
            <td>Basic setup complete</td>
          </tr>
        </tbody>
      </table>
    `.trim(),
  },
  {
    id: 'n-ui-ideas',
    title: 'UI Ideas',
    folderId: 'f-dev-webdev',
    tags: ['#design', '#ui'],
    isFavorite: true,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 50000,
    content: `
      <h2>UI &amp; Design System</h2>
      <p>Clean warm cream theme and charcoal dark mode with sage green accents.</p>
      <p>Connects with [[ClockIt Features]] for interactive views and [[Release Plan]].</p>
    `.trim(),
  },
  {
    id: 'n-tech-stack',
    title: 'Tech Stack',
    folderId: 'f-dev-resources',
    tags: ['#tech', '#architecture'],
    isFavorite: false,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 40000,
    content: `
      <h2>Technology Stack</h2>
      <p>React 19, TypeScript, Tiptap editor, IndexedDB local persistence, Lucide icons.</p>
      <p>Feeds into [[ClockIt Features]] architecture.</p>
    `.trim(),
  },
  {
    id: 'n-task-management',
    title: 'Task Management',
    folderId: 'f-dev-projects',
    tags: ['#tasks', '#productivity'],
    isFavorite: true,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 70000,
    updatedAt: Date.now() - 30000,
    content: `
      <h2>Task Management Module</h2>
      <p>Prioritized matrix, deadline warnings, and category tagging.</p>
      <p>Designed alongside [[ClockIt Features]] and [[Habit Tracker]].</p>
    `.trim(),
  },
  {
    id: 'n-habit-tracker',
    title: 'Habit Tracker',
    folderId: 'f-personal-goals',
    tags: ['#habits', '#wellness'],
    isFavorite: false,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 20000,
    content: `
      <h2>Habits &amp; Consistency</h2>
      <p>Daily circular rings tracking completion across routines.</p>
      <p>Linked to [[ClockIt Features]] overview.</p>
    `.trim(),
  },
  {
    id: 'n-release-plan',
    title: 'Release Plan',
    folderId: 'f-dev-projects',
    tags: ['#roadmap', '#release'],
    isFavorite: true,
    isTrash: false,
    isTemplate: false,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 10000,
    content: `
      <h2>ClockIt Release Plan</h2>
      <p>Beta release target with full offline IndexedDB support for [[ClockIt Features]].</p>
      <p>Coordinates with [[UI Ideas]] for final polish.</p>
    `.trim(),
  },
];

export const notesStorage = {
  async init(): Promise<void> {
    const db = await getDB();
    const folderCount = await db.count('folders');
    if (folderCount === 0) {
      const tx = db.transaction(['folders', 'notes'], 'readwrite');
      for (const folder of DEFAULT_FOLDERS) {
        await tx.objectStore('folders').put(folder);
      }
      for (const note of DEFAULT_NOTES) {
        await tx.objectStore('notes').put(note);
      }
      await tx.done;
    }
  },

  async getAllFolders(): Promise<NoteFolder[]> {
    const db = await getDB();
    return db.getAll('folders');
  },

  async createFolder(name: string, color = '#3b82f6', parentId: string | null = null): Promise<NoteFolder> {
    const db = await getDB();
    const folder: NoteFolder = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      color,
      parentId,
      createdAt: Date.now(),
    };
    await db.put('folders', folder);
    return folder;
  },

  async renameFolder(id: string, newName: string): Promise<void> {
    const db = await getDB();
    const folder = await db.get('folders', id);
    if (folder) {
      folder.name = newName.trim();
      await db.put('folders', folder);
    }
  },

  async deleteFolder(id: string): Promise<void> {
    const db = await getDB();
    // Move notes in this folder to personal or default folder
    const notes = await db.getAll('notes');
    const tx = db.transaction(['folders', 'notes'], 'readwrite');
    for (const note of notes) {
      if (note.folderId === id) {
        note.folderId = 'f-personal';
        await tx.objectStore('notes').put(note);
      }
    }
    await tx.objectStore('folders').delete(id);
    await tx.done;
  },

  async getAllNotes(): Promise<NoteItem[]> {
    const db = await getDB();
    const all = await db.getAll('notes');
    return all.filter((n) => !n.isTrash);
  },

  async getTrashNotes(): Promise<NoteItem[]> {
    const db = await getDB();
    const all = await db.getAll('notes');
    return all.filter((n) => n.isTrash);
  },

  async getNoteById(id: string): Promise<NoteItem | undefined> {
    const db = await getDB();
    return db.get('notes', id);
  },

  async createNote(folderId = 'f-dev-webdev', title = 'Untitled Note'): Promise<NoteItem> {
    const db = await getDB();
    const newNote: NoteItem = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      folderId,
      content: '<p>Start typing or use <strong>[[Note Title]]</strong> to create links...</p>',
      tags: ['#note'],
      isFavorite: false,
      isTrash: false,
      isTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.put('notes', newNote);
    return newNote;
  },

  async updateNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem> {
    const db = await getDB();
    const existing = await db.get('notes', id);
    if (!existing) throw new Error(`Note ${id} not found`);

    const updated: NoteItem = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    await db.put('notes', updated);
    return updated;
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const db = await getDB();
    const note = await db.get('notes', id);
    if (!note) return false;
    note.isFavorite = !note.isFavorite;
    note.updatedAt = Date.now();
    await db.put('notes', note);
    return note.isFavorite;
  },

  async moveToTrash(id: string): Promise<void> {
    const db = await getDB();
    const note = await db.get('notes', id);
    if (note) {
      note.isTrash = true;
      note.updatedAt = Date.now();
      await db.put('notes', note);
    }
  },

  async restoreFromTrash(id: string): Promise<void> {
    const db = await getDB();
    const note = await db.get('notes', id);
    if (note) {
      note.isTrash = false;
      note.updatedAt = Date.now();
      await db.put('notes', note);
    }
  },

  async deletePermanently(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('notes', id);
  },

  // Parse [[Note Title]] internal links from HTML content
  extractInternalLinks(content: string): string[] {
    const matches: string[] = [];
    const regex = /\[\[([a-zA-Z0-9_\-\s]+)\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const linkTitle = match[1].trim();
      if (linkTitle && !matches.includes(linkTitle)) {
        matches.push(linkTitle);
      }
    }
    return matches;
  },

  // Build actual knowledge graph nodes and real links from existing notes and their internal links
  buildKnowledgeGraph(notes: NoteItem[], folders: NoteFolder[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const activeNotes = notes.filter((n) => !n.isTrash);
    const count = activeNotes.length;

    // Distribute nodes in a pleasing circular layout around the center
    const width = 360;
    const height = 260;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = 130;
    const radiusY = 85;

    const folderMap = new Map(folders.map((f) => [f.id, f]));

    const nodes: GraphNode[] = activeNotes.map((note, index) => {
      const folder = folderMap.get(note.folderId);
      const angle = (index / Math.max(1, count)) * 2 * Math.PI - Math.PI / 2;
      const isFirst = index === 0;

      return {
        id: note.id,
        label: note.title,
        color: folder?.color || '#3b82f6',
        x: isFirst ? centerX : Math.round(centerX + radiusX * Math.cos(angle)),
        y: isFirst ? centerY : Math.round(centerY + radiusY * Math.sin(angle)),
        folderName: folder?.name || 'General',
      };
    });

    const links: GraphLink[] = [];
    const titleToId = new Map(activeNotes.map((n) => [n.title.toLowerCase().trim(), n.id]));

    activeNotes.forEach((sourceNote) => {
      const targetTitles = this.extractInternalLinks(sourceNote.content);
      targetTitles.forEach((targetTitle) => {
        const targetId = titleToId.get(targetTitle.toLowerCase().trim());
        if (targetId && targetId !== sourceNote.id) {
          const exists = links.some(
            (l) =>
              (l.source === sourceNote.id && l.target === targetId) ||
              (l.source === targetId && l.target === sourceNote.id)
          );
          if (!exists) {
            links.push({ source: sourceNote.id, target: targetId });
          }
        }
      });
    });

    return { nodes, links };
  },

  // Find all notes linking to targetTitle
  getBacklinks(notes: NoteItem[], targetTitle: string): NoteItem[] {
    const targetNorm = targetTitle.toLowerCase().trim();
    return notes.filter((note) => {
      if (note.title.toLowerCase().trim() === targetNorm) return false;
      const links = this.extractInternalLinks(note.content);
      return links.some((l) => l.toLowerCase().trim() === targetNorm);
    });
  },
};
