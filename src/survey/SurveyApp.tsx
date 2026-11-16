import { useEffect, useState } from "react"
import { SURVEY_QUESTIONS } from "./questions"
import { cleanRevolut, revolutOk } from "./revolut"

const DRAFT_KEY = "bar-feuds-survey-draft"

const MAX_ANSWERS = 8

type Draft = { handle: string; revolut: string; accepted: boolean; answers: string[][]; step: number }

function blankAnswers() {
  return SURVEY_QUESTIONS.map(() => [""])
}

function loadDraft(): Draft {
  const empty = { handle: "", revolut: "", accepted: false, answers: blankAnswers(), step: -1 }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return empty
    const data = JSON.parse(raw) as { handle?: string; revolut?: string; accepted?: boolean; answers?: unknown[]; step?: number }
    const answers = SURVEY_QUESTIONS.map((_, index) => {
      const item = data.answers?.[index]
      if (Array.isArray(item)) {
        const texts = item.filter((value): value is string => typeof value === "string").slice(0, MAX_ANSWERS)
        return texts.length > 0 ? texts : [""]
      }
      return typeof item === "string" ? [item] : [""]
    })
    const revolut = data.revolut ?? ""
    const accepted = data.accepted === true
    const ready = accepted && revolutOk(cleanRevolut(revolut))
    const step = ready ? (data.step ?? -1) : -1
    return { handle: data.handle ?? "", revolut, accepted, answers, step }
  } catch {
    return empty
  }
}

