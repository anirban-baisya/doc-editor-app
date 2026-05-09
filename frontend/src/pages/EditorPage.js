import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { getDocument, updateDocument, shareDocument, getUsers } from '../api'

export default function EditorPage({ docId, currentUser, onBack }) {
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState('All changes saved')
  const [showShareModal, setShowShareModal] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [doc, setDoc] = useState(null)

  // ── Setup Tiptap Editor ───────────────────────────────
  // Tiptap is the rich text editor — StarterKit gives us
  // Bold, Italic, Headings, Lists all at once
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',              // start empty, we fill it after fetch
    onUpdate: ({ editor }) => {
      // Every time the user types, trigger an auto-save
      handleAutoSave(editor.getHTML())
    }
  })

  // ── Fetch the document when page loads ───────────────
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await getDocument(docId)
        setDoc(res.data)
        setTitle(res.data.title)
        // Put the saved content into the editor
        editor?.commands.setContent(res.data.content || '')
      } catch (err) {
        alert('Failed to load document')
      }
    }

    // Only fetch once the editor is ready
    if (editor) fetchDoc()
  }, [docId, editor])

  // ── Auto-save with debounce ───────────────────────────
  // Debounce means: wait 1.5 seconds after the user STOPS
  // typing before saving — avoids saving on every keystroke
  const debounceTimer = useCallback(() => {
    let timer
    return (fn, delay) => {
      clearTimeout(timer)
      timer = setTimeout(fn, delay)
    }
  }, [])()

  const handleAutoSave = (content) => {
    setSaveStatus('Saving...')
    debounceTimer(async () => {
      try {
        await updateDocument(docId, title, content)
        setSaveStatus('All changes saved')
      } catch {
        setSaveStatus('Save failed')
      }
    }, 1500)
  }

  // ── Save title when it changes ────────────────────────
  const handleTitleBlur = async () => {
    try {
      await updateDocument(docId, title, editor?.getHTML() || '')
    } catch {
      alert('Failed to save title')
    }
  }

  // ── Load users for the share modal ───────────────────
  const openShareModal = async () => {
    try {
      const res = await getUsers()
      // Don't show the current user or already-shared users in dropdown
      const alreadyShared = doc?.sharedWith?.map(s => s.userId) || []
      const filtered = res.data.filter(
        u => u.id !== currentUser.id && !alreadyShared.includes(u.id)
      )
      setUsers(filtered)
      setSelectedUserId(filtered[0]?.id || '')
      setShowShareModal(true)
    } catch {
      alert('Failed to load users')
    }
  }

  // ── Share the document ────────────────────────────────
  const handleShare = async () => {
    if (!selectedUserId) return
    try {
      await shareDocument(docId, parseInt(selectedUserId))
      alert('Document shared successfully!')
      setShowShareModal(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to share')
    }
  }

  // ── Check if current user is the owner ───────────────
  const isOwner = doc?.ownerId === currentUser.id

  return (
    <div>
      {/* ── Top Header Bar ── */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back button goes to document list */}
          <button className="btn-light" onClick={onBack}>← Back</button>
          <span style={{ opacity: 0.8, fontSize: '14px' }}>
            {isOwner ? 'Owner' : `Shared by ${doc?.owner?.name}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="save-status">{saveStatus}</span>
          {/* Only the owner can share the document */}
          {isOwner && (
            <button className="btn-primary" onClick={openShareModal}>
              Share
            </button>
          )}
        </div>
      </div>

      <div className="editor-page">
        {/* ── Document Title ── */}
        <input
          className="editor-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}   // save when user clicks away
          placeholder="Document title..."
        />

        {/* ── Formatting Toolbar ── */}
        {editor && (
          <div className="toolbar">
            {/* Bold */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'active' : ''}
            >
              <b>B</b>
            </button>

            {/* Italic */}
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'active' : ''}
            >
              <i>I</i>
            </button>

            {/* Strikethrough */}
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'active' : ''}
            >
              <s>S</s>
            </button>

            <span style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

            {/* Heading 1 */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            >
              H1
            </button>

            {/* Heading 2 */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            >
              H2
            </button>

            <span style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

            {/* Bullet List */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'active' : ''}
            >
              • List
            </button>

            {/* Numbered List */}
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'active' : ''}
            >
              1. List
            </button>

            <span style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />

            {/* Undo / Redo */}
            <button onClick={() => editor.chain().focus().undo().run()}>↩ Undo</button>
            <button onClick={() => editor.chain().focus().redo().run()}>↪ Redo</button>
          </div>
        )}

        {/* ── The Actual Editor Box ── */}
        <div className="editor-box">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          {/* Stop click from closing modal when clicking inside */}
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Share Document</h2>

            {users.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                No more users to share with.
              </p>
            ) : (
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-light" onClick={() => setShowShareModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleShare}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}