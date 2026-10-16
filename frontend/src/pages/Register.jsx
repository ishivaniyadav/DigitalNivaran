import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, Zap } from "lucide-react"
import api from "../services/api"
import BrandName from "../components/BrandName"

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
      setTimeout(() => navigate("/login"), 1000)
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page auth-page-reference auth-register-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand-lockup" aria-label="Digital Nivaran home">
          <span className="auth-brand-icon"><Zap size={23} fill="currentColor" /></span>
          <span><BrandName className="brand-name-inverse" /><small>CIVIC INTELLIGENCE</small></span>
        </Link>
        <div className="auth-hero-copy">
          <p className="auth-hero-kicker"><i /> A BETTER COMMUNITY STARTS TOGETHER</p>
          <h2>Your city.<br /><span>Your voice.</span><br /><span className="auth-change-line">Real change.</span></h2>
          <p className="auth-hero-description">Create an account to report local issues, follow progress, and help make your neighbourhood better for everyone.</p>
        </div>
        <div className="auth-hero-footer"><span><ShieldCheck size={15} /> Community focused</span><span><Sparkles size={15} /> ML assisted insights</span></div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-secure-line"><span><ShieldCheck size={16} /> SECURE COMMUNITY ACCESS</span><span className="auth-language">EN <small>⌄</small></span></div>
          <div className="auth-title-row"><span className="auth-title-icon"><Sparkles size={20} /></span><div><h1>Create your account</h1><p>Join your community and make your voice count.</p></div></div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <div className="auth-input-wrap"><UserRound size={18} /><input id="name" type="text" autoComplete="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            </div>

            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap"><Mail size={18} /><input id="email" type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="new-password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div>
            </div>

            {message && <p className="form-message" role="status">{message}</p>}

            <button className="button button-primary button-full auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}<ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}

export default Register
