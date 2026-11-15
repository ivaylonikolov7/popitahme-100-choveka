import { useEffect, useReducer, useState } from "react"
import { phaseLabel, reducer, type Action } from "./model"
import { loadState, roomUrl, saveState } from "./sync"
import { Bank } from "./screens/Bank"
import { Collect } from "./screens/Collect"
import { Final } from "./screens/Final"
import { Leaders } from "./screens/Leaders"
import { Setup } from "./screens/Setup"
import { Stage } from "./screens/Stage"
import { BoardShow } from "./show"

export function HostApp() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [armReset, setArmReset] = useState(false)
  useEffect(() => {
    saveState(state)
  }, [state])
  useEffect(() => {
    if (state.phase.type !== "reveal") return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
      event.preventDefault()
      const next: Action = event.key === "ArrowRight" ? { type: "reveal-next" } : { type: "undo-reveal" }
      dispatch(next)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state.phase.type])

  if (state.phase.type === "reveal") {
    const cursor = state.phase.cursor
    const round = state.phase.round
    return (
      <BoardShow
        state={state}
        dock={
          <div className="dock overlay">
              <button type="button" className="btn ghost" onClick={() => dispatch({ type: "reopen-slips" })}>
              Обратно към листчетата
            </button>
            {cursor > 0 && cursor < 8 && (
              <button type="button" className="btn ghost" onClick={() => dispatch({ type: "undo-reveal" })}>
                Назад
              </button>
            )}
            {cursor < 8 ? (
              <button type="button" className="btn primary" onClick={() => dispatch({ type: "reveal-next" })}>
                Покажи следващия
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={() => dispatch({ type: "continue-round" })}>
                {round === 1 ? "Започни рунд 2" : "Изведи хората"}
              </button>
            )}
            {cursor < 8 && (
              <button type="button" className="btn tiny" onClick={() => dispatch({ type: "reveal-all" })}>
                Покажи останалите
              </button>
            )}
            <button type="button" className="btn tiny" onClick={() => window.open(roomUrl(), "bar-feuds-board")}>
              Екран за залата
            </button>
          </div>
        }
      />
    )
  }

  const showReset = state.phase.type !== "setup" || state.events.length > 0
  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          Барски <em>дуел</em>
        </div>
        <span className="top-phase">{phaseLabel(state.phase)}</span>
        <div className="row-actions">
          {showReset && (
            <button
              type="button"
              className="btn tiny"
              onClick={() => {
                if (!armReset) {
                  setArmReset(true)
                  return
                }
                dispatch({ type: "new-night" })
                setArmReset(false)
              }}
            >
              {armReset ? "Изтрий вечерта" : "Нова вечер"}
            </button>
          )}
          <button type="button" className="btn tiny" onClick={() => window.open(roomUrl(), "bar-feuds-board")}>
            Екран за залата
          </button>
          {state.phase.type === "setup" && (
            <a className="btn tiny" href="#anketa">
              Анкета
            </a>
          )}
        </div>
      </header>
      {state.phase.type === "setup" && <Setup state={state} dispatch={dispatch} />}
      {state.phase.type === "bank" && <Bank state={state} dispatch={dispatch} />}
      {state.phase.type === "collect" && <Collect state={state} dispatch={dispatch} />}
      {state.phase.type === "leaders" && <Leaders state={state} dispatch={dispatch} />}
      {state.phase.type === "stage" && <Stage state={state} dispatch={dispatch} />}
      {state.phase.type === "final" && <Final state={state} dispatch={dispatch} />}
    </div>
  )
}
