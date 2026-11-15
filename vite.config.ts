import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { surveyApi } from "./server/survey-plugin.js"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
  return { plugins: [react(), surveyApi()] }
})
