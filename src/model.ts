export const LETTERS = ["A", "B", "C", "D"] as const

export const PRESETS = {
  steep: [80, 7, 4, 3, 2, 2, 1, 1],
  classic: [26, 18, 14, 12, 10, 8, 7, 5],
} as const

const COLORS = [
  { color: "#e25b45", ink: "#2a0d09" },
  { color: "#3dba9a", ink: "#04241c" },
  { color: "#f0a202", ink: "#2a1c04" },
  { color: "#9aa0ff", ink: "#16162c" },
]

export type Answer = { id: string; text: string; points: number }
export type Question = { id: string; prompt: string; answers: Answer[] }
export type Team = { id: string; name: string; leader: string; color: string; ink: string }

export type ScoreEvent = {
  id: string
  round: 1 | 2 | 3
  teamId: string
  points: number
  label: string
  prompt: string
  revealKey?: string
}

export type StageMark = {
  teamCursor: number
  questionCursor: number
  teamId: string
  questionId: string
  answerId: string | null
  repeat: boolean
  claimed: boolean
  points: number
  eventId: string
  label: string
}

export type StageResult = {
  label: string
  points: number
  repeat: boolean
  miss: boolean
  teamId: string
}

export type Phase =
  | { type: "setup" }
  | { type: "bank" }
  | { type: "collect"; round: 1 | 2 }
  | { type: "reveal"; round: 1 | 2; cursor: number }
  | { type: "leaders" }
  | {
      type: "stage"
      order: string[]
      teamCursor: number
      questionCursor: number
      intro: boolean
      result: StageResult | null
    }
  | { type: "final" }

export type GameState = {
  version: 2
  teams: Team[]
  boardQuestions: Question[]
  stageQuestions: Question[]
  round1Id: string
  round2Id: string
  picks: Record<string, string[]>
  misses: Record<string, number>
  events: ScoreEvent[]
  taken: Record<string, string[]>
  stageOrder: string[]
  stageLog: StageMark[]
  phase: Phase
}

export type Action =
  | { type: "rename"; index: number; name: string }
  | { type: "set-leader"; index: number; leader: string }
  | { type: "pick-round"; round: 1 | 2; id: string }
  | { type: "edit-prompt"; bucket: Bucket; index: number; prompt: string }
  | { type: "edit-answer"; bucket: Bucket; index: number; answer: number; text: string }
  | { type: "edit-points"; bucket: Bucket; index: number; answer: number; points: number }
  | { type: "move-answer"; bucket: Bucket; index: number; answer: number; dir: -1 | 1 }
  | { type: "preset"; bucket: Bucket; index: number; preset: keyof typeof PRESETS }
  | { type: "add-board" }
  | { type: "duplicate-board"; index: number }
  | { type: "delete-board"; index: number }
  | { type: "move-question"; bucket: Bucket; index: number; dir: -1 | 1 }
  | { type: "restore-samples" }
  | { type: "import-bank"; boardQuestions: Question[]; stageQuestions: Question[] }
  | { type: "goto-bank" }
  | { type: "goto-setup" }
  | { type: "start" }
  | { type: "toggle-pick"; teamId: string; answerId: string }
  | { type: "clear-team-picks"; teamId: string }
  | { type: "change-miss"; teamId: string; delta: -1 | 1 }
  | { type: "begin-reveal"; force?: boolean }
  | { type: "reveal-next" }
  | { type: "reveal-all" }
  | { type: "undo-reveal" }
  | { type: "reopen-slips" }
  | { type: "continue-round" }
  | { type: "move-stage-team"; index: number; dir: -1 | 1 }
  | { type: "begin-stage" }
  | { type: "dismiss-intro" }
  | { type: "stage-mark"; answerId: string | null }
  | { type: "stage-next" }
  | { type: "undo-stage" }
  | { type: "new-night" }

type Bucket = "board" | "stage"

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

function question(id: string, prompt: string, rows: [string, number][]): Question {
  return {
    id,
    prompt,
    answers: rows.map(([text, points], index) => ({
      id: `${id}a${index + 1}`,
      text,
      points,
    })),
  }
}

