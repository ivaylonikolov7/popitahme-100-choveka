import { useState } from "react"
import { awardFor, boardQuestion, LETTERS, previewScores, slipCount, teamName, type Action, type GameState } from "../model"
import { teamStyle } from "../ui"

export function Collect({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const round = state.phase.type === "collect" ? state.phase.round : 1
  const item = boardQuestion(state, round)
  const [note, setNote] = useState("")
  if (!item || state.phase.type !== "collect") return null
  const preview = previewScores(state, round)
  const counts = state.teams.map((team) => slipCount(state, team.id))
  const ready = counts.every((count) => count === 3)
  const topPay = awardFor(item, 0, round)
  const lowPay = awardFor(item, item.answers.length - 1, round)

  function toggle(teamId: string, answerId: string, letter: string) {
    const current = state.picks[teamId] ?? []
    if (!current.includes(answerId) && slipCount(state, teamId) >= 3) {
      setNote(`Отбор ${letter} вече има 3 отговора. Махни един, преди да добавиш друг.`)
      return
    }
    setNote("")
    dispatch({ type: "toggle-pick", teamId, answerId })
  }

  return (
    <main className="host">
      <p className="banner">Тук се вижда ключът с отговорите. Дръж го при себе си, докато не заключиш листчетата.</p>
      <p className="eyebrow">{round === 1 ? "Рунд 1 · Най-избраният" : "Рунд 2 · Най-рядкият"}</p>
      <h1>{item.prompt}</h1>
      <p className="lede">
        Натисни отбора под отговора, който листчето му има предвид. Ти преценяваш близките формулировки. Един и същ
        отговор може да донесе точки на всеки, който го е написал. Ако го няма сред осемте, добави го най-отдолу. Носи 0.
      </p>
      {round === 2 && (
        <p className="banner gold">
          Точките са обърнати. Най-редкият носи {lowPay}. Най-популярният носи {topPay}.
        </p>
      )}
      {note && <p className="banner">{note}</p>}
      <div className="counts">
        {state.teams.map((team, index) => {
          const count = counts[index]
          return (
            <div key={team.id} className={count === 3 ? "count done" : "count"} style={teamStyle(team)}>
              <span className="letter">{LETTERS[index]}</span>
              <span className="who">{teamName(team, LETTERS[index])}</span>
              <b>
                {count}/3
              </b>
              <button type="button" className="btn tiny" onClick={() => dispatch({ type: "clear-team-picks", teamId: team.id })}>
                Изчисти
              </button>
            </div>
          )
        })}
      </div>
      <div className="stack">
        {item.answers.map((answer, index) => {
          const pay = awardFor(item, index, round)
          return (
            <article key={answer.id} className="plank">
              <header className="plank-head">
                <span className="rank">{index + 1}</span>
                <strong>{answer.text}</strong>
                <span className="pay">
                  <b>{pay}</b>
                  {round === 2 && <small>анкета {answer.points}</small>}
                </span>
              </header>
              <div className="toggles">
                {state.teams.map((team, teamIndex) => {
                  const on = (state.picks[team.id] ?? []).includes(answer.id)
                  return (
                    <button
                      key={team.id}
                      type="button"
                      className={on ? "toggle on" : "toggle"}
                      style={teamStyle(team)}
                      aria-pressed={on}
                      onClick={() => toggle(team.id, answer.id, LETTERS[teamIndex])}
                    >
                      <span className="letter">{LETTERS[teamIndex]}</span>
                      <span className="who">{teamName(team, LETTERS[teamIndex])}</span>
                    </button>
                  )
                })}
              </div>
            </article>
          )
        })}
        <article className="plank">
          <header className="plank-head">
            <span className="rank">–</span>
            <strong>Няма го сред осемте</strong>
            <span className="pay">
              <b>0</b>
            </span>
          </header>
          <p className="miss-note">Листчето не съвпада с никой отговор. Брои се като едно от трите и не носи точки.</p>
          <div className="toggles">
            {state.teams.map((team, teamIndex) => {
              const misses = state.misses[team.id] ?? 0
              const full = slipCount(state, team.id) >= 3
              return (
                <div key={team.id} className="miss-step" style={teamStyle(team)}>
                  <button
                    type="button"
                    disabled={misses < 1}
                    onClick={() => dispatch({ type: "change-miss", teamId: team.id, delta: -1 })}
                  >
                    −
                  </button>
                  <b>{misses}</b>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => {
                      setNote("")
                      dispatch({ type: "change-miss", teamId: team.id, delta: 1 })
                    }}
                  >
                    +
                  </button>
                  <span className="who">{teamName(team, LETTERS[teamIndex])}</span>
                </div>
              )
            })}
          </div>
        </article>
      </div>
      <p className="preview">
        Само ти виждаш това.{" "}
        {state.teams.map((team, index) => (
          <span key={team.id}>
            {LETTERS[index]} {preview[team.id] ?? 0}
            {index < state.teams.length - 1 ? " · " : ""}
          </span>
        ))}
      </p>
      {!ready && <p className="whisper">Всеки отбор трябва да има 3 листчета, преди да се отвори таблото. Липсва ли някое, пак можеш да отвориш.</p>}
      <div className="dock static">
        <button type="button" className="btn primary" disabled={!ready} onClick={() => dispatch({ type: "begin-reveal" })}>
          Заключи листчетата и отвори таблото
        </button>
        {!ready && (
          <button type="button" className="btn ghost" onClick={() => dispatch({ type: "begin-reveal", force: true })}>
            Отвори и без всички листчета
          </button>
        )}
      </div>
    </main>
  )
}
