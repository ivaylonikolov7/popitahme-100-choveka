import { useState, type CSSProperties, type ReactNode } from "react"
import {
  LETTERS,
  placeLabel,
  standings,
  teamName,
  type GameState,
  type Standing,
} from "./model"
import { roomUrl } from "./sync"

export function teamStyle(team: { color: string; ink: string }): CSSProperties {
  return { "--team": team.color, "--ink": team.ink } as CSSProperties
}

export function Problems({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="problems">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

export function Scoreboard({
  state,
  order = "slot",
  highlightId,
  dense = false,
}: {
  state: GameState
  order?: "slot" | "rank"
  highlightId?: string
  dense?: boolean
}) {
  const ranked = standings(state)
  const slots = order === "rank" ? ranked : [...ranked].sort((a, b) => a.index - b.index)
  const allTied = ranked.every((team) => team.score === ranked[0]?.score)
  return (
    <div className={dense ? "scoreboard dense" : "scoreboard"}>
      {slots.map((team) => (
        <ScoreCard key={team.id} team={team} highlight={team.id === highlightId} showPlace={!allTied && order === "rank"} />
      ))}
    </div>
  )
}

function ScoreCard({ team, highlight, showPlace }: { team: Standing; highlight: boolean; showPlace: boolean }) {
  return (
    <article className={highlight ? "score-card on" : "score-card"} style={teamStyle(team)}>
      <header>
        <span className="letter">{team.letter}</span>
        {showPlace && <em className="place">{placeLabel(team.place)}</em>}
      </header>
      <strong>{teamName(team, team.letter)}</strong>
      <b className="score-num" key={team.score}>
        {team.score}
      </b>
    </article>
  )
}

export function RoomLink({ prominent = false }: { prominent?: boolean }) {
  const url = roomUrl()
  const [copied, setCopied] = useState(false)
  const [manual, setManual] = useState(false)
  return (
    <div className={prominent ? "room-link prominent" : "room-link"}>
      <div>
        <strong>Екран за залата</strong>
        <p>Отвори го на телевизора. Това устройство остава при теб, защото тук се виждат отговорите.</p>
      </div>
      <code>{url}</code>
      <div className="row-actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(
              () => {
                setCopied(true)
                setManual(false)
              },
              () => setManual(true),
            )
          }}
        >
          {copied ? "Копирано" : "Копирай линка"}
        </button>
        <button type="button" className="btn primary" onClick={() => window.open(url, "bar-feuds-board")}>
          Отвори екрана
        </button>
      </div>
      {manual && <p className="whisper">Копирай адреса горе в браузъра на телевизора.</p>}
    </div>
  )
}

export function Winner({ state, children }: { state: GameState; children?: ReactNode }) {
  const ranked = standings(state)
  const top = ranked[0]?.score ?? 0
  const winners = ranked.filter((team) => team.score === top)
  const tied = winners.length > 1
  return (
    <section className="finale">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      <p className="eyebrow">Това беше вечерта</p>
      <h1>
        {tied
          ? `${winners.map((team) => teamName(team, team.letter)).join(" и ")} си разделят вечерта`
          : `Вечерта е на ${teamName(winners[0], winners[0]?.letter ?? "A")}`}
      </h1>
      <Scoreboard state={state} order="rank" />
      {children}
    </section>
  )
}

export function letterOf(state: GameState, teamId: string) {
  const index = state.teams.findIndex((team) => team.id === teamId)
  return LETTERS[index] ?? "?"
}
