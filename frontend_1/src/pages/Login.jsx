import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", { email, password })
      login(response.data.token, response.data.user)

      navigate(
        response.data.user.role === "authority" ? "/authority" : "/"
      )
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Log in to Digital Nivaran</h1>
        <p className="auth-description">
          Continue to your account to report or follow up on civic issues.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && <p className="form-message error-message" role="alert">{message}</p>}

          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>

      <aside className="auth-aside">
        <p className="eyebrow">Digital Nivaran</p>
        <h2>Every neighbourhood deserves to be heard.</h2>
        <p>
          Report local concerns, follow their progress and stay informed about
          the response.
        </p>
      </aside>
    </main>
  )
}

export default Login
