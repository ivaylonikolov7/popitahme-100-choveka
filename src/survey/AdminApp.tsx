import { useEffect, useMemo, useState } from "react"
import { SURVEY_QUESTIONS } from "./questions"

const KEY = "bar-feuds-survey-key"

type Submission = {
  id: string
  code: string
  handle: string
  revolut?: string
  at: string
  answers: { id: string; text: string }[]
}

function fold(text: string) {
  return text
    .trim()
    .toLocaleLowerCase("bg")
    .replace(/[„“”"'`.!?,:;]+/g, "")
    .replace(/\s+/g, " ")
}

function tally(submissions: Submission[], questionId: string) {
  const groups = new Map<string, { label: string; count: number }>()
  for (const row of submissions) {
    const text = row.answers.find((answer) => answer.id === questionId)?.text ?? ""
    if (!text) continue
    const key = fold(text)
    const current = groups.get(key)
    if (current) current.count += 1
    else groups.set(key, { label: text, count: 1 })
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "bg"))
}

export function AdminApp() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(KEY) ?? "")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<Submission[]>([])

  useEffect(() => {
    document.title = "Барски дуел · Отговори"
  }, [])

  useEffect(() => {
    if (!password) return
    let stop = false
    async function load() {
      try {
        const response = await fetch("/api/anketa", { headers: { "x-admin-key": password } })
        const body = (await response.json()) as { submissions?: Submission[]; error?: string }
        if (stop) return
        if (!response.ok || !body.submissions) {
          setUnlocked(false)
          setError(body.error || "Грешен ключ.")
          setRows([])
          return
        }
        sessionStorage.setItem(KEY, password)
        setUnlocked(true)
        setError("")
        setRows(body.submissions)
      } catch {
        if (!stop) setError("Няма връзка със сървъра.")
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 4000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [password])

  const link = useMemo(() => `${window.location.origin}${window.location.pathname}`, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          Барски <em>дуел</em>
        </div>
        <a className="btn tiny" href={window.location.pathname}>
          Към анкетата
        </a>
      </header>
      <main className="host narrow">
        <p className="eyebrow">Само за теб</p>
        <h1>Отговорите</h1>
        <p className="lede">Хората от Instagram не виждат тази страница и не виждат чуждите листчета. Листчетата се пазят в Postgres. Ключът е SURVEY_ADMIN_KEY.</p>
        {!unlocked ? (
          <form
            className="field"
            onSubmit={(event) => {
              event.preventDefault()
              const next = new FormData(event.currentTarget).get("key")
              setPassword(typeof next === "string" ? next.trim() : "")
            }}
          >
            <span>Админ ключ</span>
            <input name="key" type="password" autoComplete="current-password" defaultValue={password} />
            <button type="submit" className="btn primary">
              Отвори
            </button>
            {error && <p className="banner">{error}</p>}
          </form>
        ) : (
          <>
            <p className="whisper">
              Линк за сторито: <a href={link}>{link}</a>
            </p>
            <p className="banner gold">
              {rows.length === 0
                ? "Още няма листчета."
                : `${rows.length} ${rows.length === 1 ? "листче" : "листчета"}. Избери човек по Instagram и Revolut и прати 20€ ръчно.`}
            </p>
            <h2>Хора</h2>
            <ul className="entries">
              {rows.map((row) => (
                <li key={row.id}>
                  <b>@{row.handle}</b>
                  <small>{row.revolut || "няма Revolut"}</small>
                </li>
              ))}
            </ul>
            {SURVEY_QUESTIONS.map((question) => {
              const groups = tally(rows, question.id)
              const top = groups[0]?.count ?? 1
              return (
                <section key={question.id} className="tally">
                  <h2>{question.text}</h2>
                  {groups.length === 0 && <p className="whisper">Няма отговори.</p>}
                  {groups.map((group) => (
                    <div key={group.label} className="tally-row">
                      <div>
                        <b>{group.label}</b>
                        <i style={{ width: `${Math.max(8, (group.count / top) * 100)}%` }} />
                      </div>
                      <span>{group.count}</span>
                    </div>
                  ))}
                </section>
              )
            })}
          </>
        )}
      </main>
    </div>
  )
}
