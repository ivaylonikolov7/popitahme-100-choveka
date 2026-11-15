import { useRef, useState } from "react"
import {
  parseBank,
  pointTotal,
  pointsOutOfOrder,
  questionProblems,
  type Action,
  type GameState,
  type Question,
} from "../model"

export function Bank({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [openId, setOpenId] = useState(state.boardQuestions[0]?.id ?? "")
  const [error, setError] = useState("")
  const [armRestore, setArmRestore] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function download() {
    const blob = new Blob(
      [JSON.stringify({ boardQuestions: state.boardQuestions, stageQuestions: state.stageQuestions }, null, 2)],
      { type: "application/json" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bar-feuds-questions.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="host">
      <button type="button" className="btn ghost" onClick={() => dispatch({ type: "goto-setup" })}>
        Обратно към вечерта
      </button>
      <h1>Банка с въпроси</h1>
      <p className="lede">
        Всеки въпрос има осем отговора, от най-често срещания към най-редкия. Точките трябва да съберат 100. В рунд 2
        стълбицата се обръща. В рунд 3 се плащат числата както са написани, а казан отговор отпада.
      </p>

      <section>
        <header className="section-head">
          <h2>Рундове 1 и 2</h2>
          <button type="button" className="btn ghost" onClick={() => dispatch({ type: "add-board" })}>
            Добави въпрос
          </button>
        </header>
        <div className="stack">
          {state.boardQuestions.map((item, index) => (
            <QuestionCard
              key={item.id}
              item={item}
              index={index}
              bucket="board"
              open={openId === item.id}
              badges={[state.round1Id === item.id ? "Рунд 1" : "", state.round2Id === item.id ? "Рунд 2" : ""].filter(Boolean)}
              canDelete={state.boardQuestions.length > 1}
              canMoveUp={index > 0}
              canMoveDown={index < state.boardQuestions.length - 1}
              onToggle={() => setOpenId((current) => (current === item.id ? "" : item.id))}
              dispatch={dispatch}
            />
          ))}
        </div>
      </section>

      <section>
        <header className="section-head">
          <h2>Рунд 3 · сцената</h2>
        </header>
        <p className="whisper">Тези пет вървят в този ред. Хората отговарят на глас. Точките не се обръщат.</p>
        <div className="stack">
          {state.stageQuestions.map((item, index) => (
            <QuestionCard
              key={item.id}
              item={item}
              index={index}
              bucket="stage"
              open={openId === item.id}
              badges={[`Въпрос ${index + 1}`]}
              canDelete={false}
              canMoveUp={index > 0}
              canMoveDown={index < state.stageQuestions.length - 1}
              onToggle={() => setOpenId((current) => (current === item.id ? "" : item.id))}
              dispatch={dispatch}
            />
          ))}
        </div>
      </section>

      {error && <p className="problems single">{error}</p>}
      <div className="row-actions wrap">
        <button type="button" className="btn ghost" onClick={download}>
          Свали банката
        </button>
        <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
          Зареди банка
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (!armRestore) {
              setArmRestore(true)
              return
            }
            dispatch({ type: "restore-samples" })
            setArmRestore(false)
          }}
        >
          {armRestore ? "Замени с примерните въпроси" : "Върни примерните въпроси"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          void file.text().then((text) => {
            try {
              const parsed = parseBank(JSON.parse(text) as unknown)
              if ("error" in parsed) setError(parsed.error)
              else {
                dispatch({ type: "import-bank", ...parsed })
                setError("")
                setOpenId(parsed.boardQuestions[0]?.id ?? "")
              }
            } catch {
              setError("Файлът не се чете.")
            }
          })
        }}
      />
    </main>
  )
}