export function seedBoard(): Question[] {
  return [
    question("b1", "Кажи признак, че си пил достатъчно", [
      ["Казваш на непознат, че го обичаш", 28],
      ["Започваш реч", 18],
      ["Събуваш се", 14],
      ["Пишеш на бившето", 12],
      ["Спориш с мебелите", 9],
      ["Прегръщаш бармана", 8],
      ["Поръчваш вода и го мислиш", 6],
      ["Забравяш чия е редата", 5],
    ]),
    question("b2", "Нещо, което хората се заричат да свършат утре", [
      ["Да потичат", 24],
      ["Да пият повече вода", 18],
      ["Да пишат на майка си", 15],
      ["Да разтребят", 12],
      ["Да заспят навреме", 10],
      ["Да си направят бюджет", 9],
      ["Да сготвят истинско ядене", 7],
      ["Да се научат на инструмент", 5],
    ]),
    question("b3", "Причина груповият чат изведнъж да млъкне", [
      ["Някой прати гласово", 30],
      ["Плановете станаха твърде конкретни", 16],
      ["Споменаха бивше", 13],
      ["Стана дума за пари", 11],
      ["Появи се скрийншот", 10],
      ["Някой каза „трябва да говорим“", 8],
      ["Твърде много анкети", 7],
      ["Превърна се в логистика", 5],
    ]),
    question("b4", "Нещо, което вземаш назаем и рядко връщаш", [
      ["Зарядно", 22],
      ["Суичър", 19],
      ["Запалка", 14],
      ["Книга", 12],
      ["Слънчеви очила", 11],
      ["Чадър", 9],
      ["Ластик за коса", 8],
      ["Химикалка", 5],
    ]),
  ]
}

export function seedStage(): Question[] {
  return [
    question("s1", "Кажи питие, което хората поръчват, за да изглеждат интересни", [
      ["Олд фешън", 25],
      ["Еспресо мартини", 18],
      ["Негрони", 14],
      ["Аперол шприц", 12],
      ["Уиски сауър", 10],
      ["Нещо с мескал", 8],
      ["Натурално вино", 7],
      ["Каквото пият те", 6],
    ]),
    question("s2", "Нещо, което дочуваш в тоалетната на бара", [
      ["Реч пред огледалото", 21],
      ["Драматичен разговор по телефона", 17],
      ["„Добре изглеждаш“", 15],
      ["Тайна, която трябваше да си остане отвън", 13],
      ["Сушилнята, която не спира", 11],
      ["План за бягство от компанията", 9],
      ["Пеене", 8],
      ["Рецензия на срещата отвън", 6],
    ]),
    question("s3", "Извинение, че си изпуснал последния транспорт", [
      ["Още една песен", 27],
      ["Компанията се разпиля", 16],
      ["Телефонът умря", 13],
      ["Не си намерих палтото", 12],
      ["Разговорът ме отнесе", 10],
      ["Сметката се точеше", 9],
      ["Тези обувки", 7],
      ["Имаше куче", 6],
    ]),
    question("s4", "Нещо, което може да запали спор на масата", [
      ["Кой град прави най-добрата пица", 23],
      ["Хотдогът сандвич ли е", 18],
      ["Ананас върху пица", 14],
      ["Кой плаща", 12],
      ["Най-доброто десетилетие за музика", 11],
      ["Как се налива бира", 9],
      ["В брой или с карта", 7],
      ["Кога е време да си тръгнем", 6],
    ]),
    question("s5", "Нещо, за което съжаляваш, че си поръчал след полунощ", [
      ["Начос за цялата маса", 20],
      ["Шот, който никой не помни кой е избрал", 18],
      ["Картофи, които дойдоха студени", 15],
      ["Лютото от менюто", 13],
      ["Ред текила", 12],
      ["Нещо „с всичко отгоре“", 10],
      ["Рибата", 7],
      ["Втори десерт", 5],
    ]),
  ]
}

export function blankQuestion(): Question {
  return question(uid("q"), "", PRESETS.classic.map((points) => ["", points] as [string, number]))
}

