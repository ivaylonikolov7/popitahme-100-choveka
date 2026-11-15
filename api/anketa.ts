import { handleSurvey } from "../server/survey-http.js"

type NodeRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  socket?: { remoteAddress?: string }
  on(event: "data", listener: (chunk: Buffer) => void): void
  on(event: "end", listener: () => void): void
  on(event: "error", listener: (error: Error) => void): void
}

type NodeResponse = {
  status(code: number): NodeResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

function header(req: NodeRequest) {
  const value = req.headers["x-admin-key"]
  return Array.isArray(value) ? value[0] : value ?? ""
}

function clientIp(req: NodeRequest) {
  const forwarded = req.headers["x-forwarded-for"]
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (raw?.trim()) return raw.split(",")[0].trim()
  return req.socket?.remoteAddress ?? "vercel"
}

async function readJson(req: NodeRequest) {
  if (req.body && typeof req.body === "object") return req.body
  if (typeof req.body === "string" && req.body) return JSON.parse(req.body) as unknown
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
  return raw ? (JSON.parse(raw) as unknown) : null
}

export default async function handler(req: NodeRequest, res: NodeResponse) {
  try {
    const body = req.method === "POST" || req.method === "DELETE" ? await readJson(req) : null
    const result = await handleSurvey({ method: req.method ?? "GET", adminHeader: header(req), body, ip: clientIp(req) })
    res.status(result.status)
    res.setHeader("cache-control", "no-store")
    res.json(result.body)
  } catch (error) {
    console.error(error)
    res.status(500)
    res.setHeader("cache-control", "no-store")
    res.json({ error: "Листчето не мина." })
  }
}
