import { useEffect, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import BrandName from "./BrandName"

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem("dn-theme") === "dark" ? "dark" : "light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("dn-theme", theme)
  }, [theme])

  const isAuthority = user?.role === "authority"

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link to="/" className="site-brand">
          <span className="site-brand-mark">DN</span>
          <span className="site-brand-text">
            <BrandName className="site-brand-wordmark" />
            <small>Community issue reporting</small>
          </span>
        </Link>

        <div className="site-nav-links">
          <NavLink to="/" end className="site-nav-link">
            Home
          </NavLink>

          {user && !isAuthority && (
            <NavLink to="/complaints" className="site-nav-link">
              My complaints
            </NavLink>
          )}

          {isAuthority && (
            <NavLink to="/authority" className="site-nav-link">
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="site-nav-actions">
          <button
            type="button"
            className="site-theme-toggle"
            onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {user ? (
            <>
              {!isAuthority && (
                <Link to="/report" className="site-nav-primary">
                  Report an issue
                </Link>
              )}

              <button
                type="button"
                className="site-nav-logout"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="site-nav-login">
                Log in
              </Link>

              <Link to="/register" className="site-nav-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
