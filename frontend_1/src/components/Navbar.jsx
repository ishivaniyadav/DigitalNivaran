import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
            <strong>Digital Nivaran</strong>
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