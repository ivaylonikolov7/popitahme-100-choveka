import { standings, teamName, type GameState } from "./model"
import { useRoomState } from "./sync"
import { letterOf, Scoreboard, teamStyle, Winner } from "./ui"
import { BoardShow } from "./show"

export function BoardApp() {
  const state = useRoomState()
  return (
    <div className={state.phase.type === "final" ? "room room-final" : "room"}>
      <RoomPhase state={state} />
    </div>
  )
}

function RoomPhase({ state }: { state: GameState }) {
  if (state.phase.type === "setup" || state.phase.type === "bank") return <Splash state={state} />
  if (state.phase.type === "collect" || state.phase.type === "reveal") return <BoardShow state={state} />
  if (state.phase.type === "leaders") return <Lineup state={state} />
  if (state.phase.type === "stage") return <StageRoom state={state} />
  return <Winner state={state} />
}

function Splash({ state }: { state: GameState }) {
  return (
    <section className="splash">
      <p className="eyebrow">Тази вечер</p>
      <h1>
        Барски <em>дуел</em>
      </h1>
      <p className="lede">Четири отбора. Три рунда. Отговори на лист.</p>
      <Scoreboard state={state} order="slot" />
    </section>
  )
}

function Lineup({ state }: { state: GameState }) {
  const ranked = standings(state)
  const byId = new Map(ranked.map((team) => [team.id, team]))
  const calls = ["Пръв излиза", "Втори излиза", "Трети излиза", "Четвърти излиза"]
  return (
    <section className="splash">
      <p className="eyebrow">Рунд 3</p>
      <h1>Редът за сцената</h1>
      <ol className="lineup room-lineup">
        {state.stageOrder.map((id, index) => {
          const team = byId.get(id)
          if (!team) return null
          const who = team.leader.trim() ? team.leader : teamName(team, team.letter)
          return (
            <li key={id} className="lineup-card" style={teamStyle(team)}>
              <span className="letter">{team.letter}</span>
              <div>
                <p>{calls[index]}</p>
                <strong>{who}</strong>
                <em>{teamName(team, team.letter)}</em>
              </div>
              <b>{team.score}</b>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StageRoom({ state }: { state: GameState }) {
  if (state.phase.type !== "stage") return null
  const phase = state.phase
  const ranked = standings(state)
  const team = ranked.find((item) => item.id === phase.order[phase.teamCursor])
  const item = state.stageQuestions[phase.questionCursor]
  if (!team || !item) return null
  const claims = state.stageLog.filter((mark) => mark.questionId === item.id && mark.claimed)
  const who = team.leader.trim() ? team.leader : teamName(team, team.letter)
  const calls = ["Пръв излиза", "Втори излиза", "Трети излиза", "Четвърти излиза"]

  return (
    <section className="show stage-room">
      <header className="show-head">
        <div className="wordmark">
          Барски <em>дуел</em>
        </div>
        <p>
          Въпрос {phase.questionCursor + 1} от {state.stageQuestions.length}
        </p>
      </header>
      <Scoreboard state={state} order="rank" dense highlightId={team.id} />
      {phase.intro ? (
        <section className="intro-hero room-intro" style={teamStyle(team)}>
          <p>{calls[phase.teamCursor]}</p>
          <h1>{who}</h1>
          <em>{teamName(team, team.letter)}</em>
        </section>
      ) : phase.result ? (
        <section
          className={`result-hero room-result ${phase.result.miss ? "miss" : phase.result.repeat ? "repeat" : "hit"}`}
          style={teamStyle(team)}
        >
          <p>{who}</p>
          <h1>{phase.result.miss ? "Няма го на таблото" : phase.result.repeat ? "Вече е на таблото" : phase.result.label}</h1>
          <b>{phase.result.miss || phase.result.repeat ? "0" : `+${phase.result.points}`}</b>
        </section>
      ) : (
        <section className="stage-live">
          <p className="eyebrow">{who} отговаря</p>
          <h1 className="show-prompt">{item.prompt}</h1>
          <div className="claim-list">
            {claims.map((mark) => (
              <article key={mark.eventId}>
                <span className="letter" style={teamStyle(ranked.find((entry) => entry.id === mark.teamId) ?? team)}>
                  {letterOf(state, mark.teamId)}
                </span>
                <strong>{mark.label}</strong>
                <b>+{mark.points}</b>
              </article>
            ))}
            {!claims.length && <p className="whisper">Още няма нищо на таблото.</p>}
          </div>
          <p className="whisper">Отговорите остават при водещия.</p>
        </section>
      )}
    </section>
  )
}
