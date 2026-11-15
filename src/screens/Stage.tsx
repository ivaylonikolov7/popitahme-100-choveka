import { useEffect, useState } from "react"
import { standings, teamName, type Action, type GameState } from "../model"
import { letterOf, teamStyle } from "../ui"

export function Stage({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const phase = state.phase
  const [selected, setSelected] = useState<string | "miss" | null>(null)
  const [keyVisible, setKeyVisible] = useState(true)
  const cursorKey =
    phase.type === "stage" ? `${phase.teamCursor}-${phase.questionCursor}-${phase.intro}-${Boolean(phase.result)}` : ""
  useEffect(() => {
    setSelected(null)
  }, [cursorKey])
  if (phase.type !== "stage") return null

  const ranked = standings(state)
  const teamId = phase.order[phase.teamCursor]
  const team = ranked.find((item) => item.id === teamId)
  const item = state.stageQuestions[phase.questionCursor]
  if (!team || !item) return null
  const taken = new Set(state.taken[item.id] ?? [])
  const claims = state.stageLog.filter((mark) => mark.questionId === item.id && mark.claimed)
  const who = team.leader.trim() ? `${team.leader} от ${teamName(team, team.letter)}` : teamName(team, team.letter)
  const calls = ["Пръв излиза", "Втори излиза", "Трети излиза", "Четвърти излиза"]

  if (phase.intro) {
    return (
      <main className="host narrow">
        <p className="eyebrow">Рунд 3 · {calls[phase.teamCursor]}</p>
        <section className="intro-hero" style={teamStyle(team)}>
          <span className="letter">{team.letter}</span>
          <h1>{who}</h1>
          <p>{team.score} точки дотук</p>
        </section>
        <div className="dock static">
          <button type="button" className="btn primary" onClick={() => dispatch({ type: "dismiss-intro" })}>
            На сцената е
          </button>
          {state.stageLog.length === 0 && (
            <button type="button" className="btn ghost" onClick={() => dispatch({ type: "undo-stage" })}>
              Обратно към реда
            </button>
          )}
        </div>
      </main>
    )
  }

  if (phase.result) {
    const tone = phase.result.miss ? "miss" : phase.result.repeat ? "repeat" : "hit"
    const headline = phase.result.miss ? "Няма го на таблото" : phase.result.repeat ? "Вече е на таблото" : phase.result.label
    const lastQuestion = phase.questionCursor === state.stageQuestions.length - 1
    const lastTeam = phase.teamCursor === phase.order.length - 1
    const nextLabel = !lastQuestion ? "Следващ въпрос" : lastTeam ? "Краен резултат" : "Изведи следващия отбор"
    return (
      <main className="host narrow">
        <section className={`result-hero ${tone}`} style={teamStyle(team)}>
          <p>{who}</p>
          <h1>{headline}</h1>
          <b>{tone === "hit" ? `+${phase.result.points}` : "0"}</b>
        </section>
        <div className="dock static">
          <button type="button" className="btn ghost" onClick={() => dispatch({ type: "undo-stage" })}>
            Назад
          </button>
          <button type="button" className="btn primary" onClick={() => dispatch({ type: "stage-next" })}>
            {nextLabel}
          </button>
        </div>
      </main>
    )
  }

  const selectedAnswer = item.answers.find((answer) => answer.id === selected)
  const selectedTaken = selectedAnswer ? taken.has(selectedAnswer.id) : false
  let commitLabel = "Избери какво казаха"
  if (selected === "miss") commitLabel = "Няма го на таблото · 0"
  else if (selectedTaken) commitLabel = "Вече е на таблото · 0"
  else if (selectedAnswer) commitLabel = `Дай им ${selectedAnswer.points}`

  return (
    <main className="host">
      <header className="stage-head" style={teamStyle(team)}>
        <div>
          <p className="eyebrow">
            Въпрос {phase.questionCursor + 1} от {state.stageQuestions.length}
          </p>
          <h1>{who}</h1>
        </div>
        <b className="score-num">{team.score}</b>
      </header>
      <div className="dots" aria-hidden="true">
        {state.stageQuestions.map((question, index) => (
          <i key={question.id} className={index < phase.questionCursor ? "done" : index === phase.questionCursor ? "now" : ""} />
        ))}
      </div>
      <p className="show-prompt host-prompt">{item.prompt}</p>
      <div className="row-actions">
        <button type="button" className="btn tiny" onClick={() => setKeyVisible((value) => !value)}>
          {keyVisible ? "Скрий ключа" : "Покажи ключа"}
        </button>
        <button type="button" className="btn tiny" onClick={() => dispatch({ type: "undo-stage" })}>
          Назад
        </button>
      </div>
      {keyVisible ? (
        <div className="key-list">
          {item.answers.map((answer) => {
            const claim = claims.find((mark) => mark.answerId === answer.id)
            const claimTeam = claim ? ranked.find((entry) => entry.id === claim.teamId) : undefined
            const isOn = selected === answer.id
            return (
              <button
                key={answer.id}
                type="button"
                className={`key-button${taken.has(answer.id) ? " taken" : ""}${isOn ? " selected" : ""}`}
                onClick={() => setSelected(answer.id)}
              >
                <span>{answer.text}</span>
                <em>{taken.has(answer.id) ? `${claimTeam?.letter ?? letterOf(state, claim?.teamId ?? "")} · ${answer.points}` : answer.points}</em>
              </button>
            )
          })}
          <button type="button" className={selected === "miss" ? "key-button miss selected" : "key-button miss"} onClick={() => setSelected("miss")}>
            <span>Няма го на таблото</span>
            <em>0</em>
          </button>
        </div>
      ) : (
        <section className="covered">
          <p>Ключът е скрит.</p>
          <ul>
            {claims.map((mark) => (
              <li key={mark.eventId}>
                {letterOf(state, mark.teamId)} · {mark.label} · {mark.points}
              </li>
            ))}
            {!claims.length && <li>Още няма нищо на таблото.</li>}
          </ul>
        </section>
      )}
      <div className="dock static">
        <button
          type="button"
          className="btn primary"
          disabled={selected === null}
          onClick={() => dispatch({ type: "stage-mark", answerId: selected === "miss" ? null : selected })}
        >
          {commitLabel}
        </button>
      </div>
    </main>
  )
}
