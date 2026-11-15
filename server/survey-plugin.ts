import type { Connect, Plugin } from "vite"
import { handleSurvey } from "./survey-http.js"

function clientIp(req: Connect.IncomingMessage) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim()
  return req.socket.remoteAddress ?? "local"
}

function readBody(req: Connect.IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > 20_000) {
        reject(new Error("big"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function send(res: Connect.ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("content-type", "application/json; charset=utf-8")
  res.setHeader("cache-control", "no-store")
  res.end(JSON.stringify(body))
}

function header(req: Connect.IncomingMessage) {
  const value = req.headers["x-admin-key"]
  return Array.isArray(value) ? value[0] : value ?? ""
}

function attach(middlewares: Connect.Server) {
  middlewares.use("/api/anketa", (req, res) => {
    void (async () => {
      let body: unknown = null
      if (req.method === "POST") {
        const raw = await readBody(req)
        body = raw ? JSON.parse(raw) : null
      }
      const result = await handleSurvey({ method: req.method ?? "GET", adminHeader: header(req), body, ip: clientIp(req) })
      send(res, result.status, result.body)
    })().catch((error) => {
      console.error(error)
      if (!res.writableEnded) send(res, 400, { error: "Листчето не мина." })
    })
  })
}

export function surveyApi(): Plugin {
  return {
    name: "survey-api",
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
