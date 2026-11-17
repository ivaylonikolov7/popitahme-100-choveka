const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function cleanEmail(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase().slice(0, 80)
}

export function emailOk(value: string) {
  return value.length <= 80 && EMAIL.test(value)
}
