# Doc Editor App

A lightweight collaborative document editor inspired by Google Docs.

## Test Accounts
| Name  | Email           | ID |
|-------|----------------|-----|
| Alice | alice@test.com | 1  |
| Bob   | bob@test.com   | 2  |
| Carol | carol@test.com | 3  |

Currently logged in as **Alice (ID: 1)** by default.

## Live Demo
- Frontend: https://doc-editor-7i20pc900-anirban-baisyas-projects.vercel.app/
- Backend: https://doc-editor-app.onrender.com

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/anirban-baisya/doc-editor-app.git
cd doc-editor-app
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed

npm run start # → runs without nodemon (always works)
# OR
npm run dev # → runs with nodemon (auto-restarts on save)
# Runs at http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
# Runs at http://localhost:3000
```

## Features
- Create, edit, rename, and delete documents
- Rich text editor (Bold, Italic, Headings, Lists)
- Auto-save every 1.5 seconds
- File upload (.txt and .md)
- Share documents with other users
- Owned vs Shared document distinction
- Data persists after refresh (SQLite)
