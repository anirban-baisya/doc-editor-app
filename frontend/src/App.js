import { useState } from 'react'
import DocumentList from './pages/DocumentList'
import EditorPage from './pages/EditorPage'

// We use 3 fake users (same as our seeded backend users)
// In a real app this would come from a login flow
const CURRENT_USER = { id: 1, name: 'Alice', email: 'alice@test.com' }

export default function App() {
  // 'list' = show document list, 'editor' = show the editor
  const [page, setPage] = useState('list')

  // Which document is currently open
  const [openDocId, setOpenDocId] = useState(null)

  // Open the editor for a specific document
  const openDoc = (id) => {
    setOpenDocId(id)
    setPage('editor')
  }

  // Go back to document list
  const goHome = () => {
    setOpenDocId(null)
    setPage('list')
  }

  return (
    <div>
      {page === 'list' && (
        <DocumentList
          currentUser={CURRENT_USER}
          onOpenDoc={openDoc}
        />
      )}
      {page === 'editor' && (
        <EditorPage
          docId={openDocId}
          currentUser={CURRENT_USER}
          onBack={goHome}
        />
      )}
    </div>
  )
}