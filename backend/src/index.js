const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()         // create the web server
const prisma = new PrismaClient() // connect to the database
const upload = multer({ dest: 'uploads/' }) // where uploaded files go

// Allow requests from any origin (frontend on Vercel + local)
app.use(cors({
  origin: '*'
}))
app.use(express.json())       // allow server to read JSON from requests

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

// GET /users — return all users (used in sharing dropdown)
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────

// GET /documents?userId=1
// Returns all docs owned by OR shared with that user
app.get('/documents', async (req, res) => {
  const userId = parseInt(req.query.userId)

  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },                        // docs I own
        { sharedWith: { some: { userId } } }        // docs shared with me
      ]
    },
    include: { owner: true, sharedWith: { include: { user: true } } }
  })

  res.json(docs)
})

// POST /documents — create a new blank document
app.post('/documents', async (req, res) => {
  const { title, ownerId } = req.body  // expect { title, ownerId } from frontend

  const doc = await prisma.document.create({
    data: { title, ownerId }
  })

  res.status(201).json(doc)  // 201 = "Created"
})

// GET /documents/:id — get one document by its ID
app.get('/documents/:id', async (req, res) => {
  const id = parseInt(req.params.id)

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { owner: true, sharedWith: { include: { user: true } } }
  })

  if (!doc) return res.status(404).json({ error: 'Document not found' })

  res.json(doc)
})

// PUT /documents/:id — save/update title or content
app.put('/documents/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { title, content } = req.body

  const doc = await prisma.document.update({
    where: { id },
    data: { title, content }
  })

  res.json(doc)
})

// DELETE /documents/:id — delete a document
app.delete('/documents/:id', async (req, res) => {
  const id = parseInt(req.params.id)

  // Must delete SharedDocs first (they reference the document)
  await prisma.sharedDoc.deleteMany({ where: { documentId: id } })
  await prisma.document.delete({ where: { id } })

  res.json({ message: 'Deleted successfully' })
})

// ─────────────────────────────────────────
// SHARING
// ─────────────────────────────────────────

// POST /documents/:id/share — share a doc with another user
// Body: { userId: 2 }
app.post('/documents/:id/share', async (req, res) => {
  const documentId = parseInt(req.params.id)
  const { userId } = req.body

  // Check it isn't already shared with this user
  const existing = await prisma.sharedDoc.findFirst({
    where: { documentId, userId }
  })
  if (existing) return res.status(400).json({ error: 'Already shared' })

  const share = await prisma.sharedDoc.create({
    data: { documentId, userId }
  })

  res.status(201).json(share)
})

// ─────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────

// POST /documents/upload
// Upload a .txt or .md file → create a new document from its content
app.post('/documents/upload', upload.single('file'), async (req, res) => {
  const { ownerId } = req.body
  const file = req.file

  if (!file) return res.status(400).json({ error: 'No file uploaded' })

  // Only allow .txt and .md
  const ext = path.extname(file.originalname).toLowerCase()
  if (!['.txt', '.md'].includes(ext)) {
    fs.unlinkSync(file.path) // delete the rejected file
    return res.status(400).json({ error: 'Only .txt and .md files are supported' })
  }

  // Read the file content as text
  const content = fs.readFileSync(file.path, 'utf-8')
  fs.unlinkSync(file.path) // clean up after reading

  // Create a new document from the file
  const doc = await prisma.document.create({
    data: {
      title: file.originalname,
      content,
      ownerId: parseInt(ownerId)
    }
  })

  res.status(201).json(doc)
})

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
// On Render, PORT is set automatically by the server
// Locally it falls back to 3001
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})