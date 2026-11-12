import React, { useEffect, useState } from 'react';
import { Maximize2, Plus, Send, Trash2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { QuickNotesModal } from './QuickNotesModal';

interface QuickNotesCardProps {
  maxVisibleNotes?: number;
}

export const QuickNotesCard: React.FC<QuickNotesCardProps> = ({ maxVisibleNotes = 4 }) => {
  const [notes, setNotes] = useState<string[]>(() => dataService.getQuickNotes());
  const [inputVal, setInputVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    return dataService.subscribe(() => {
      setNotes(dataService.getQuickNotes());
    });
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    dataService.addQuickNote(inputVal.trim());
    setInputVal('');
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.deleteQuickNote(index);
    if (editingIdx === index) setEditingIdx(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIdx(index);
    setEditVal(notes[index] || '');
  };

  const handleSaveEdit = (index: number) => {
    if (editVal.trim()) {
      dataService.updateQuickNote(index, editVal.trim());
    }
    setEditingIdx(null);
  };

  return (
    <>
      <div className="clockit-card clockit-quick-notes-card" style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Quick Notes</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({notes.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="clockit-icon-action-btn"
              style={{ padding: 3 }}
              type="button"
              title="Add note"
              onClick={() => document.getElementById('clockit-quick-note-input')?.focus()}
            >
              <Plus size={14} />
            </button>
            <button
              className="clockit-icon-action-btn"
              style={{ padding: 3 }}
              type="button"
              title="Expand notes"
              onClick={() => setIsModalOpen(true)}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', textAlign: 'center' }}>
              No quick notes. Jot down a thought below!
            </div>
          ) : (
            notes.slice(0, maxVisibleNotes).map((qn, i) => {
              const isEditing = editingIdx === i;
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface-subtle)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      className="clockit-input"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleSaveEdit(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(i);
                        if (e.key === 'Escape') setEditingIdx(null);
                      }}
                      autoFocus
                      style={{ height: 26, fontSize: 12, padding: '2px 6px', flex: 1 }}
                    />
                  ) : (
                    <>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleStartEdit(i)}
                        title="Click to edit"
                      >
                        {qn}
                      </span>
                      <button
                        type="button"
                        className="clockit-icon-action-btn"
                        onClick={(e) => handleDelete(i, e)}
                        title="Delete note"
                        style={{ padding: 2, color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
          {notes.length > maxVisibleNotes && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-mint)',
                fontSize: 11.5,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                padding: '2px 4px',
              }}
            >
              + {notes.length - maxVisibleNotes} more notes... View all
            </button>
          )}
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAdd} className="clockit-notes-input-wrap">
          <input
            id="clockit-quick-note-input"
            type="text"
            placeholder="Jot down a thought, idea, or reminder..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            aria-label="Jot down a thought"
          />
          <button type="submit" className="clockit-icon-action-btn" style={{ padding: 2 }} aria-label="Submit note">
            <Send size={13} />
          </button>
        </form>
      </div>

      <QuickNotesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default QuickNotesCard;
