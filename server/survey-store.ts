import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { SURVEY_QUESTIONS } from "../src/survey/questions.js"
import { cleanRevolut, revolutOk } from "../src/survey/revolut.js"
import { insertSubmission, isUniqueViolation, readSubmissions } from "./survey-db.js"

const dir = path.resolve("data")
const keyFile = path.join(dir, "admin-key.txt")

export type SurveyAnswer = { id: string; text: string }
export type Submission = {
  id: string
  code: string
  handle: string
  revolut: string
  at: string
  answers: SurveyAnswer[]
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function adminKey() {
  const fromEnv = process.env.SURVEY_ADMIN_KEY?.trim()
  if (fromEnv) return fromEnv
  if (process.env.VERCEL) return ""
  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(keyFile)) {
    const key = crypto.randomBytes(9).toString("base64url")
    fs.writeFileSync(keyFile, `${key}\n`, { mode: 0o600 })
    console.log(`\nАнкета · админ ключ: ${key}`)
    console.log("Отговорите се виждат само на /#otgovori\n")
  }
  return fs.readFileSync(keyFile, "utf8").trim()
}

export function keysMatch(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length || a.length === 0) return false
  return crypto.timingSafeEqual(a, b)
}

export function readAll() {
  return readSubmissions()
}

function cleanHandle(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/^@+/, "").slice(0, 40)
}

function cleanAnswer(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, 80)
}

function makeCode(taken: Set<string>) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = ""
    const bytes = crypto.randomBytes(4)
    for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
    if (!taken.has(code)) return code
  }
  return crypto.randomBytes(4).toString("hex").toUpperCase()
}

export async function addSubmission(body: unknown): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  if (!body || typeof body !== "object") return { ok: false, error: "Липсва листчето." }
  const handle = cleanHandle((body as { handle?: unknown }).handle)
  if (handle.length < 2) return { ok: false, error: "Напиши име или @ от Instagram." }
  const revolut = cleanRevolut((body as { revolut?: unknown }).revolut)
  if (!revolutOk(revolut)) return { ok: false, error: "Напиши Revolut tag или телефон." }
  const raw = (body as { answers?: unknown }).answers
  if (!Array.isArray(raw)) return { ok: false, error: "Липсват отговорите." }
  const byId = new Map<string, string>()
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const id = (item as { id?: unknown }).id
    if (typeof id !== "string") continue
    byId.set(id, cleanAnswer((item as { text?: unknown }).text))
  }
  const answers: SurveyAnswer[] = []
  for (const question of SURVEY_QUESTIONS) {
    const text = byId.get(question.id) ?? ""
    if (text.length < 1) return { ok: false, error: "Попълни всичките въпроси." }
    answers.push({ id: question.id, text })
  }
  const submission = { id: crypto.randomUUID(), handle, revolut, answers }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rows = await readAll()
    const code = makeCode(new Set(rows.map((row) => row.code)))
    try {
      await insertSubmission({ ...submission, code })
      return { ok: true, code }
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 4) throw error
    }
  }
  return { ok: false, error: "Листчето не мина." }
}
