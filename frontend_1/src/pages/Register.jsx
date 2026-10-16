import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      await api.post("/auth/register", { name, email, password })
      setMessage("Account created successfully. Redirecting to login...")

      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Registration failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Get started</p>
        <h1>Create your account</h1>
        <p className="auth-description">
          Join Digital Nivaran to report local issues and track updates.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          <button
            className="button button-primary button-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>

      <aside className="auth-aside">
        <p className="eyebrow">A stronger community</p>
        <h2>Good civic action starts with a clear report.</h2>
        <p>
          Add useful details, provide photo evidence and keep track of the
          response to your reported issue.
        </p>
      </aside>
    </main>
  )
}

export default Register
