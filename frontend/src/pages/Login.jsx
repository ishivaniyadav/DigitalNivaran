import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import BrandName from "../components/BrandName"

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
    <main className="auth-page auth-page-reference">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand-lockup" aria-label="Digital Nivaran home">
          <span className="auth-brand-icon"><Zap size={23} fill="currentColor" /></span>
          <span><BrandName className="brand-name-inverse" /><small>CIVIC INTELLIGENCE</small></span>
        </Link>
        <div className="auth-hero-copy">
          <p className="auth-hero-kicker"><i /> A BETTER COMMUNITY STARTS TOGETHER</p>
          <h2>Your city.<br /><span>Your voice.</span><br /><span className="auth-change-line">Real change.</span></h2>
          <p className="auth-hero-description">One place to report local issues, follow progress, and help make your neighbourhood better for everyone.</p>
          <div className="auth-neighbourhood-art" aria-hidden="true"><span className="auth-orbit auth-orbit-one" /><span className="auth-orbit auth-orbit-two" /><i className="auth-map-pin">●</i><b>YOUR NEIGHBOURHOOD</b></div>
        </div>
        <div className="auth-hero-footer"><span><ShieldCheck size={15} /> Community focused</span><span><Sparkles size={15} /> ML assisted insights</span></div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-secure-line"><span><ShieldCheck size={16} /> SECURE COMMUNITY ACCESS</span><span className="auth-language">EN <small>⌄</small></span></div>
          <div className="auth-title-row"><span className="auth-title-icon"><Sparkles size={20} /></span><div><h1>Welcome back</h1><p>Sign in to continue to your community workspace.</p></div></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap"><Mail size={18} /><input id="email" type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          </div>

          {message && <p className="form-message error-message" role="alert">{message}</p>}

          <div className="auth-signin-options"><label><input type="checkbox" /> Keep me signed in</label><span><LockKeyhole size={13} /> Protected with encryption</span></div>
          <button className="button button-primary button-full auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}<ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch">New to Digital Nivaran? <Link to="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  )
}

export default Login