export function fresh(): GameState {
  const teams = LETTERS.map((_, index) => ({
    id: `t${index + 1}`,
    name: "",
    leader: "",
    color: COLORS[index].color,
    ink: COLORS[index].ink,
  }))
  return {
    version: 2,
    teams,
    boardQuestions: seedBoard(),
    stageQuestions: seedStage(),
    round1Id: "b1",
    round2Id: "b2",
    picks: {},
    misses: {},
    events: [],
    taken: {},
    stageOrder: teams.map((team) => team.id),
    stageLog: [],
    phase: { type: "setup" },
  }
}

export function hydrate(raw: unknown): GameState {
  if (!raw || typeof raw !== "object") return fresh()
  const data = raw as Partial<GameState>
  const phases = new Set(["setup", "bank", "collect", "reveal", "leaders", "stage", "final"])
  if (data.version !== 2 || !data.phase || !phases.has(data.phase.type)) return fresh()
  if (!Array.isArray(data.teams) || data.teams.length !== 4) return fresh()
  if (!Array.isArray(data.boardQuestions) || !Array.isArray(data.stageQuestions)) return fresh()
  const base = fresh()
  return {
    ...base,
    ...data,
    teams: data.teams.map((team, index) => ({ ...base.teams[index], ...team })),
    picks: data.picks ?? {},
    misses: data.misses ?? {},
    events: data.events ?? [],
    taken: data.taken ?? {},
    stageLog: data.stageLog ?? [],
    stageOrder: data.stageOrder?.length ? data.stageOrder : base.teams.map((team) => team.id),
    phase: data.phase,
  }
}

export function pointTotal(questionItem: Question) {
  return questionItem.answers.reduce((sum, answer) => sum + answer.points, 0)
}

export function awardFor(questionItem: Question, index: number, round: 1 | 2) {
  if (round === 1) return questionItem.answers[index]?.points ?? 0
  const mirror = questionItem.answers.length - 1 - index
  return questionItem.answers[mirror]?.points ?? 0
}

export function questionProblems(questionItem: Question) {
  const label = questionItem.prompt.trim() || "Въпрос без заглавие"
  const problems: string[] = []
  if (!questionItem.prompt.trim()) problems.push("Има въпрос без текст.")
  if (questionItem.answers.length !== 8) problems.push(`${label} трябва да има 8 отговора.`)
  if (questionItem.answers.some((answer) => !answer.text.trim())) {
    problems.push(`${label} има празен отговор.`)
  }
  const total = pointTotal(questionItem)
  if (total !== 100) problems.push(`${label} събира ${total}, а не 100.`)
  if (questionItem.answers.some((answer) => !Number.isInteger(answer.points) || answer.points < 0)) {
    problems.push(`${label} има точки, които не са цяло число.`)
  }
  return problems
}

export function pointsOutOfOrder(questionItem: Question) {
  return questionItem.answers.some((answer, index) => index > 0 && answer.points > questionItem.answers[index - 1].points)
}

export function startProblems(state: GameState) {
  const problems: string[] = []
  state.teams.forEach((team, index) => {
    if (!team.name.trim()) problems.push(`Кръсти отбор ${LETTERS[index]}.`)
  })
  const first = state.boardQuestions.find((item) => item.id === state.round1Id)
  const second = state.boardQuestions.find((item) => item.id === state.round2Id)
  if (!first) problems.push("Избери въпрос за рунд 1.")
  if (!second) problems.push("Избери въпрос за рунд 2.")
  if (first && second && first.id === second.id) problems.push("За рунд 2 избери друг въпрос.")
  if (state.stageQuestions.length !== 5) problems.push("Рунд 3 трябва да има точно 5 въпроса.")
  for (const item of [first, second, ...state.stageQuestions]) {
    if (item) problems.push(...questionProblems(item))
  }
  return problems
}

export type Standing = Team & { index: number; letter: string; score: number; place: number }

