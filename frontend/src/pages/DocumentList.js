import { useState, useEffect, useCallback } from 'react'
import { getDocuments, createDocument, deleteDocument, uploadFile } from '../api'

export default function DocumentList({ currentUser, onOpenDoc }) {
  // All documents fetched from backend
  const [docs, setDocs] = useState([])

  // Controls showing/hiding the upload input
  const [showUpload, setShowUpload] = useState(false)

  // Loading state so we don't show empty list while fetching
  const [loading, setLoading] = useState(true)

  // ── Fetch documents function wrapped in useCallback ───
  // useCallback means this function is only recreated if
  // currentUser.id changes — this fixes the ESLint warning
  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments(currentUser.id)
      setDocs(res.data)
    } catch (err) {
      console.error('Failed to fetch documents', err)
    }
    setLoading(false)
  }, [currentUser.id])

  // ── Fetch documents when page loads ──────────────────
  // Now fetchDocs is stable (from useCallback), so it's
  // safe to put it in the dependency array
// eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  // ── Create a new blank document ───────────────────────
  const handleCreate = async () => {
    try {
      const res = await createDocument('Untitled Document', currentUser.id)
      // Immediately open the new doc in the editor
      onOpenDoc(res.data.id)
    } catch (err) {
      alert('Failed to create document')
    }
  }

  // ── Delete a document ─────────────────────────────────
  const handleDelete = async (e, docId) => {
    // Stop the card click from also opening the editor
    e.stopPropagation()

    if (!window.confirm('Delete this document?')) return

    try {
      await deleteDocument(docId)
      // Remove it from the list without refetching
      setDocs(docs.filter(d => d.id !== docId))
    } catch (err) {
      alert('Failed to delete document')
    }
  }

  // ── Upload a .txt or .md file ─────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const res = await uploadFile(file, currentUser.id)
      // Open the newly created document right away
      onOpenDoc(res.data.id)
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed')
    }
  }

  // ── Split docs into "mine" and "shared with me" ───────
  const myDocs = docs.filter(d => d.ownerId === currentUser.id)
  const sharedDocs = docs.filter(d => d.ownerId !== currentUser.id)

  // ── Helper: format the date nicely ───────────────────
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div>
      {/* ── Top Header Bar ── */}
      <div className="header">
        <h1>📄 My Docs</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Upload button toggles the file input */}
          <button className="btn-light" onClick={() => setShowUpload(!showUpload)}>
            ⬆ Upload File
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            + New Document
          </button>
        </div>
      </div>

      <div className="container">
        {/* ── File Upload Input (hidden until button clicked) ── */}
        {showUpload && (
          <div style={{
            background: 'white', padding: '16px', borderRadius: '8px',
            marginTop: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <p style={{ marginBottom: '8px', fontSize: '14px', color: '#555' }}>
              Supported formats: <strong>.txt</strong> and <strong>.md</strong> only
            </p>
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleUpload}
            />
          </div>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <p style={{ marginTop: '40px', color: '#888', textAlign: 'center' }}>
            Loading documents...
          </p>
        )}

        {/* ── My Documents Section ── */}
        {!loading && (
          <>
            <p className="section-title">My Documents ({myDocs.length})</p>

            {myDocs.length === 0 && (
              <p style={{ color: '#aaa', fontSize: '14px' }}>
                No documents yet. Click "+ New Document" to start.
              </p>
            )}

            {myDocs.map(doc => (
              <div
                key={doc.id}
                className="doc-card"
                onClick={() => onOpenDoc(doc.id)}
              >
                {/* Left side: title and metadata */}
                <div>
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    Updated {formatDate(doc.updatedAt)}
                    {/* Show how many people this doc is shared with */}
                    {doc.sharedWith.length > 0 && (
                      <span style={{ marginLeft: '8px' }}>
                        · Shared with {doc.sharedWith.map(s => s.user.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: badge + delete button */}
                <div className="actions">
                  <span className="badge badge-owner">Owner</span>
                  <button
                    className="btn-danger"
                    onClick={(e) => handleDelete(e, doc.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* ── Shared With Me Section ── */}
            {sharedDocs.length > 0 && (
              <>
                <p className="section-title">Shared With Me ({sharedDocs.length})</p>

                {sharedDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="doc-card"
                    onClick={() => onOpenDoc(doc.id)}
                  >
                    <div>
                      <div className="doc-title">{doc.title}</div>
                      <div className="doc-meta">
                        By {doc.owner.name} · Updated {formatDate(doc.updatedAt)}
                      </div>
                    </div>
                    <div className="actions">
                      <span className="badge badge-shared">Shared</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}