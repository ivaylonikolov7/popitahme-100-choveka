export function cleanRevolut(value: unknown) {
  if (typeof value !== "string") return ""
  const trimmed = value.trim().slice(0, 40)
  const digits = trimmed.replace(/\D/g, "")
  if (/^[\d\s+()-]+$/.test(trimmed)) return `${trimmed.startsWith("+") ? "+" : ""}${digits}`
  return trimmed.replace(/^@+/, "")
}

export function revolutOk(value: string) {
  if (value.startsWith("+") || /^\d+$/.test(value)) return value.replace(/\D/g, "").length >= 8
  return value.length >= 2
}
