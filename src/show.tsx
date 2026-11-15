import type { ReactNode } from "react"
import { awardFor, boardQuestion, LETTERS, phaseLabel, slipCount, teamName, type GameState } from "./model"
import { Scoreboard, teamStyle } from "./ui"

export function BoardShow({ state, dock }: { state: GameState; dock?: ReactNode }) {
  if (state.phase.type !== "collect" && state.phase.type !== "reveal") return null
  const round = state.phase.round
  const cursor = state.phase.type === "reveal" ? state.phase.cursor : 0
  const item = boardQuestion(state, round)
  if (!item) return null
  const ready = state.teams.every((team) => slipCount(state, team.id) >= 3)
  const missed = state.teams.filter((team) => (state.misses[team.id] ?? 0) > 0)
  return (
    <section className="show">
      <header className="show-head">
        <div className="wordmark">
          Барски <em>дуел</em>
        </div>
        <p>{phaseLabel(state.phase)}</p>
      </header>
      <Scoreboard state={state} order="rank" dense />
      <h1 className="show-prompt">{item.prompt}</h1>
      {state.phase.type === "collect" && (
        <p className="whisper show-status">{ready ? "И четирите листчета са вътре." : "Събираме листчетата."}</p>
      )}
      <div className="show-slots">
        {item.answers.map((answer, index) => {
          const open = index < cursor
          const pay = awardFor(item, index, round)
          const pickers = state.teams.filter((team) => (state.picks[team.id] ?? []).includes(answer.id))
          return (
            <article key={answer.id} className={open ? `slot${index === cursor - 1 ? " fresh" : ""}` : "slot slot-empty"}>
              <span className="rank">{index + 1}</span>
              {open ? (
                <>
                  <div className="slot-text">
                    <strong>{answer.text}</strong>
                    {round === 2 && index === 0 && <small>Любимият на залата, затова носи най-малко</small>}
                    {round === 2 && index === item.answers.length - 1 && <small>Най-редкият, затова носи най-много</small>}
                  </div>
                  <div className="slot-side">
                    {pickers.map((team) => (
                      <span key={team.id} className="chip" style={teamStyle(team)}>
                        {LETTERS[state.teams.findIndex((entry) => entry.id === team.id)]} +{pay}
                      </span>
                    ))}
                    {!pickers.length && <span className="tag">Никой</span>}
                    <b>{pay}</b>
                  </div>
                </>
              ) : (
                <div className="slot-text mystery" />
              )}
            </article>
          )
        })}
      </div>
      {state.phase.type === "reveal" && missed.length > 0 && (
        <div className="miss-line">
          <span>Извън осемте · 0</span>
          {missed.map((team) => (
            <span key={team.id} className="chip" style={teamStyle(team)}>
              {LETTERS[state.teams.findIndex((entry) => entry.id === team.id)]} ×{state.misses[team.id]}
            </span>
          ))}
        </div>
      )}
      {state.phase.type === "collect" && (
        <div className="slip-counts">
          {state.teams.map((team, index) => {
            const count = slipCount(state, team.id)
            return (
              <span key={team.id} className={count >= 3 ? "count done" : "count"} style={teamStyle(team)}>
                {LETTERS[index]} {teamName(team, LETTERS[index])} · {Math.min(count, 3)}/3
              </span>
            )
          })}
        </div>
      )}
      {dock}
    </section>
  )
}
