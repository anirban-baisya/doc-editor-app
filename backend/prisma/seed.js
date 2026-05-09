// This file seeds the database with test data, which is useful for development and testing.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create 3 fake users — no real auth needed, just for testing
  await prisma.user.createMany({
    data: [
      { name: 'Alice', email: 'alice@test.com' },
      { name: 'Bob',   email: 'bob@test.com'   },
      { name: 'Carol', email: 'carol@test.com'  },
    ],
  })
  console.log('✅ Seeded 3 users: Alice, Bob, Carol')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())