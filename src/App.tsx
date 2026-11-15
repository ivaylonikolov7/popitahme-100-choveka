import { useEffect, useState } from "react"
import { BoardApp } from "./BoardApp"
import { HostApp } from "./HostApp"
import { AdminApp } from "./survey/AdminApp"
import { SurveyApp } from "./survey/SurveyApp"

const gameEnabled = false

type Mode = "survey" | "admin" | "host" | "board"

function modeFromHash(): Mode {
  if (window.location.hash === "#otgovori") return "admin"
  if (!gameEnabled) return "survey"
  if (window.location.hash === "#igra") return "host"
  if (window.location.hash === "#board") return "board"
  return "survey"
}

export function App() {
  const [mode, setMode] = useState(modeFromHash)
  useEffect(() => {
    const onHash = () => setMode(modeFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  useEffect(() => {
    if (mode === "host") document.title = "Барски дуел"
    if (mode === "board") document.title = "Барски дуел · Зала"
  }, [mode])
  if (mode === "admin") return <AdminApp />
  if (mode === "host") return <HostApp />
  if (mode === "board") return <BoardApp />
  return <SurveyApp />
}
