import { useEffect, useState } from "react"
import { SURVEY_QUESTIONS } from "./questions"
import { cleanRevolut, revolutOk } from "./revolut"

const DRAFT_KEY = "bar-feuds-survey-draft"

type Draft = { handle: string; revolut: string; answers: string[]; step: number }

function loadDraft(): Draft {
  const empty = { handle: "", revolut: "", answers: SURVEY_QUESTIONS.map(() => ""), step: -1 }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return empty
    const data = JSON.parse(raw) as Draft
    const answers = SURVEY_QUESTIONS.map((_, index) => data.answers?.[index] ?? "")
    const revolut = data.revolut ?? ""
    const step = revolutOk(cleanRevolut(revolut)) ? (data.step ?? -1) : -1
    return { handle: data.handle ?? "", revolut, answers, step }
  } catch {
    return empty
  }
}

export function SurveyApp() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [code, setCode] = useState("")

  useEffect(() => {
    document.title = "Барски дуел · Анкета"
  }, [])

  useEffect(() => {
    if (code) return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft, code])

  const step = draft.step
  const question = step >= 0 ? SURVEY_QUESTIONS[step] : undefined

  async function send() {
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/anketa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: draft.handle,
          revolut: draft.revolut,
          answers: SURVEY_QUESTIONS.map((item, index) => ({ id: item.id, text: draft.answers[index] ?? "" })),
        }),
      })
      const body = (await response.json()) as { code?: string; error?: string }
      if (!response.ok || !body.code) {
        setError(body.error || "Не мина. Опитай пак.")
        return
      }
      sessionStorage.removeItem(DRAFT_KEY)
      setCode(body.code)
    } catch {
      setError("Няма връзка. Отвори линка още веднъж.")
    } finally {
      setBusy(false)
    }
  }

  function setAnswer(text: string) {
    setDraft((current) => {
      const answers = [...current.answers]
      answers[current.step] = text
      return { ...current, answers }
    })
    setError("")
  }

  return (
    <div className="app">
      <main className="survey">
        <p className="eyebrow">Барски дуел</p>
        {code ? (
          <>
            <h1>Влезе в томболата.</h1>
            <p className="lede">Запази този код. Ако излезе твой, 20€ тръгват по Revolut след края на събирането. Отговорите остават само при водещия.</p>
            <div className="ticket">{code}</div>
            <p className="whisper">Направи скрийншот на кода. Парите се пращат ръчно, едва когато анкетата спре.</p>
          </>
        ) : step < 0 ? (
          <>
            <h1>Дванайсет въпроса. 20€.</h1>
            <p className="lede">
              Пиши първото, което ти дойде. Никой друг не вижда отговорите. Един човек, минал всичките, получава 20€ по Revolut, след като събирането приключи.
            </p>
            <label className="field">
              <span>Име или @ в Instagram</span>
              <input
                value={draft.handle}
                autoComplete="nickname"
                placeholder="@ime"
                onChange={(event) => setDraft({ ...draft, handle: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Revolut tag или телефон</span>
              <input
                value={draft.revolut}
                autoComplete="tel"
                inputMode="text"
                placeholder="@revtag или +359..."
                onChange={(event) => setDraft({ ...draft, revolut: event.target.value })}
              />
            </label>
            <div className="dock">
              <button
                type="button"
                className="btn primary"
                disabled={draft.handle.trim().replace(/^@+/, "").length < 2 || !revolutOk(cleanRevolut(draft.revolut))}
                onClick={() => setDraft({ ...draft, step: 0 })}
              >
                Започни
              </button>
            </div>
          </>
        ) : (
          question && (
            <>
              <p className="whisper">
                Въпрос {step + 1} от {SURVEY_QUESTIONS.length}
              </p>
              <h1>{question.text}</h1>
              <label className="field">
                <span>Първият ти отговор</span>
                <input
                  value={draft.answers[step] ?? ""}
                  autoFocus
                  maxLength={80}
                  enterKeyHint={step === SURVEY_QUESTIONS.length - 1 ? "send" : "next"}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    if (!(draft.answers[step] ?? "").trim()) return
                    if (step === SURVEY_QUESTIONS.length - 1) void send()
                    else setDraft({ ...draft, step: step + 1 })
                  }}
                />
              </label>
              {error && <p className="banner">{error}</p>}
              <div className="dock">
                <button type="button" className="btn ghost" onClick={() => setDraft({ ...draft, step: step - 1 })}>
                  Назад
                </button>
                {step < SURVEY_QUESTIONS.length - 1 ? (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!(draft.answers[step] ?? "").trim()}
                    onClick={() => setDraft({ ...draft, step: step + 1 })}
                  >
                    Напред
                  </button>
                ) : (
                  <button type="button" className="btn primary" disabled={busy || !(draft.answers[step] ?? "").trim()} onClick={() => void send()}>
                    {busy ? "Праща се…" : "Прати"}
                  </button>
                )}
              </div>
            </>
          )
        )}
      </main>
    </div>
  )
}
