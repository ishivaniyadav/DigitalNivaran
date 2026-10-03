import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

function ReportIssue() {
  const navigate = useNavigate()

  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [severity, setSeverity] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")

      const response = await api.post(
        "/complaints",
        {
          description,
          location,
          severity: Number(severity)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setMessage(response.data.message)

      setDescription("")
      setLocation("")
      setSeverity("")

      setTimeout(() => {
        navigate("/complaints")
      }, 1000)
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to submit complaint"
      )
    }
  }

  return (
    <main>
      <h1>Report an Issue</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue"
            required
          />
        </div>

        <div>
          <label>Location</label>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            required
          />
        </div>

        <div>
          <label>Severity</label>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            required
          >
            <option value="">Select severity</option>
            <option value="1">Low</option>
            <option value="2">Medium</option>
            <option value="3">High</option>
          </select>
        </div>

        <button type="submit">
          Submit Complaint
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}

export default ReportIssue