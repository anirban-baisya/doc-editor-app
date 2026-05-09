import axios from 'axios'

// API backend address — change this if we deploy later
const API = axios.create({
  // Use environment variable in production, fallback to local in development
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
})

// ── Users ──────────────────────────────────────
// Get all users (for sharing dropdown)
export const getUsers = () => API.get('/users')

// ── Documents ──────────────────────────────────
// Get all docs for a user (owned + shared)
export const getDocuments = (userId) => API.get(`/documents?userId=${userId}`)

// Create a new blank document
export const createDocument = (title, ownerId) =>
  API.post('/documents', { title, ownerId })

// Get one document by ID
export const getDocument = (id) => API.get(`/documents/${id}`)

// Save document content/title
export const updateDocument = (id, title, content) =>
  API.put(`/documents/${id}`, { title, content })

// Delete a document
export const deleteDocument = (id) => API.delete(`/documents/${id}`)

// ── Sharing ─────────────────────────────────────
// Share a document with another user
export const shareDocument = (docId, userId) =>
  API.post(`/documents/${docId}/share`, { userId })

// ── File Upload ─────────────────────────────────
// Upload a .txt or .md file as a new document
export const uploadFile = (file, ownerId) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('ownerId', ownerId)
  return API.post('/documents/upload', formData)
}