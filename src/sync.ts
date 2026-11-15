import { useEffect, useState } from "react"
import { fresh, hydrate, type GameState } from "./model"

export const STORAGE_KEY = "bar-feuds-v1"
const CHANNEL = "bar-feuds"

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh()
    return hydrate(JSON.parse(raw) as unknown)
  } catch {
    return fresh()
  }
}

export function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode can refuse storage. The night still runs in this tab.
  }
  try {
    const channel = new BroadcastChannel(CHANNEL)
    channel.postMessage(state)
    channel.close()
  } catch {
    // The room screen falls back to reading local storage.
  }
}

export function useRoomState() {
  const [state, setState] = useState(loadState)
  useEffect(() => {
    const apply = (next: GameState) => {
      setState((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next))
    }
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(CHANNEL)
      channel.onmessage = (event) => apply(hydrate(event.data))
    } catch {
      channel = null
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) apply(hydrate(JSON.parse(event.newValue) as unknown))
    }
    const poll = window.setInterval(() => apply(loadState()), 400)
    window.addEventListener("storage", onStorage)
    return () => {
      channel?.close()
      window.removeEventListener("storage", onStorage)
      window.clearInterval(poll)
    }
  }, [])
  return state
}

export function roomUrl() {
  return `${location.origin}${location.pathname}#board`
}
