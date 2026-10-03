import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav>
      <h2>Smart Civic</h2>

      <div>
        <Link to="/">Home</Link>

        {user ? (
          <>
            <Link to="/report">Report Issue</Link>

            <Link to="/complaints">
              My Complaints
            </Link>

            <span>Hello, {user.name}</span>

            <button onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar