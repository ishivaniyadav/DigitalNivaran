import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      })

      navigate("/login")
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Registration failed"
      )
    }
  }

  return (
    <main>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          Register
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}

export default Register