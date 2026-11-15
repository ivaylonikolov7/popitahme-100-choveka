import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"

export type StoredSubmission = {
  id: string
  code: string
  handle: string
  revolut: string
  at: string
  answers: { id: string; text: string }[]
}

type Row = {
  id: string
  code: string
  handle: string
  revolut: string
  answers: { id: string; text: string }[] | string
  created_at: Date | string
}

let pool: Pool | undefined
let ready: Promise<void> | undefined

export function databaseUrl() {
  const direct = process.env.POSTGRES_URL_NON_POOLING?.trim()
  const pooled = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || ""
  const url = direct || pooled
  if (!url) throw new Error("Липсва POSTGRES_URL.")
  return url
}

function usesNeon(url: string) {
  return url.includes(".neon.tech")
}

function connectionString(url: string) {
  return url.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, "")
}

async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const url = databaseUrl()
  if (usesNeon(url)) {
    const sql = neon(url)
    return (await sql.query(text, params)) as T[]
  }
  pool ??= new Pool({
    connectionString: connectionString(url),
    max: 1,
    idleTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  })
  const result = await pool.query<T>(text, params)
  return result.rows
}

function ensureTable() {
  ready ??= query(
    `CREATE TABLE IF NOT EXISTS survey_submissions (
      id text PRIMARY KEY,
      code text NOT NULL UNIQUE,
      handle text NOT NULL,
      revolut text NOT NULL,
      answers jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  )
    .then(() => undefined)
    .catch((error: unknown) => {
      ready = undefined
      throw error
    })
  return ready
}

function toSubmission(row: Row): StoredSubmission {
  const answers = typeof row.answers === "string" ? (JSON.parse(row.answers) as StoredSubmission["answers"]) : row.answers
  const at = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()
  return { id: row.id, code: row.code, handle: row.handle, revolut: row.revolut, at, answers }
}

export async function readSubmissions() {
  await ensureTable()
  const rows = await query<Row>(
    `SELECT id, code, handle, revolut, answers, created_at
     FROM survey_submissions
     ORDER BY created_at ASC`,
  )
  return rows.map(toSubmission)
}

export async function insertSubmission(row: Omit<StoredSubmission, "at">) {
  await ensureTable()
  await query(
    `INSERT INTO survey_submissions (id, code, handle, revolut, answers)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [row.id, row.code, row.handle, row.revolut, JSON.stringify(row.answers)],
  )
}

export async function deleteSubmission(id: string) {
  await ensureTable()
  const rows = await query<{ id: string }>("DELETE FROM survey_submissions WHERE id = $1 RETURNING id", [id])
  return rows.length > 0
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505"
}
