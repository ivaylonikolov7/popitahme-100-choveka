import {
  awardFor,
  fresh,
  pointTotal,
  reducer,
  seedBoard,
  seedStage,
  standings,
  type GameState,
} from "../src/model.ts"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

for (const item of [...seedBoard(), ...seedStage()]) {
  assert(item.answers.length === 8, `${item.id} should have 8 answers`)
  assert(pointTotal(item) === 100, `${item.id} totals ${pointTotal(item)}`)
}

const sample = seedBoard()[0]
assert(awardFor(sample, 0, 1) === sample.answers[0].points, "round 1 pays face value")
assert(awardFor(sample, 7, 2) === sample.answers[0].points, "round 2 pays the top value to the rarest answer")
assert(awardFor(sample, 0, 2) === sample.answers[7].points, "round 2 pays the bottom value to the favorite")

let state: GameState = fresh()
for (const [index, name] of ["Alpha", "Bravo", "Charlie", "Delta"].entries()) {
  state = reducer(state, { type: "rename", index, name })
}
state = reducer(state, { type: "start" })
assert(state.phase.type === "collect" && state.phase.round === 1, "round 1 should start")

const board = state.boardQuestions[0]
const picks: Record<string, number[]> = {
  t1: [4, 5, 6],
  t2: [0, 1, 2],
  t3: [5, 6, 7],
  t4: [4, 6, 7],
}
for (const [teamId, indexes] of Object.entries(picks)) {
  for (const index of indexes) {
    state = reducer(state, { type: "toggle-pick", teamId, answerId: board.answers[index].id })
  }
  state = reducer(state, { type: "toggle-pick", teamId, answerId: board.answers[3].id })
  assert((state.picks[teamId] ?? []).length === 3, `${teamId} should stay at 3 picks`)
}

state = reducer(state, { type: "reveal-next" })
assert(state.phase.type === "collect", "reveal should wait until slips are locked")
state = reducer(state, { type: "begin-reveal" })
state = reducer(state, { type: "reveal-next" })
const shared = standings(state).find((team) => team.id === "t2")
assert(shared?.score === board.answers[0].points, "only the team on the top answer should have those points so far")
state = reducer(state, { type: "undo-reveal" })
assert(standings(state).every((team) => team.score === 0), "undo should pull the points back")
state = reducer(state, { type: "reveal-all" })
assert(state.phase.type === "reveal" && state.phase.cursor === 8, "the whole board should be open")

const afterRound1 = Object.fromEntries(standings(state).map((team) => [team.id, team.score]))
assert(afterRound1.t2 === 28 + 18 + 14, `Bravo should lead round 1, got ${afterRound1.t2}`)
assert(afterRound1.t1 === 9 + 8 + 6, `Alpha round 1, got ${afterRound1.t1}`)

state = reducer(state, { type: "continue-round" })
assert(state.phase.type === "collect" && state.phase.round === 2, "round 2 should collect next")
const second = state.boardQuestions.find((item) => item.id === state.round2Id)
assert(second, "round 2 question missing")
for (const team of state.teams) {
  for (const index of [5, 6, 7]) {
    state = reducer(state, { type: "toggle-pick", teamId: team.id, answerId: second.answers[index].id })
  }
}
state = reducer(state, { type: "begin-reveal" })
state = reducer(state, { type: "reveal-all" })
const flipped = awardFor(second, 5, 2) + awardFor(second, 6, 2) + awardFor(second, 7, 2)
const afterRound2 = Object.fromEntries(standings(state).map((team) => [team.id, team.score]))
assert(afterRound2.t1 === afterRound1.t1 + flipped, "round 2 should add the flipped points")
assert(afterRound2.t2 > afterRound2.t1 && afterRound2.t1 > afterRound2.t4 && afterRound2.t4 > afterRound2.t3, "the lead order should hold")

state = reducer(state, { type: "continue-round" })
assert(state.phase.type === "leaders", "leaders should be next")
assert(state.stageOrder[0] === "t2", "the leader should walk up first")

state = reducer(state, { type: "begin-stage" })
assert(state.phase.type === "stage" && state.phase.intro, "the first leader should be announced")
state = reducer(state, { type: "dismiss-intro" })
const stageAnswer = state.stageQuestions[0].answers[0]
state = reducer(state, { type: "stage-mark", answerId: stageAnswer.id })
assert(state.phase.type === "stage" && state.phase.result?.points === stageAnswer.points, "a fresh answer should pay")
state = reducer(state, { type: "stage-next" })
assert(state.phase.type === "stage" && state.phase.questionCursor === 1, "the same leader should get the next question")

for (let step = 0; step < 4; step += 1) {
  state = reducer(state, { type: "stage-mark", answerId: null })
  state = reducer(state, { type: "stage-next" })
}
assert(state.phase.type === "stage" && state.phase.intro && state.phase.teamCursor === 1, "the second team should be called")
state = reducer(state, { type: "dismiss-intro" })
state = reducer(state, { type: "stage-mark", answerId: stageAnswer.id })
assert(state.phase.type === "stage" && state.phase.result?.repeat && state.phase.result.points === 0, "a repeat scores nothing")
const claimedBy = standings(state).find((team) => team.id === "t2")?.score
state = reducer(state, { type: "undo-stage" })
assert(state.phase.type === "stage" && state.phase.result === null, "undo should reopen the guess")
assert(standings(state).find((team) => team.id === "t2")?.score === claimedBy, "undoing a repeat should not change the first team's score")

let misses = fresh()
for (const [index, name] of ["Alpha", "Bravo", "Charlie", "Delta"].entries()) {
  misses = reducer(misses, { type: "rename", index, name })
}
misses = reducer(misses, { type: "start" })
const top = misses.boardQuestions[0].answers[0]
misses = reducer(misses, { type: "toggle-pick", teamId: "t1", answerId: top.id })
misses = reducer(misses, { type: "change-miss", teamId: "t1", delta: 1 })
misses = reducer(misses, { type: "change-miss", teamId: "t1", delta: 1 })
const beforeFourth = misses.picks.t1?.length ?? 0
misses = reducer(misses, { type: "toggle-pick", teamId: "t1", answerId: misses.boardQuestions[0].answers[1].id })
assert((misses.picks.t1?.length ?? 0) === beforeFourth, "a miss should use up a slip")
assert((misses.misses.t1 ?? 0) === 2, "two slips can miss the board")
for (const teamId of ["t2", "t3", "t4"]) {
  for (const answer of misses.boardQuestions[0].answers.slice(0, 3)) {
    misses = reducer(misses, { type: "toggle-pick", teamId, answerId: answer.id })
  }
}
const scoreBefore = standings(misses).find((team) => team.id === "t1")?.score ?? 0
misses = reducer(misses, { type: "begin-reveal" })
misses = reducer(misses, { type: "reveal-all" })
const scoreAfter = standings(misses).find((team) => team.id === "t1")?.score ?? 0
assert(scoreAfter - scoreBefore === top.points, "only the answer on the board should score")

console.log("bar feuds rules check passed")
