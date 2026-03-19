const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string
const AUTH_KEY = 'meep_authenticated'

export function checkPassword(input: string): boolean {
  return input === APP_PASSWORD
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_KEY, 'true')
}