export function standings(state: GameState): Standing[] {
  const ranked = state.teams
    .map((team, index) => ({
      ...team,
      index,
      letter: LETTERS[index],
      score: state.events.filter((event) => event.teamId === team.id).reduce((sum, event) => sum + event.points, 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
  let place = 0
  return ranked.map((team, index) => {
    if (index > 0 && team.score < ranked[index - 1].score) place = index
    return { ...team, place }
  })
}

export function teamName(team: { name: string }, letter: string) {
  return team.name.trim() || `Отбор ${letter}`
}

export function boardQuestion(state: GameState, round: 1 | 2) {
  const id = round === 1 ? state.round1Id : state.round2Id
  return state.boardQuestions.find((item) => item.id === id) ?? state.boardQuestions[0]
}

export function slipCount(state: GameState, teamId: string) {
  return (state.picks[teamId]?.length ?? 0) + (state.misses[teamId] ?? 0)
}

export function previewScores(state: GameState, round: 1 | 2) {
  const item = boardQuestion(state, round)
  const scores: Record<string, number> = {}
  if (!item) return scores
  for (const team of state.teams) {
    scores[team.id] = (state.picks[team.id] ?? []).reduce((sum, answerId) => {
      const index = item.answers.findIndex((answer) => answer.id === answerId)
      return index < 0 ? sum : sum + awardFor(item, index, round)
    }, 0)
  }
  return scores
}

export function phaseLabel(phase: Phase) {
  switch (phase.type) {
    case "setup":
    case "bank":
      return "Тази вечер"
    case "collect":
    case "reveal":
      return phase.round === 1 ? "Рунд 1 · Най-избраният" : "Рунд 2 · Най-рядкият"
    case "leaders":
      return "Рунд 3 · Редът"
    case "stage":
      return "Рунд 3 · На сцената"
    case "final":
      return "Крайният резултат"
  }
}

export function placeLabel(place: number) {
  return ["1-ви", "2-ри", "3-ти", "4-ти"][place] ?? ""
}

function cleanPoints(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function rekey(item: Question): Question {
  const id = uid("q")
  return {
    id,
    prompt: String(item.prompt ?? "").slice(0, 180),
    answers: Array.from({ length: 8 }, (_, index) => {
      const answer = item.answers?.[index]
      return {
        id: uid("a"),
        text: String(answer?.text ?? "").slice(0, 80),
        points: cleanPoints(Number(answer?.points ?? 0)),
      }
    }),
  }
}

export function parseBank(raw: unknown): { boardQuestions: Question[]; stageQuestions: Question[] } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Този файл не е банка с въпроси." }
  const data = raw as { boardQuestions?: Question[]; stageQuestions?: Question[] }
  if (!Array.isArray(data.boardQuestions) || !Array.isArray(data.stageQuestions)) {
    return { error: "Във файла липсват въпросите за таблото или за сцената." }
  }
  if (!data.boardQuestions.length) return { error: "Банката трябва да има поне един въпрос за таблото." }
  if (data.stageQuestions.length !== 5) return { error: "Рунд 3 трябва да има точно 5 въпроса." }
  return {
    boardQuestions: data.boardQuestions.map((item) => rekey(item)),
    stageQuestions: data.stageQuestions.map((item) => rekey(item)),
  }
}

function editing(state: GameState) {
  return state.phase.type === "setup" || state.phase.type === "bank"
}

function ensureRounds(state: GameState): GameState {
  const ids = state.boardQuestions.map((item) => item.id)
  if (!ids.length) return state
  const round1Id = ids.includes(state.round1Id) ? state.round1Id : ids[0]
  const round2Id = ids.includes(state.round2Id) ? state.round2Id : (ids.find((id) => id !== round1Id) ?? ids[0])
  return { ...state, round1Id, round2Id }
}

function bucketKey(bucket: Bucket): "boardQuestions" | "stageQuestions" {
  return bucket === "board" ? "boardQuestions" : "stageQuestions"
}

function updateQuestion(state: GameState, bucket: Bucket, index: number, fn: (item: Question) => Question) {
  const key = bucketKey(bucket)
  const list = state[key].map((item, itemIndex) => (itemIndex === index ? fn(item) : item))
  return ensureRounds({ ...state, [key]: list })
}

function normalizeOrder(state: GameState) {
  const ids = state.teams.map((team) => team.id)
  const kept = state.stageOrder.filter((id) => ids.includes(id))
  return [...kept, ...ids.filter((id) => !kept.includes(id))]
}

function revealOne(state: GameState): GameState {
  if (state.phase.type !== "reveal") return state
  const item = boardQuestion(state, state.phase.round)
  if (!item || state.phase.cursor >= item.answers.length) return state
  const index = state.phase.cursor
  const answer = item.answers[index]
  const points = awardFor(item, index, state.phase.round)
  const revealKey = `${state.phase.round}:${answer.id}`
  const added: ScoreEvent[] = state.teams
    .filter((team) => (state.picks[team.id] ?? []).includes(answer.id))
    .map((team) => ({
      id: uid("e"),
      round: state.phase.type === "reveal" ? state.phase.round : 1,
      teamId: team.id,
      points,
      label: answer.text,
      prompt: item.prompt,
      revealKey,
    }))
  return {
    ...state,
    events: [...state.events, ...added],
    phase: { ...state.phase, cursor: index + 1 },
  }
}

function clearRoundReveals(state: GameState, round: 1 | 2): GameState {
  const prefix = `${round}:`
  return { ...state, events: state.events.filter((event) => !event.revealKey?.startsWith(prefix)) }
}

function markStage(state: GameState, answerId: string | null): GameState {
  if (state.phase.type !== "stage" || state.phase.intro || state.phase.result) return state
  const { order, teamCursor, questionCursor } = state.phase
  const teamId = order[teamCursor]
  const item = state.stageQuestions[questionCursor]
  if (!item || !teamId) return state
  const taken = state.taken[item.id] ?? []
  const answer = answerId ? item.answers.find((candidate) => candidate.id === answerId) : undefined
  if (answerId && !answer) return state
  const repeat = Boolean(answer && taken.includes(answer.id))
  const claimed = Boolean(answer && !repeat)
  const points = claimed && answer ? answer.points : 0
  const label = answer ? answer.text : "Няма го на таблото"
  const eventId = uid("e")
  const mark: StageMark = {
    teamCursor,
    questionCursor,
    teamId,
    questionId: item.id,
    answerId,
    repeat,
    claimed,
    points,
    eventId,
    label,
  }
  return {
    ...state,
    events: [
      ...state.events,
      {
        id: eventId,
        round: 3,
        teamId,
        points,
        label: repeat ? `Вече е казано · ${label}` : label,
        prompt: item.prompt,
      },
    ],
    taken: claimed && answer ? { ...state.taken, [item.id]: [...taken, answer.id] } : state.taken,
    stageLog: [...state.stageLog, mark],
    phase: {
      ...state.phase,
      result: { label, points, repeat, miss: !answer, teamId },
    },
  }
}

function advanceStage(state: GameState): GameState {
  if (state.phase.type !== "stage" || !state.phase.result) return state
  const { order, teamCursor, questionCursor } = state.phase
  if (questionCursor < state.stageQuestions.length - 1) {
    return {
      ...state,
      phase: { type: "stage", order, teamCursor, questionCursor: questionCursor + 1, intro: false, result: null },
    }
  }
  if (teamCursor < order.length - 1) {
    return {
      ...state,
      phase: { type: "stage", order, teamCursor: teamCursor + 1, questionCursor: 0, intro: true, result: null },
    }
  }
  return { ...state, phase: { type: "final" } }
}

function undoStage(state: GameState): GameState {
  const mark = state.stageLog[state.stageLog.length - 1]
  if (!mark) {
    if (
      state.phase.type === "stage" &&
      state.phase.teamCursor === 0 &&
      state.phase.questionCursor === 0 &&
      !state.phase.result
    ) {
      return { ...state, phase: { type: "leaders" } }
    }
    return state
  }
  const order = state.phase.type === "stage" ? state.phase.order : state.stageOrder
  const taken = { ...state.taken }
  if (mark.claimed && mark.answerId) {
    taken[mark.questionId] = (taken[mark.questionId] ?? []).filter((id) => id !== mark.answerId)
  }
  return {
    ...state,
    events: state.events.filter((event) => event.id !== mark.eventId),
    taken,
    stageLog: state.stageLog.slice(0, -1),
    phase: {
      type: "stage",
      order,
      teamCursor: mark.teamCursor,
      questionCursor: mark.questionCursor,
      intro: false,
      result: null,
    },
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "rename":
      return {
        ...state,
        teams: state.teams.map((team, index) =>
          index === action.index ? { ...team, name: action.name.slice(0, 32) } : team,
        ),
      }
    case "set-leader":
      return {
        ...state,
        teams: state.teams.map((team, index) =>
          index === action.index ? { ...team, leader: action.leader.slice(0, 24) } : team,
        ),
      }
    case "pick-round": {
      if (!editing(state)) return state
      return action.round === 1 ? { ...state, round1Id: action.id } : { ...state, round2Id: action.id }
    }
    case "edit-prompt":
      if (!editing(state)) return state
      return updateQuestion(state, action.bucket, action.index, (item) => ({
        ...item,
        prompt: action.prompt.slice(0, 180),
      }))
    case "edit-answer":
      if (!editing(state)) return state
      return updateQuestion(state, action.bucket, action.index, (item) => ({
        ...item,
        answers: item.answers.map((answer, answerIndex) =>
          answerIndex === action.answer ? { ...answer, text: action.text.slice(0, 80) } : answer,
        ),
      }))
    case "edit-points":
      if (!editing(state)) return state
      return updateQuestion(state, action.bucket, action.index, (item) => ({
        ...item,
        answers: item.answers.map((answer, answerIndex) =>
          answerIndex === action.answer ? { ...answer, points: cleanPoints(action.points) } : answer,
        ),
      }))
    case "move-answer": {
      if (!editing(state)) return state
      return updateQuestion(state, action.bucket, action.index, (item) => {
        const next = item.answers.slice()
        const target = action.answer + action.dir
        if (target < 0 || target >= next.length) return item
        const [row] = next.splice(action.answer, 1)
        next.splice(target, 0, row)
        return { ...item, answers: next }
      })
    }
    case "preset":
      if (!editing(state)) return state
      return updateQuestion(state, action.bucket, action.index, (item) => ({
        ...item,
        answers: item.answers.map((answer, answerIndex) => ({
          ...answer,
          points: PRESETS[action.preset][answerIndex] ?? answer.points,
        })),
      }))
    case "add-board":
      if (!editing(state)) return state
      return ensureRounds({ ...state, boardQuestions: [...state.boardQuestions, blankQuestion()] })
    case "duplicate-board": {
      if (!editing(state)) return state
      const source = state.boardQuestions[action.index]
      if (!source) return state
      const copy = rekey(source)
      const boardQuestions = state.boardQuestions.slice()
      boardQuestions.splice(action.index + 1, 0, copy)
      return ensureRounds({ ...state, boardQuestions })
    }
    case "delete-board": {
      if (!editing(state) || state.boardQuestions.length <= 1) return state
      return ensureRounds({
        ...state,
        boardQuestions: state.boardQuestions.filter((_, index) => index !== action.index),
      })
    }
    case "move-question": {
      if (!editing(state)) return state
      const key = bucketKey(action.bucket)
      const list = state[key].slice()
      const target = action.index + action.dir
      if (target < 0 || target >= list.length) return state
      const [row] = list.splice(action.index, 1)
      list.splice(target, 0, row)
      return ensureRounds({ ...state, [key]: list })
    }
    case "restore-samples":
      if (!editing(state)) return state
      return {
        ...state,
        boardQuestions: seedBoard(),
        stageQuestions: seedStage(),
        round1Id: "b1",
        round2Id: "b2",
      }
    case "import-bank":
      if (!editing(state)) return state
      return ensureRounds({
        ...state,
        boardQuestions: action.boardQuestions,
        stageQuestions: action.stageQuestions,
        round1Id: action.boardQuestions[0]?.id ?? state.round1Id,
        round2Id: action.boardQuestions[1]?.id ?? action.boardQuestions[0]?.id ?? state.round2Id,
      })
    case "goto-bank":
      return state.phase.type === "setup" ? { ...state, phase: { type: "bank" } } : state
    case "goto-setup":
      return state.phase.type === "bank" ? { ...state, phase: { type: "setup" } } : state
    case "start":
      if (startProblems(state).length) return state
      return {
        ...state,
        teams: state.teams.map((team) => ({ ...team, name: team.name.trim(), leader: "" })),
        picks: {},
        misses: {},
        events: [],
        taken: {},
        stageLog: [],
        phase: { type: "collect", round: 1 },
      }
    case "toggle-pick": {
      if (state.phase.type !== "collect") return state
      const current = state.picks[action.teamId] ?? []
      const has = current.includes(action.answerId)
      const full = slipCount(state, action.teamId) >= 3
      const next = has ? current.filter((id) => id !== action.answerId) : full ? current : [...current, action.answerId]
      return { ...state, picks: { ...state.picks, [action.teamId]: next } }
    }
    case "change-miss": {
      if (state.phase.type !== "collect") return state
      const current = state.misses[action.teamId] ?? 0
      if (action.delta > 0 && slipCount(state, action.teamId) >= 3) return state
      if (action.delta < 0 && current <= 0) return state
      return { ...state, misses: { ...state.misses, [action.teamId]: current + action.delta } }
    }
    case "clear-team-picks":
      if (state.phase.type !== "collect") return state
      return {
        ...state,
        picks: { ...state.picks, [action.teamId]: [] },
        misses: { ...state.misses, [action.teamId]: 0 },
      }
    case "begin-reveal": {
      if (state.phase.type !== "collect") return state
      const ready = state.teams.every((team) => slipCount(state, team.id) === 3)
      if (!ready && !action.force) return state
      return { ...state, phase: { type: "reveal", round: state.phase.round, cursor: 0 } }
    }
    case "reveal-next":
      return revealOne(state)
    case "reveal-all": {
      let next = state
      for (let step = 0; step < 8; step += 1) next = revealOne(next)
      return next
    }
    case "undo-reveal": {
      if (state.phase.type !== "reveal" || state.phase.cursor === 0) return state
      const item = boardQuestion(state, state.phase.round)
      const answer = item?.answers[state.phase.cursor - 1]
      if (!answer) return state
      const revealKey = `${state.phase.round}:${answer.id}`
      return {
        ...state,
        events: state.events.filter((event) => event.revealKey !== revealKey),
        phase: { ...state.phase, cursor: state.phase.cursor - 1 },
      }
    }
    case "reopen-slips": {
      if (state.phase.type !== "reveal") return state
      return {
        ...clearRoundReveals(state, state.phase.round),
        phase: { type: "collect", round: state.phase.round },
      }
    }
    case "continue-round": {
      if (state.phase.type !== "reveal" || state.phase.cursor < 8) return state
      if (state.phase.round === 1) return { ...state, picks: {}, misses: {}, phase: { type: "collect", round: 2 } }
      const stageOrder = standings(state).map((team) => team.id)
      return { ...state, picks: {}, misses: {}, stageOrder, phase: { type: "leaders" } }
    }
    case "move-stage-team": {
      if (state.phase.type !== "leaders") return state
      const order = normalizeOrder(state)
      const target = action.index + action.dir
      if (target < 0 || target >= order.length) return state
      const [row] = order.splice(action.index, 1)
      order.splice(target, 0, row)
      return { ...state, stageOrder: order }
    }
    case "begin-stage": {
      if (state.phase.type !== "leaders") return state
      const order = normalizeOrder(state)
      return {
        ...state,
        stageOrder: order,
        phase: { type: "stage", order, teamCursor: 0, questionCursor: 0, intro: true, result: null },
      }
    }
    case "dismiss-intro":
      if (state.phase.type !== "stage" || !state.phase.intro) return state
      return { ...state, phase: { ...state.phase, intro: false } }
    case "stage-mark":
      return markStage(state, action.answerId)
    case "stage-next":
      return advanceStage(state)
    case "undo-stage":
      return undoStage(state)
    case "new-night":
      return {
        ...state,
        teams: state.teams.map((team) => ({ ...team, leader: "" })),
        picks: {},
        misses: {},
        events: [],
        taken: {},
        stageOrder: state.teams.map((team) => team.id),
        stageLog: [],
        phase: { type: "setup" },
      }
    default: {
      const unexpected: never = action
      void unexpected
      return state
    }
  }
}
