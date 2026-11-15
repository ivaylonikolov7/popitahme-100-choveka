import { boardQuestion, phaseLabel, startProblems, type Action, type GameState } from "../model"
import { Problems, RoomLink, teamStyle } from "../ui"

const PLACEHOLDERS = ["Редовните", "Последна поръчка", "Маса четири", "До прозореца"]

export function Setup({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const problems = startProblems(state)
  const first = boardQuestion(state, 1)
  const second = boardQuestion(state, 2)
  return (
    <main className="host">
      <p className="eyebrow">{phaseLabel(state.phase)}</p>
      <h1 className="hero-title">
        Четири маси.
        <br />
        Три рунда.
      </h1>
      <p className="lede">
        Първите два рунда са на листчета. Всеки отбор дава по три отговора, ти ги отбелязваш, после залата гледа как
        излизат. В третия рунд от всяка маса излиза по един човек.
      </p>

      <section className="panel">
        <h2>Масите</h2>
        <div className="place-grid">
          {state.teams.map((team, index) => (
            <label key={team.id} className="place-card" style={teamStyle(team)}>
              <span className="letter">{["A", "B", "C", "D"][index]}</span>
              <input
                value={team.name}
                placeholder={PLACEHOLDERS[index]}
                maxLength={32}
                autoComplete="off"
                onChange={(event) => dispatch({ type: "rename", index, name: event.target.value })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Въпросите за тази вечер</h2>
        <div className="pick-grid">
          <label>
            Рунд 1 · най-избраният
            <select
              className="dark-field"
              value={state.round1Id}
              onChange={(event) => dispatch({ type: "pick-round", round: 1, id: event.target.value })}
            >
              {state.boardQuestions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.prompt || "Въпрос без заглавие"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Рунд 2 · най-рядкият
            <select
              className="dark-field"
              value={state.round2Id}
              onChange={(event) => dispatch({ type: "pick-round", round: 2, id: event.target.value })}
            >
              {state.boardQuestions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.prompt || "Въпрос без заглавие"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="whisper">
          В банката има {state.boardQuestions.length} въпроса за таблото.{" "}
          {first?.prompt ? "Рунд 1 е избран." : "Рунд 1 няма въпрос."}{" "}
          {second && first && second.id !== first.id ? "Рунд 2 е с друг." : "Избери различен въпрос за рунд 2."} Останалите чакат, ако
          поискаш да ги смениш.
        </p>
        <ol className="stage-plan">
          {state.stageQuestions.map((item, index) => (
            <li key={item.id}>
              <span>{index + 1}</span>
              {item.prompt || "Въпрос за сцената без текст"}
            </li>
          ))}
        </ol>
        <button type="button" className="btn ghost" onClick={() => dispatch({ type: "goto-bank" })}>
          Редактирай въпросите
        </button>
      </section>

      <section className="rounds">
        <article className="round-card">
          <p>Рунд 1</p>
          <h3>Най-избраният</h3>
          <p>По три отговора. Популярните носят повече. Ако два отбора посочат едно и също, и двата взимат точките.</p>
        </article>
        <article className="round-card">
          <p>Рунд 2</p>
          <h3>Най-рядкият</h3>
          <p>Пак по три отговора. Точките се обръщат: най-редкият носи най-много, а любимият на тълпата — най-малко.</p>
        </article>
        <article className="round-card">
          <p>Рунд 3</p>
          <h3>На сцената</h3>
          <p>По един човек от отбор. Първи излиза водещият в класирането и минава петте въпроса, после следващият. Повторен отговор не носи точки.</p>
        </article>
      </section>

      <Problems items={problems} />
      <div className="dock static">
        <button type="button" className="btn primary" disabled={problems.length > 0} onClick={() => dispatch({ type: "start" })}>
          Започни рунд 1
        </button>
      </div>
      <RoomLink />
    </main>
  )
}
