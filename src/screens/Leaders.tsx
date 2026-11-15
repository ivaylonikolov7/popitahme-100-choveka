import { standings, teamName, type Action, type GameState } from "../model"
import { RoomLink, teamStyle } from "../ui"

const CALLS = ["Пръв излиза", "Втори излиза", "Трети излиза", "Четвърти излиза"]

export function Leaders({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const ranked = standings(state)
  const byId = new Map(ranked.map((team) => [team.id, team]))
  const lineup = state.stageOrder.map((id) => byId.get(id)).filter((team) => team !== undefined)
  return (
    <main className="host">
      <p className="eyebrow">Рунд 3 · На сцената</p>
      <h1>Изведи по един човек</h1>
      <p className="lede">
        Първи излиза отборът с най-много точки и отговаря на всичките пет въпроса, после следващата маса. По един опит.
        Ако някой каже отговор, който вече е на таблото, не взима точки. Първият има преднина само ако уцели. Ключът не
        се вижда.
      </p>
      <RoomLink prominent />
      <ol className="lineup">
        {lineup.map((team, index) => (
          <li key={team.id} className="lineup-card" style={teamStyle(team)}>
            <div className="lineup-top">
              <span className="letter">{team.letter}</span>
              <div>
                <p>{CALLS[index]}</p>
                <strong>{teamName(team, team.letter)}</strong>
                <b>{team.score}</b>
              </div>
              <div className="row-actions">
                <button type="button" className="btn tiny" disabled={index === 0} onClick={() => dispatch({ type: "move-stage-team", index, dir: -1 })}>
                  Нагоре
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  disabled={index === lineup.length - 1}
                  onClick={() => dispatch({ type: "move-stage-team", index, dir: 1 })}
                >
                  Надолу
                </button>
              </div>
            </div>
            <input
              value={team.leader}
              placeholder="Кой излиза"
              maxLength={24}
              autoComplete="off"
              onChange={(event) => dispatch({ type: "set-leader", index: team.index, leader: event.target.value })}
            />
          </li>
        ))}
      </ol>
      <div className="dock static">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: "begin-stage" })}>
          Отвори сцената
        </button>
      </div>
    </main>
  )
}
