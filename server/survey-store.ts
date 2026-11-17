import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { SURVEY_QUESTIONS } from "../src/survey/questions.js"
import { cleanEmail, emailOk } from "../src/survey/email.js"
import { insertSubmission, isUniqueViolation, readSubmissions, deleteSubmission } from "./survey-db.js"

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
  const handle = cleanEmail((body as { email?: unknown }).email)
  if (!emailOk(handle)) return { ok: false, error: "Напиши имейл." }
  if ((body as { accepted?: unknown }).accepted !== true) return { ok: false, error: "Приеми бележката за данните." }
  const raw = (body as { answers?: unknown }).answers
  if (!Array.isArray(raw)) return { ok: false, error: "Липсват отговорите." }
  const known = new Set<string>(SURVEY_QUESTIONS.map((question) => question.id))
  const counts = new Map<string, number>()
  const seen = new Set<string>()
  const answers: SurveyAnswer[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const id = (item as { id?: unknown }).id
    if (typeof id !== "string" || !known.has(id)) continue
    const text = cleanAnswer((item as { text?: unknown }).text)
    if (text.length < 1) continue
    const used = counts.get(id) ?? 0
    if (used >= 8) continue
    const key = `${id}\0${text.toLocaleLowerCase("bg")}`
    if (seen.has(key)) continue
    seen.add(key)
    counts.set(id, used + 1)
    answers.push({ id, text })
  }
  const covered = new Set(answers.map((answer) => answer.id))
  if (SURVEY_QUESTIONS.some((question) => !covered.has(question.id))) {
    return { ok: false, error: "Отговори и на дванайсетте въпроса." }
  }
  const submission = { id: crypto.randomUUID(), handle, revolut: "", answers }
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

export async function removeSubmission(id: unknown) {
  if (typeof id !== "string" || !id.trim()) return { ok: false as const, error: "Липсва листчето." }
  const removed = await deleteSubmission(id.trim())
  if (!removed) return { ok: false as const, error: "Няма такова листче." }
  return { ok: true as const }
}
