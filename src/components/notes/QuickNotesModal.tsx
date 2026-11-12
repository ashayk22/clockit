import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X, Check, FileText } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface QuickNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickNotesModal: React.FC<QuickNotesModalProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<string[]>(() => dataService.getQuickNotes());
  const [newNoteText, setNewNoteText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('All notes saved');

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

  useEffect(() => {
    return dataService.subscribe(() => {
      setNotes(dataService.getQuickNotes());
    });
  }, []);

  if (!isOpen) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    dataService.addQuickNote(newNoteText.trim());
    setNewNoteText('');
    setSaveStatus('Note added and synced');
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingContent(notes[index] || '');
  };

  const handleSaveEdit = (index: number) => {
    if (editingContent.trim()) {
      dataService.updateQuickNote(index, editingContent.trim());
      setSaveStatus('Changes saved and synced');
    }
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    dataService.deleteQuickNote(index);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    setSaveStatus('Note deleted');
  };

  return (
    <div className="clockit-modal-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="clockit-card clockit-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-notes-title"
        style={{ width: 620, maxWidth: '92vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} style={{ color: 'var(--accent-mint)' }} />
            <div>
              <h3 id="quick-notes-title" style={{ margin: 0, fontSize: 16, fontWeight: 650, color: 'var(--text-primary)' }}>Quick Notes & Scratchpad</h3>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{saveStatus}</span>
            </div>
          </div>
          <button type="button" className="clockit-icon-action-btn" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {/* Note Creation Form */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-subtle)' }}>
          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="clockit-input"
              placeholder="Jot down a new thought, URL, or reminder..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              style={{ flex: 1, height: 38, fontSize: 13 }}
              autoFocus
            />
            <button type="submit" className="clockit-primary-btn" style={{ height: 38, padding: '0 14px', fontSize: 13 }}>
              <Plus size={15} />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Notes List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No quick notes yet. Jot down your first thought above!
            </div>
          ) : (
            notes.map((noteText, idx) => {
              const isEditing = editingIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        className="clockit-input"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, resize: 'vertical' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          className="clockit-filter-pill"
                          onClick={() => setEditingIndex(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="clockit-primary-btn"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => handleSaveEdit(idx)}
                        >
                          <Check size={13} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          flex: 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleStartEdit(idx)}
                        title="Click to edit this note"
                      >
                        {noteText}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="clockit-icon-action-btn"
                          onClick={() => handleStartEdit(idx)}
                          title="Edit note"
                          style={{ padding: 4 }}
                        >
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="clockit-icon-action-btn"
                          onClick={() => handleDelete(idx)}
                          title="Delete note"
                          style={{ padding: 4, color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{notes.length} notes saved</span>
          <button type="button" className="clockit-primary-btn" onClick={onClose} style={{ height: 32, padding: '0 16px', fontSize: 12.5 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickNotesModal;
