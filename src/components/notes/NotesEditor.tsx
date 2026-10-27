import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Table as TableIcon,
  Code,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { NoteItem } from '../../services/notesStorage';

interface NotesEditorProps {
  initialContent: string;
  noteId: string;
  allNotes: NoteItem[];
  onChange: (content: string) => void;
  onNavigateToNote: (title: string) => void;
  isSaving: boolean;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  initialContent,
  noteId,
  allNotes,
  onChange,
  onNavigateToNote,
  isSaving,
}) => {
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [internalLinkQuery, setInternalLinkQuery] = useState('');
  const [showInternalLinkMenu, setShowInternalLinkMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const debounceTimerRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'clockit-editor-code-block',
          },
        },
      }),
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: 'clockit-editor-task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'clockit-editor-task-item',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'clockit-editor-link',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'clockit-ideas-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'clockit-prose-editor',
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (link) {
          event.preventDefault();
          const href = link.getAttribute('href') || '';
          const text = link.innerText.replace(/^\[\[|\]\]$/g, '').trim();
          if (href.startsWith('#note-') || link.classList.contains('internal-note-link') || text) {
            onNavigateToNote(text);
          } else if (href) {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChange(html);
      }, 600);

      // Detect [[ for internal link autocomplete
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\0');
      const doubleBracketIndex = textBefore.lastIndexOf('[[');
      if (doubleBracketIndex !== -1 && !textBefore.slice(doubleBracketIndex).includes(']]')) {
        const query = textBefore.slice(doubleBracketIndex + 2);
        setInternalLinkQuery(query);
        setShowInternalLinkMenu(true);
      } else {
        setShowInternalLinkMenu(false);
      }
    },
  });

  // Re-sync editor content when switching active note
  useEffect(() => {
    if (editor && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [noteId, editor]);

  if (!editor) {
    return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading editor...</div>;
  }

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
    else editor.chain().focus().setParagraph().run();
  };

  const getHeadingValue = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'p';
  };

  const insertInternalLink = (noteTitle: string) => {
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\0');
    const doubleBracketIndex = textBefore.lastIndexOf('[[');

    if (doubleBracketIndex !== -1) {
      const deleteCount = textBefore.length - doubleBracketIndex;
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - deleteCount, to: from })
        .insertContent(`<a href="#note-${encodeURIComponent(noteTitle)}" class="internal-note-link">[[${noteTitle}]]</a> `)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="#note-${encodeURIComponent(noteTitle)}" class="internal-note-link">[[${noteTitle}]]</a> `)
        .run();
    }
    setShowInternalLinkMenu(false);
    setLinkInputOpen(false);
  };

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (or type a note name for [[Internal Link]]):', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    // Check if it's an internal note
    const matchedNote = allNotes.find((n) => n.title.toLowerCase() === url.toLowerCase().trim());
    if (matchedNote) {
      insertInternalLink(matchedNote.title);
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleInsertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().insertContent(`<img src="${url}" alt="Embedded image" style="max-width: 100%; border-radius: 8px;" />`).run();
    }
  };

  const filteredInternalNotes = allNotes.filter(
    (n) => n.id !== noteId && n.title.toLowerCase().includes(internalLinkQuery.toLowerCase().trim())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Rich Editor Formatting Toolbar */}
      <div className="clockit-editor-toolbar" role="toolbar" aria-label="Rich text formatting">
        <select
          className="clockit-sort-select"
          style={{ fontSize: 11.5, height: 26, padding: '2px 6px' }}
          value={getHeadingValue()}
          onChange={handleHeadingChange}
          aria-label="Text Style"
        >
          <option value="p">Body text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          className={`clockit-toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold (Ctrl+B)"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic (Ctrl+I)"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline (Ctrl+U)"
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          title="Strikethrough"
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={13} />
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          className={`clockit-toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bulleted List"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Numbered List"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`}
          title="Interactive Checklist"
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare size={13} />
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          className={`clockit-toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
          title="Link or [[Internal Note]]"
          type="button"
          onClick={handleAddLink}
        >
          <Link2 size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('table') ? 'active' : ''}`}
          title="Insert Table"
          type="button"
          onClick={handleInsertTable}
        >
          <TableIcon size={13} />
        </button>

        <button
          className={`clockit-toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          title="Code Block"
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={13} />
        </button>

        <button
          className="clockit-toolbar-btn"
          title="Insert Image"
          type="button"
          onClick={handleInsertImage}
        >
          <ImageIcon size={13} />
        </button>

        {/* If inside table, show table controls */}
        {editor.isActive('table') && (
          <>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button
              className="clockit-toolbar-btn"
              title="Add Row"
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <Plus size={11} /> Row
            </button>
            <button
              className="clockit-toolbar-btn"
              title="Add Column"
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <Plus size={11} /> Col
            </button>
            <button
              className="clockit-toolbar-btn"
              title="Delete Table"
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 size={11} color="#ef4444" />
            </button>
          </>
        )}

        {/* Save status badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-mint)' }}>
              <Check size={11} strokeWidth={2.5} />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Internal link [[ suggestion popup */}
      {showInternalLinkMenu && filteredInternalNotes.length > 0 && (
        <div
          className="clockit-card"
          style={{
            position: 'absolute',
            zIndex: 100,
            width: 240,
            padding: 8,
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--border-strong)',
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            Link to note:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredInternalNotes.slice(0, 6).map((note) => (
              <button
                key={note.id}
                type="button"
                className="clockit-nav-item"
                style={{ padding: '5px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                onClick={() => insertInternalLink(note.title)}
              >
                <span>[[{note.title}]]</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Prose Editor Surface */}
      <div className="clockit-editor-content-scroll">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
