import { addSubmission, adminKey, keysMatch, readAll } from "./survey-store.js"

const hits = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < 60 * 60 * 1000)
  if (recent.length >= 8) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  return false
}

function publicError(error: unknown) {
  console.error(error)
  const message = error instanceof Error ? error.message : ""
  if (message.includes("POSTGRES_URL")) return "Базата не е вързана."
  return "Листчето не мина."
}

export async function handleSurvey(input: { method: string; adminHeader: string; body: unknown; ip: string }) {
  try {
    if (input.method === "GET") {
      const expected = adminKey()
      if (!expected) return { status: 500, body: { error: "Липсва SURVEY_ADMIN_KEY." } }
      if (!keysMatch(input.adminHeader, expected)) return { status: 401, body: { error: "Грешен ключ." } }
      return { status: 200, body: { submissions: await readAll() } }
    }
    if (input.method === "POST") {
      if (limited(input.ip)) return { status: 429, body: { error: "Много листчета от този телефон. Опитай по-късно." } }
      const result = await addSubmission(input.body)
      return { status: result.ok ? 200 : 400, body: result.ok ? { code: result.code } : { error: result.error } }
    }
    return { status: 405, body: { error: "Не става." } }
  } catch (error) {
    return { status: 500, body: { error: publicError(error) } }
  }
}
