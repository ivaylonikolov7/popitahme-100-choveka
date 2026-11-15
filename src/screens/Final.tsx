import { useState } from "react"
import { LETTERS, teamName, type Action, type GameState } from "../model"
import { Winner } from "../ui"

export function Final({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [arm, setArm] = useState(false)
  const names = new Map(state.teams.map((team, index) => [team.id, `${LETTERS[index]} ${teamName(team, LETTERS[index])}`]))
  return (
    <main className="host host-wide">
      <Winner state={state}>
        <div className="row-actions">
          {state.stageLog.length > 0 && (
            <button type="button" className="btn ghost" onClick={() => dispatch({ type: "undo-stage" })}>
              Върни последния отговор
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!arm) {
                setArm(true)
                return
              }
              dispatch({ type: "new-night" })
            }}
          >
            {arm ? "Изтрий точките и започни отначало" : "Нова вечер"}
          </button>
        </div>
      </Winner>
      <section className="log">
        <h2>Как се събраха точките</h2>
        <ol>
          {state.events.map((event) => (
            <li key={event.id}>
              <span>R{event.round}</span>
              <span>{names.get(event.teamId)}</span>
              <span>{event.label}</span>
              <b>{event.points > 0 ? `+${event.points}` : "0"}</b>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
