const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, 'rls_policies.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`RLS SQL file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(sqlPath, 'utf8');
  // Remove comments (lines starting with --)
  const cleanSql = fileContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split by semicolon, filter out empty queries
  const statements = cleanSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    console.log(`Executing statement: ${statement.substring(0, 50)}...`);
    await prisma.$executeRawUnsafe(statement);
  }
  console.log('RLS policies applied successfully.');
}

main()
  .catch(err => {
    console.error('Failed to apply RLS policies:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
