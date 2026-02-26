import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

const email = process.env.SYSTEM_ADMIN
const password = process.env.SYSTEM_ADMIN_PASSPWORD

if (!email || !password) {
    console.log('⚠️  SYSTEM_ADMIN or SYSTEM_ADMIN_PASSPWORD not set — skipping.')
    await pool.end()
    process.exit(0)
}

const { rows } = await pool.query('SELECT id FROM "User" WHERE email = $1', [email])

if (rows.length > 0) {
    console.log(`✅ System admin already exists (${email}) — skipping.`)
    await pool.end()
    process.exit(0)
}

await pool.query(
    'INSERT INTO "User" (id, name, "lastName", email, password, role) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
    ['System', 'Admin', email, password, 'SYSTEM_ADMIN']
)

console.log(`✅ System admin created: ${email}`)
await pool.end()