export function SurveyApp() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  useEffect(() => {
    document.title = "Барски дуел · Анкета"
  }, [])

  useEffect(() => {
    if (done) return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft, done])

  const step = draft.step
  const slots = draft.answers[step] ?? [""]
  const filled = draft.answers.reduce((count, row) => count + row.filter((item) => item.trim()).length, 0)
  const current = slots.some((item) => item.trim())

  function goNext() {
    if (step >= SURVEY_QUESTIONS.length - 1) return
    setDraft({ ...draft, step: step + 1 })
  }
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
          accepted: draft.accepted,
          answers: SURVEY_QUESTIONS.flatMap((item, index) =>
            (draft.answers[index] ?? []).flatMap((value) => {
              const text = value.trim()
              return text ? [{ id: item.id, text }] : []
            }),
          ),
        }),
      })
      const text = await response.text()
      let body: { code?: string; error?: string } = {}
      try {
        body = JSON.parse(text) as { code?: string; error?: string }
      } catch {
        setError("Сървърът не прие листчето. Опитай пак след малко.")
        return
      }
      if (!response.ok || body.error) {
        setError(body.error || "Не мина. Опитай пак.")
        return
      }
      sessionStorage.removeItem(DRAFT_KEY)
      setDone(true)
    } catch {
      setError("Няма връзка. Отвори линка още веднъж.")
    } finally {
      setBusy(false)
    }
  }

  function setSlot(index: number, text: string) {
    setDraft((current) => {
      const answers = current.answers.map((row) => [...row])
      const row = answers[current.step] ?? [""]
      row[index] = text
      answers[current.step] = row
      return { ...current, answers }
    })
    setError("")
  }

  function addSlot() {
    setDraft((current) => {
      const answers = current.answers.map((row) => [...row])
      const row = answers[current.step] ?? [""]
      if (row.length >= MAX_ANSWERS) return current
      answers[current.step] = [...row, ""]
      return { ...current, answers }
    })
  }

  return (
    <div className="app">
      <main className="survey">
        <p className="eyebrow">Барски дуел</p>
        {done ? (
          <>
            <h1>Готово.</h1>
            <p className="lede">
              Листчето е прието. Ако те избера, ще ти пиша в Instagram. Последвай профила, за да мога да ти пратя съобщението. 20€ тръгват по Revolut, който написа.
            </p>
            <a className="btn primary follow" href="https://www.instagram.com/barskidueel/" target="_blank" rel="noopener noreferrer">
              Последвай @barskidueel
            </a>
          </>
        ) : step < 0 ? (
          <>
            <h1>Дванайсет въпроса. 20€ за един човек.</h1>
            <p className="lede">
              На всеки въпрос можеш да напишеш няколко отговора. Можеш да спреш когато искаш. Колкото повече отговори дадеш, толкова по-голям е шансът. Ако те избера, ще ти пиша в Instagram.
            </p>
            <a className="btn primary follow" href="https://www.instagram.com/barskidueel/" target="_blank" rel="noopener noreferrer">
              Последвай @barskidueel
            </a>
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
            <label className="consent">
              <input
                type="checkbox"
                checked={draft.accepted}
                onChange={(event) => setDraft({ ...draft, accepted: event.target.checked })}
              />
              <button type="button" className="terms-link" onClick={() => setTermsOpen(true)}>
                Съгласявам се с условията за ползване
              </button>
            </label>
            {termsOpen && (
              <div className="terms-backdrop" onClick={() => setTermsOpen(false)}>
                <div
                  className="terms-pop"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="terms-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2 id="terms-title">Условия за ползване</h2>
                  <p>Анкетата е на @barskidueel.</p>
                  <p>Пазя Instagram името, Revolut (tag или телефон) и отговорите.</p>
                  <p>
                    Ползвам ги, за да видя най-честите отговори за играта и да избера един човек, на когото пращам 20€ по Revolut. Колкото повече отговори дадеш, толкова по-голям е шансът. Ако спечелиш, пиша ти в Instagram, затова последвай @barskidueel. Аз избирам. Няма код и не всеки получава пари.
                  </p>
                  <p>Листчето с името и Revolut го виждам само аз. Не го пускам публично, не го ползвам за реклама и не го давам на други.</p>
                  <p>
                    Самите отговори, без Instagram и без Revolut, ще ги ползвам после в барската игра. Там се вижда само кой отговор колко често е писан, не кой го е написал.
                  </p>
                  <p>
                    Instagram името и Revolut трия, след като парите са изпратени. Ако отговорите са написани само колкото да се участва, мога да махна цялото листче и то не влиза в играта. Ако искаш твоя запис да изтрия или да ти го покажа по-рано, пиши на @barskidueel.
                  </p>
                  <div className="dock">
                    <button type="button" className="btn ghost" onClick={() => setTermsOpen(false)}>
                      Затвори
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        setDraft({ ...draft, accepted: true })
                        setTermsOpen(false)
                      }}
                    >
                      Съгласявам се
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="dock">
              <button
                type="button"
                className="btn primary"
                disabled={
                  !draft.accepted ||
                  draft.handle.trim().replace(/^@+/, "").length < 2 ||
                  !revolutOk(cleanRevolut(draft.revolut))
                }
                onClick={() => setDraft({ ...draft, step: 0 })}
              >
                Започни
              </button>
            </div>
          </>
        ) : (
          question && (
            <>
              <p className="q-count">
                {step + 1}/{SURVEY_QUESTIONS.length}
              </p>
              <p className="whisper">Дадени {filled}. Колкото повече, толкова по-голям шанс.</p>
              <h1>{question.text}</h1>
              <div className="answer-stack">
                {slots.map((value, index) => (
                  <label className="field" key={index}>
                    <span>Отговор {index + 1}</span>
                    <input
                      value={value}
                      autoFocus={index === slots.length - 1}
                      maxLength={80}
                      enterKeyHint="next"
                      onChange={(event) => setSlot(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return
                        event.preventDefault()
                        if (value.trim() && slots.length < MAX_ANSWERS && index === slots.length - 1) {
                          addSlot()
                          return
                        }
                        if (step === SURVEY_QUESTIONS.length - 1) return
                        goNext()
                      }}
                    />
                  </label>
                ))}
                {slots.length < MAX_ANSWERS && (
                  <button type="button" className="btn ghost tiny" onClick={addSlot}>
                    Още един отговор
                  </button>
                )}
              </div>
              {error && <p className="banner">{error}</p>}
              <div className="dock">
                <button type="button" className="btn ghost" onClick={() => setDraft({ ...draft, step: step - 1 })}>
                  Назад
                </button>
                {step < SURVEY_QUESTIONS.length - 1 ? (
                  <button type="button" className={current ? "btn primary" : "btn ghost"} onClick={goNext}>
                    {current ? "Напред" : "Пропусни"}
                  </button>
                ) : (
                  <button type="button" className="btn primary" disabled={busy} onClick={() => void send()}>
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
