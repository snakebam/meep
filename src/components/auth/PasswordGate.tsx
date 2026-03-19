import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { checkPassword, isAuthenticated, setAuthenticated } from '../../lib/auth'

export function PasswordGate() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (authed) return <Outlet />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkPassword(input)) {
      setAuthenticated()
      setAuthed(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-lg p-8 w-80 flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary-600" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Welcome</h1>
        <p className="text-sm text-text-secondary text-center">Enter your password to continue</p>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
            error
              ? 'border-danger bg-red-50 text-danger'
              : 'border-border bg-surface focus:border-primary-400'
          }`}
        />
        {error && <p className="text-xs text-danger">Incorrect password</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Log in
        </button>
      </form>
    </div>
  )
}
