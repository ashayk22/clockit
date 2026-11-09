import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Share2,
  Folder as FolderIcon,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  Star,
  Trash2,
  FileText,
  Bookmark,
  X,
  ExternalLink,
  Hash,
} from 'lucide-react';
import { notesStorage, NoteFolder, NoteItem, GraphNode, GraphLink } from '../../services/notesStorage';
import { NotesEditor } from '../notes/NotesEditor';

export const NotesPage: React.FC = () => {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('f-dev-webdev');
  const [selectedView, setSelectedView] = useState<'all' | 'favorites' | 'templates' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'graph' | 'backlinks' | 'mentions'>('graph');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // IndexedDB reads are async, so the list gets a brief loading state instead
  // of flashing "No notes found" before the first load resolves.
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Folder accordion collapse states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-personal': true,
    'f-dev': true,
    'f-college': false,
    'f-freelance': false,
  });

  // Modal / prompt dialog states
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Mobile / small tablet view switcher
  const [mobileTab, setMobileTab] = useState<'nav' | 'editor' | 'graph'>('editor');

  // Escape closes whichever dialog is open — the shared modal affordance.
  useEffect(() => {
    if (!isNewFolderOpen && !noteToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNewFolderOpen(false);
        setNoteToDelete(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isNewFolderOpen, noteToDelete]);

  // Initialize IndexedDB and load data
  useEffect(() => {
    let isMounted = true;
    const initAndLoad = async () => {
      try {
        await notesStorage.init();
        const [loadedFolders, loadedNotes] = await Promise.all([
          notesStorage.getAllFolders(),
          notesStorage.getAllNotes(),
        ]);
        if (isMounted) {
          setFolders(loadedFolders);
          setNotes(loadedNotes);
          if (loadedNotes.length > 0 && !activeNoteId) {
            // Default to 'ClockIt Features' or first available note
            const defaultNote = loadedNotes.find((n) => n.id === 'n-clockit-features') || loadedNotes[0];
            setActiveNoteId(defaultNote.id);
            setSelectedFolderId(defaultNote.folderId);
          }
        }
      } catch (err) {
        console.error('Failed to initialize notes storage:', err);
      } finally {
        if (isMounted) setIsLoadingNotes(false);
      }
    };
    initAndLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  // Currently active note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId);
  }, [notes, activeNoteId]);

  // Hierarchical folder structure: parent folders (parentId === null) and their children
  const rootFolders = useMemo(() => folders.filter((f) => !f.parentId), [folders]);
  const getSubFolders = (parentId: string) => folders.filter((f) => f.parentId === parentId);

  // Filter notes for the list
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (selectedView === 'trash') {
      result = result.filter((n) => n.isTrash);
    } else {
      result = result.filter((n) => !n.isTrash);

      if (selectedView === 'favorites') {
        result = result.filter((n) => n.isFavorite);
      } else if (selectedView === 'templates') {
        result = result.filter((n) => n.isTemplate);
      } else if (selectedFolderId) {
        // Match this folder or any child subfolder
        const childFolderIds = folders.filter((f) => f.parentId === selectedFolderId).map((f) => f.id);
        const folderIds = [selectedFolderId, ...childFolderIds];
        result = result.filter((n) => folderIds.includes(n.folderId));
      }
    }

    if (selectedTag) {
      result = result.filter((n) => n.tags && n.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [notes, selectedView, selectedFolderId, selectedTag, searchQuery, folders]);

  // Counts for Quick Views
  const allNotesCount = useMemo(() => notes.filter((n) => !n.isTrash).length, [notes]);
  const favoritesCount = useMemo(() => notes.filter((n) => !n.isTrash && n.isFavorite).length, [notes]);
  const templatesCount = useMemo(() => notes.filter((n) => !n.isTrash && n.isTemplate).length, [notes]);
  const trashCount = useMemo(() => notes.filter((n) => n.isTrash).length, [notes]);

  // Every tag currently used by a live note, for the tag filter
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.filter((n) => !n.isTrash).forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  // Knowledge graph data computed from actual notes & real [[links]]
  const { nodes: graphNodes, links: graphLinks } = useMemo(() => {
    return notesStorage.buildKnowledgeGraph(notes, folders);
  }, [notes, folders]);

  // Backlinks for active note
  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notesStorage.getBacklinks(notes, activeNote.title);
  }, [notes, activeNote]);

  // Internal links contained in active note
  const internalLinkedTitles = useMemo(() => {
    if (!activeNote) return [];
    return notesStorage.extractInternalLinks(activeNote.content);
  }, [activeNote]);

  // Actions
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    setMobileTab('editor');
  };

  const handleCreateNote = async (folderId?: string) => {
    const targetFolder = folderId || selectedFolderId || folders[0]?.id || 'f-dev-webdev';
    const newNote = await notesStorage.createNote(targetFolder, 'Untitled Note');
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setSelectedFolderId(targetFolder);
    setSelectedView('all');
    setMobileTab('editor');
  };

  const handleContentChange = async (newContent: string) => {
    if (!activeNoteId) return;
    setIsSaving(true);
    try {
      const updated = await notesStorage.updateNote(activeNoteId, { content: newContent });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!activeNoteId) return;
    setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? { ...n, title: newTitle } : n)));
    try {
      await notesStorage.updateNote(activeNoteId, { title: newTitle });
    } catch (err) {
      console.error('Error renaming note:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeNoteId) return;
    const isFav = await notesStorage.toggleFavorite(activeNoteId);
    setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? { ...n, isFavorite: isFav } : n)));
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNote) return;
    if (activeNote.isTrash) {
      // Permanent deletion
      await notesStorage.deletePermanently(activeNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
    } else {
      await notesStorage.moveToTrash(activeNote.id);
      setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, isTrash: true } : n)));
    }
    setNoteToDelete(null);
    const remaining = notes.filter((n) => n.id !== activeNote.id && !n.isTrash);
    if (remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    }
  };

  const handleNavigateToNoteTitle = async (title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (existing) {
      setActiveNoteId(existing.id);
    } else {
      // Create referenced note if doesn't exist
      const newNote = await notesStorage.createNote(selectedFolderId || 'f-dev-webdev', title);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
    setMobileTab('editor');
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !activeNote) return;
    let tag = newTagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;
    const existingTags = activeNote.tags || [];
    if (!existingTags.includes(tag)) {
      const updatedTags = [...existingTags, tag];
      const updated = await notesStorage.updateNote(activeNote.id, { tags: updatedTags });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeNote) return;
    const updatedTags = activeNote.tags.filter((t) => t !== tagToRemove);
    const updated = await notesStorage.updateNote(activeNote.id, { tags: updatedTags });
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder = await notesStorage.createFolder(newFolderName, newFolderColor, newFolderParentId);
    setFolders((prev) => [...prev, folder]);
    setSelectedFolderId(folder.id);
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  const toggleFolderAccordion = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Breadcrumb path for current note
  const breadcrumb = useMemo(() => {
    if (!activeNote) return 'Notes';
    const folder = folders.find((f) => f.id === activeNote.folderId);
    if (!folder) return `Notes / ${activeNote.title}`;
    if (folder.parentId) {
      const parent = folders.find((f) => f.id === folder.parentId);
      return `${parent?.name || 'Folder'} / ${folder.name} / ${activeNote.title}`;
    }
    return `${folder.name} / ${activeNote.title}`;
  }, [activeNote, folders]);

  return (
    <div className="clockit-page-container clockit-notes-page">
      {/* Mobile / tablet panel switcher */}
      <div className="clockit-filter-pills clockit-notes-mobile-tabs">
        <button
          type="button"
          className={`clockit-filter-pill ${mobileTab === 'nav' ? 'active' : ''}`}
          onClick={() => {
            setIsLeftPanelOpen(true);
            setMobileTab('nav');
          }}
        >
          Folders &amp; Notes
        </button>
        <button
          type="button"
          className={`clockit-filter-pill ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          Editor
        </button>
        <button
          type="button"
          className={`clockit-filter-pill ${mobileTab === 'graph' ? 'active' : ''}`}
          onClick={() => {
            setIsRightPanelOpen(true);
            setMobileTab('graph');
          }}
        >
          Graph
        </button>
      </div>

      <div
        className={`clockit-notes-layout${isLeftPanelOpen ? '' : ' collapsed-left'}${isRightPanelOpen ? '' : ' collapsed-right'}`}
        data-mobile-tab={mobileTab}
      >
        {/* ===================================================================
            PANEL 1: Notes Navigation (Quick views, folders, tags, note list)
            =================================================================== */}
        <div className={`clockit-notes-slot slot-left${isLeftPanelOpen ? '' : ' is-collapsed'}`}>
          <aside className="clockit-notes-sidebar" aria-label="Notes Directory">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Notes</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 4 }}
                  title="Search notes"
                  type="button"
                  onClick={() => document.getElementById('notes-search-input')?.focus()}
                >
                  <Search size={14} />
                </button>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 4 }}
                  title="Create new note"
                  type="button"
                  onClick={() => handleCreateNote()}
                >
                  <Plus size={15} />
                </button>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 4 }}
                  title="Collapse navigation"
                  type="button"
                  onClick={() => setIsLeftPanelOpen(false)}
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative' }}>
              <input
                id="notes-search-input"
                type="text"
                placeholder="Search title, tag, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clockit-quick-add-input"
                style={{ fontSize: 12, paddingLeft: 26, height: 30 }}
              />
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: 8.5 }} />
              {searchQuery && (
                <X
                  size={13}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', right: 8, top: 8.5, cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            {/* Quick Views */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                className={`clockit-notes-nav-row${selectedView === 'all' && !selectedFolderId && !selectedTag ? ' is-active' : ''}`}
                onClick={() => {
                  setSelectedView('all');
                  setSelectedFolderId(null);
                  setSelectedTag(null);
                }}
              >
                <div className="clockit-notes-nav-row-left">
                  <FileText size={14} color="var(--text-secondary)" />
                  <span>All Notes</span>
                </div>
                <span className="clockit-notes-row-count">{allNotesCount}</span>
              </div>

              <div
                className={`clockit-notes-nav-row${selectedView === 'favorites' ? ' is-active' : ''}`}
                onClick={() => {
                  setSelectedView('favorites');
                  setSelectedFolderId(null);
                  setSelectedTag(null);
                }}
              >
                <div className="clockit-notes-nav-row-left">
                  <Star size={14} color="#f59e0b" fill={selectedView === 'favorites' ? '#f59e0b' : 'none'} />
                  <span>Favorites</span>
                </div>
                <span className="clockit-notes-row-count">{favoritesCount}</span>
              </div>

              <div
                className={`clockit-notes-nav-row${selectedView === 'templates' ? ' is-active' : ''}`}
                onClick={() => {
                  setSelectedView('templates');
                  setSelectedFolderId(null);
                  setSelectedTag(null);
                }}
              >
                <div className="clockit-notes-nav-row-left">
                  <Bookmark size={14} color="var(--text-secondary)" />
                  <span>Templates</span>
                </div>
                <span className="clockit-notes-row-count">{templatesCount}</span>
              </div>

              <div
                className={`clockit-notes-nav-row${selectedView === 'trash' ? ' is-active' : ''}`}
                onClick={() => {
                  setSelectedView('trash');
                  setSelectedFolderId(null);
                  setSelectedTag(null);
                }}
              >
                <div className="clockit-notes-nav-row-left">
                  <Trash2 size={14} color="var(--text-muted)" />
                  <span>Trash</span>
                </div>
                <span className="clockit-notes-row-count">{trashCount}</span>
              </div>
            </div>

            {/* Folders Tree Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span className="clockit-notes-section-label">Folders</span>
              <button
                className="clockit-icon-action-btn"
                style={{ padding: 2 }}
                title="Add Folder"
                type="button"
                onClick={() => setIsNewFolderOpen(true)}
              >
                <Plus size={13} color="var(--text-muted)" />
              </button>
            </div>

            {/* Folders Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13 }}>
              {rootFolders.map((folder) => {
                const children = getSubFolders(folder.id);
                const isExpanded = expandedFolders[folder.id];
                const isParentActive = selectedFolderId === folder.id;

                return (
                  <div key={folder.id}>
                    <div
                      className={`clockit-notes-nav-row${isParentActive ? ' is-active' : ''}`}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSelectedView('all');
                        if (children.length > 0) toggleFolderAccordion(folder.id);
                      }}
                    >
                      <div className="clockit-notes-nav-row-left" style={{ gap: 6 }}>
                        {children.length > 0 ? (
                          <span
                            className="clockit-notes-caret"
                            data-expanded={isExpanded ? 'true' : 'false'}
                            role="button"
                            tabIndex={0}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.name}`}
                            aria-expanded={isExpanded}
                            onClick={(e) => { e.stopPropagation(); toggleFolderAccordion(folder.id); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFolderAccordion(folder.id);
                              }
                            }}
                          >
                            <ChevronRight size={13} />
                          </span>
                        ) : (
                          <span style={{ width: 13 }} />
                        )}
                        <FolderIcon size={14} color={folder.color} fill={folder.color} style={{ flexShrink: 0 }} />
                        <span>{folder.name}</span>
                      </div>
                      <button
                        className="clockit-icon-action-btn"
                        style={{ padding: 2 }}
                        title="New Note in Folder"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNote(folder.id);
                        }}
                      >
                        <Plus size={12} color="var(--text-muted)" />
                      </button>
                    </div>

                    {/* Subfolders */}
                    {children.length > 0 && isExpanded && (
                      <div
                        className="clockit-notes-subfolder-list"
                        style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}
                      >
                        {children.map((sub) => {
                          const isSubActive = selectedFolderId === sub.id;
                          return (
                            <div
                              key={sub.id}
                              className={`clockit-notes-subfolder-row${isSubActive ? ' is-active' : ''}`}
                              onClick={() => {
                                setSelectedFolderId(sub.id);
                                setSelectedView('all');
                              }}
                            >
                              <span>{sub.name}</span>
                              <span
                                style={{ fontSize: 11, color: 'var(--text-muted)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateNote(sub.id);
                                }}
                              >
                                +
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="clockit-notes-section-label">Tags</span>
                  {selectedTag && (
                    <button type="button" className="clockit-text-btn" onClick={() => setSelectedTag(null)}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="clockit-notes-tag-list">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`clockit-notes-tag-chip${selectedTag === tag ? ' is-active' : ''}`}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      <Hash size={11} />
                      {tag.replace(/^#/, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes in Current Selection */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="clockit-notes-section-label">
                  {selectedView === 'trash' ? 'Trash Notes' : selectedView === 'favorites' ? 'Favorite Notes' : 'Notes List'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filteredNotes.length}</span>
              </div>

              <div className="clockit-notes-list">
                {isLoadingNotes ? (
                  <div className="clockit-notes-skeleton" role="status" aria-live="polite" aria-label="Loading notes">
                    <span className="clockit-skeleton-row" />
                    <span className="clockit-skeleton-row" />
                    <span className="clockit-skeleton-row" />
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No notes found.
                    <button
                      type="button"
                      onClick={() => handleCreateNote()}
                      style={{ display: 'block', margin: '6px auto 0', color: 'var(--accent-mint)', fontSize: 12, fontWeight: 600 }}
                    >
                      + Create one
                    </button>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isActive = note.id === activeNoteId;
                    return (
                      <div
                        key={note.id}
                        className={`clockit-notes-note-row${isActive ? ' is-active' : ''}`}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <span className="clockit-notes-note-row-title">{note.title || 'Untitled Note'}</span>
                          {note.isFavorite && <Star size={11} color="#f59e0b" fill="#f59e0b" />}
                        </div>
                        <div className="clockit-notes-note-row-meta">
                          <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          {note.tags?.[0] && <span>{note.tags[0]}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ===================================================================
            PANEL 2: Central Rich-Text Document Editor
            =================================================================== */}
        <main
          key={activeNote?.id || 'no-note'}
          className="clockit-notes-editor-pane motion-fade-in"
          aria-label="Note Editor"
        >
          {activeNote ? (
            <>
              {/* Top Breadcrumb & Actions Bar */}
              <div className="clockit-notes-editor-bar">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{breadcrumb}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="clockit-icon-action-btn"
                    style={{ padding: 4 }}
                    title={isLeftPanelOpen ? 'Collapse navigation' : 'Show navigation'}
                    type="button"
                    onClick={() => setIsLeftPanelOpen((prev) => !prev)}
                  >
                    {isLeftPanelOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                  </button>

                  <button
                    className="clockit-icon-action-btn"
                    style={{ padding: 4 }}
                    title={activeNote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    type="button"
                    onClick={handleToggleFavorite}
                  >
                    <Star size={15} color="#f59e0b" fill={activeNote.isFavorite ? '#f59e0b' : 'none'} />
                  </button>

                  <button
                    className="clockit-primary-btn"
                    style={{ padding: '4px 14px', fontSize: 12, height: 28 }}
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert('Note URL copied to clipboard');
                    }}
                  >
                    <Share2 size={12} />
                    <span>Share</span>
                  </button>

                  <button
                    className="clockit-icon-action-btn"
                    style={{ padding: 4 }}
                    title="Delete note"
                    type="button"
                    onClick={() => setNoteToDelete(activeNote)}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>

                  <button
                    className="clockit-icon-action-btn"
                    style={{ padding: 4 }}
                    title={isRightPanelOpen ? 'Collapse knowledge panel' : 'Show knowledge panel'}
                    type="button"
                    onClick={() => setIsRightPanelOpen((prev) => !prev)}
                  >
                    <PanelRight size={14} />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={activeNote.title}
                onChange={handleTitleChange}
                placeholder="Note title..."
                className="clockit-page-title clockit-notes-title-input"
              />

              {/* Tags Row */}
              <div className="clockit-notes-tags-row">
                {activeNote.tags?.map((tag) => (
                  <span key={tag} className="clockit-notes-title-tag">
                    <span>{tag}</span>
                    <X size={11} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                  </span>
                ))}

                {isAddingTag ? (
                  <form onSubmit={handleAddTag} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="#tag"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onBlur={() => setIsAddingTag(false)}
                      style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-strong)', outline: 'none' }}
                    />
                  </form>
                ) : (
                  <button
                    className="clockit-icon-action-btn"
                    style={{ padding: 2 }}
                    type="button"
                    title="Add Tag"
                    onClick={() => setIsAddingTag(true)}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Tiptap Rich Editor */}
              <NotesEditor
                key={activeNote.id}
                noteId={activeNote.id}
                initialContent={activeNote.content}
                allNotes={notes}
                onChange={handleContentChange}
                onNavigateToNote={handleNavigateToNoteTitle}
                isSaving={isSaving}
              />
            </>
          ) : isLoadingNotes ? (
            <div className="clockit-notes-editor-loading" role="status" aria-live="polite" aria-label="Loading note">
              <span className="clockit-skeleton-row" style={{ width: '45%', height: 18 }} />
              <span className="clockit-skeleton-row" style={{ width: '100%' }} />
              <span className="clockit-skeleton-row" style={{ width: '92%' }} />
              <span className="clockit-skeleton-row" style={{ width: '78%' }} />
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No note selected</h3>
              <p style={{ fontSize: 13, marginTop: 6 }}>Select a note from the left sidebar or create a new one.</p>
              <button
                type="button"
                className="clockit-primary-btn"
                style={{ margin: '14px auto 0' }}
                onClick={() => handleCreateNote()}
              >
                <Plus size={14} />
                <span>Create Note</span>
              </button>
            </div>
          )}
        </main>

        {/* ===================================================================
            PANEL 3: Interactive Knowledge Graph & Linked Notes
            =================================================================== */}
        <div className={`clockit-notes-slot slot-right${isRightPanelOpen ? '' : ' is-collapsed'}`}>
          <aside className="clockit-notes-graph-pane" aria-label="Knowledge Graph">
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="clockit-filter-pills">
                <button
                  className={`clockit-filter-pill ${activeTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setActiveTab('graph')}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  type="button"
                >
                  Graph
                </button>
                <button
                  className={`clockit-filter-pill ${activeTab === 'backlinks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('backlinks')}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  type="button"
                >
                  Backlinks ({backlinks.length})
                </button>
                <button
                  className={`clockit-filter-pill ${activeTab === 'mentions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mentions')}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  type="button"
                >
                  Mentions
                </button>
              </div>

              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 2 }}
                  type="button"
                  title="Close side panel"
                  onClick={() => setIsRightPanelOpen(false)}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Tab 1: Interactive Knowledge Graph SVG Canvas */}
            {activeTab === 'graph' && (
              <div
                style={{
                  position: 'relative',
                  height: 260,
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 380 280"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block' }}
                >
                  <defs>
                    <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Connecting Lines */}
                  {graphLinks.map((link, idx) => {
                    const s = graphNodes.find((n) => n.id === link.source);
                    const t = graphNodes.find((n) => n.id === link.target);
                    if (!s || !t) return null;
                    const isConnectedToActive = activeNoteId === s.id || activeNoteId === t.id;
                    return (
                      <line
                        key={idx}
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isConnectedToActive ? 'var(--accent-mint)' : 'var(--border-strong)'}
                        strokeWidth={isConnectedToActive ? 2 : 1}
                        strokeDasharray={isConnectedToActive ? 'none' : '3 3'}
                        opacity={isConnectedToActive ? 0.95 : 0.45}
                      />
                    );
                  })}

                  {/* Note Nodes */}
                  {graphNodes.map((node) => {
                    const isCurrent = node.id === activeNoteId;
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open note ${node.label}`}
                        onClick={() => handleSelectNote(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectNote(node.id);
                          }
                        }}
                      >
                        <title>{node.folderName ? `${node.label} — ${node.folderName}` : node.label}</title>
                        {isCurrent && (
                          <rect
                            x="-48"
                            y="-16"
                            width="96"
                            height="32"
                            rx="16"
                            fill="none"
                            stroke="var(--accent-mint)"
                            strokeWidth="2"
                            filter="url(#nodeGlow)"
                            opacity="0.85"
                          />
                        )}
                        <rect
                          x="-44"
                          y="-13"
                          width="88"
                          height="26"
                          rx="13"
                          fill={isCurrent ? 'var(--accent-green)' : 'var(--bg-surface)'}
                          stroke={isCurrent ? 'var(--accent-mint)' : node.color}
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill={isCurrent ? '#ffffff' : 'var(--text-primary)'}
                          fontFamily="system-ui, sans-serif"
                        >
                          {node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Tab 2: Backlinks */}
            {activeTab === 'backlinks' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {backlinks.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No other notes link to this note yet. Use <code>[[{activeNote?.title || 'Note'}]]</code> in another note to create a link.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {backlinks.map((bNote) => (
                      <div
                        key={bNote.id}
                        className="clockit-task-row"
                        style={{ padding: '8px 10px', cursor: 'pointer' }}
                        onClick={() => handleSelectNote(bNote.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="var(--accent-mint)" />
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{bNote.title}</span>
                        </div>
                        <ExternalLink size={12} color="var(--text-muted)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Mentions */}
            {activeTab === 'mentions' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Unlinked mentions of &ldquo;{activeNote?.title}&rdquo; appear here.
                </div>
              </div>
            )}

            {/* Linked Notes Section */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-primary)' }}>
                  Linked Notes ({internalLinkedTitles.length})
                </span>
              </div>

              {internalLinkedTitles.length === 0 ? (
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '6px 0' }}>
                  No internal links in this note. Type <code>[[Note Title]]</code> in the editor to link notes.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {internalLinkedTitles.map((title, idx) => (
                    <div
                      key={idx}
                      className="clockit-task-row"
                      style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => handleNavigateToNoteTitle(title)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--accent-mint)' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 12 }}>{title}</span>
                      </div>
                      <ExternalLink size={12} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="clockit-modal-scrim" onClick={() => setNoteToDelete(null)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={noteToDelete.isTrash ? 'Permanently delete note confirmation' : 'Move note to trash confirmation'}
            style={{ width: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              {noteToDelete.isTrash ? 'Permanently Delete Note?' : 'Move Note to Trash?'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {noteToDelete.isTrash
                ? `Are you sure you want to permanently delete "${noteToDelete.title}"? This cannot be undone.`
                : `Move "${noteToDelete.title}" to trash? You can restore it later.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="clockit-filter-pill"
                onClick={() => setNoteToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="clockit-primary-btn"
                style={{ background: '#ef4444' }}
                onClick={handleDeleteActiveNote}
              >
                {noteToDelete.isTrash ? 'Delete Permanently' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="clockit-modal-scrim" onClick={() => setIsNewFolderOpen(false)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Create new folder"
            style={{ width: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, margin: '0 0 12px', color: 'var(--text-primary)' }}>Create New Folder</h3>
            <form onSubmit={handleCreateFolderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Folder Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Research"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', marginTop: 4, height: 36 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'].map((color) => (
                    <div
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: newFolderColor === color ? '2px solid var(--text-primary)' : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Parent Folder (Optional)</label>
                <select
                  value={newFolderParentId || ''}
                  onChange={(e) => setNewFolderParentId(e.target.value || null)}
                  className="clockit-sort-select"
                  style={{ width: '100%', marginTop: 4, height: 36 }}
                >
                  <option value="">None (Top-level folder)</option>
                  {rootFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  onClick={() => setIsNewFolderOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="clockit-primary-btn">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
