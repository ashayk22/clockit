import { type Workspace } from '../../data/mockData';
import { LocalJsonStore, ObservableRepository, scopedStorageKey } from './storage';
import type { WorkspaceRepository } from './types';

const isWorkspaceArray = (value: unknown): value is Workspace[] => Array.isArray(value);

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `ws-${Date.now()}`;

/** Local-storage backed workspace repository (`clockit_workspaces`). */
export class LocalWorkspaceRepository extends ObservableRepository implements WorkspaceRepository {
  get keys(): readonly string[] { return [scopedStorageKey('clockit_workspaces')]; }

  private readonly store = new LocalJsonStore<Workspace[]>(
    'clockit_workspaces',
    [],
    isWorkspaceArray,
  );

  getAll(): Workspace[] {
    return [...this.store.value];
  }

  getById(id: string): Workspace | undefined {
    if (!id) return undefined;
    return this.store.value.find((workspace) => workspace.id === id);
  }

  create(data: Partial<Workspace> & { name: string }): Workspace {
    const name = data.name.trim();
    if (!name) throw new Error('Workspace name is required.');
    if (this.store.value.some((workspace) => workspace.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A workspace named "${name}" already exists.`);
    }
    const baseId = slugify(name);
    let id = baseId;
    let n = 1;
    while (this.store.value.some((ws) => ws.id === id)) {
      id = `${baseId}-${++n}`;
    }
    const workspace: Workspace = {
      ...data,
      id,
      name,
      color: data.color || '#6b7280',
      description: data.description?.trim() || undefined,
      icon: data.icon,
      cover: data.cover,
    };
    this.store.save([...this.store.value, workspace]);
    this.emit();
    return workspace;
  }

  update(id: string, updates: Partial<Workspace>): Workspace | undefined {
    const current = this.store.value.find((ws) => ws.id === id);
    if (!current) return undefined;
    const name = updates.name !== undefined ? updates.name.trim() : current.name;
    if (!name) throw new Error('Workspace name is required.');
    if (
      this.store.value.some(
        (workspace) => workspace.id !== id && workspace.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error(`A workspace named "${name}" already exists.`);
    }
    const next: Workspace = {
      ...current,
      ...updates,
      id: current.id, // id is immutable
      name,
      description:
        updates.description !== undefined
          ? updates.description.trim() || undefined
          : current.description,
    };
    const list = this.store.value.map((ws) => (ws.id === id ? next : ws));
    this.store.save(list);
    this.emit();
    return next;
  }

  /** Removes the workspace entry. Tasks keep their `workspace` name and are
   *  not touched, so no user data is silently destroyed. */
  remove(id: string): void {
    const list = this.store.value.filter((ws) => ws.id !== id);
    this.store.save(list);
    this.emit();
  }

  refreshFromStorage(): boolean {
    this.store.refresh();
    this.emit();
    return true;
  }
}