function QuestionCard({
  item,
  index,
  bucket,
  open,
  badges,
  canDelete,
  canMoveUp,
  canMoveDown,
  onToggle,
  dispatch,
}: {
  item: Question
  index: number
  bucket: "board" | "stage"
  open: boolean
  badges: string[]
  canDelete: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggle: () => void
  dispatch: (action: Action) => void
}) {
  const [armDelete, setArmDelete] = useState(false)
  const total = pointTotal(item)
  const problems = questionProblems(item)
  return (
    <article className="q-card">
      <button type="button" className="q-toggle" onClick={onToggle}>
        <span>{item.prompt.trim() || "Въпрос без заглавие"}</span>
        <em className={total === 100 ? "sum ok" : "sum bad"}>{total}/100</em>
      </button>
      {!!badges.length && (
        <div className="badges">
          {badges.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="q-body">
          <textarea
            rows={2}
            value={item.prompt}
            placeholder="Въпросът, който залата ще чуе"
            onChange={(event) => dispatch({ type: "edit-prompt", bucket, index, prompt: event.target.value })}
          />
          <div className="row-actions wrap">
            <button type="button" className="btn tiny" onClick={() => dispatch({ type: "preset", bucket, index, preset: "steep" })}>
              Стръмно 80
            </button>
            <button type="button" className="btn tiny" onClick={() => dispatch({ type: "preset", bucket, index, preset: "classic" })}>
              Класическо
            </button>
            <button type="button" className="btn tiny" disabled={!canMoveUp} onClick={() => dispatch({ type: "move-question", bucket, index, dir: -1 })}>
              Нагоре
            </button>
            <button type="button" className="btn tiny" disabled={!canMoveDown} onClick={() => dispatch({ type: "move-question", bucket, index, dir: 1 })}>
              Надолу
            </button>
          </div>
          <div className="edit-list">
            {item.answers.map((answer, answerIndex) => (
              <div key={answer.id} className="edit-row">
                <span className="rank">{answerIndex + 1}</span>
                <input
                  value={answer.text}
                  placeholder={answerIndex === 0 ? "Най-често срещаният" : answerIndex === 7 ? "Най-рядкият" : "Отговор"}
                  onChange={(event) =>
                    dispatch({ type: "edit-answer", bucket, index, answer: answerIndex, text: event.target.value })
                  }
                />
                <input
                  className="points"
                  inputMode="numeric"
                  aria-label={`Точки за отговор ${answerIndex + 1}`}
                  value={answer.points}
                  onChange={(event) =>
                    dispatch({
                      type: "edit-points",
                      bucket,
                      index,
                      answer: answerIndex,
                      points: Number(event.target.value.replace(/[^\d]/g, "")),
                    })
                  }
                />
                <button
                  type="button"
                  className="btn tiny"
                  disabled={answerIndex === 0}
                  onClick={() => dispatch({ type: "move-answer", bucket, index, answer: answerIndex, dir: -1 })}
                >
                  Нагоре
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  disabled={answerIndex === 7}
                  onClick={() => dispatch({ type: "move-answer", bucket, index, answer: answerIndex, dir: 1 })}
                >
                  Надолу
                </button>
              </div>
            ))}
          </div>
          <p className={total === 100 ? "sum ok" : "sum bad"}>{total} / 100</p>
          {pointsOutOfOrder(item) && (
            <p className="whisper">Долен ред има повече точки от горния. Първият ред трябва да е най-популярният.</p>
          )}
          {!!problems.length && <p className="whisper">{problems[0]}</p>}
          <div className="row-actions">
            {bucket === "board" && (
              <button type="button" className="btn tiny" onClick={() => dispatch({ type: "duplicate-board", index })}>
                Копие
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn tiny danger"
                onClick={() => {
                  if (!armDelete) {
                    setArmDelete(true)
                    return
                  }
                  dispatch({ type: "delete-board", index })
                }}
              >
                {armDelete ? "Изтрий този въпрос" : "Изтрий"}
              </button>
            )}
          </div>
          <p className="whisper">„Стръмно“ слага 80 на първия отговор: 80, 7, 4, 3, 2, 2, 1, 1.</p>
        </div>
      )}
    </article>
  )
}
