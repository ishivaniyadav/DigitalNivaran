import { useEffect, useState } from "react"
import api from "../services/api"

function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [message, setMessage] = useState("Loading...")

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("token")

        const response = await api.get(
          "/complaints/my",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        setComplaints(response.data.complaints)

        if (response.data.complaints.length === 0) {
          setMessage("No complaints submitted yet.")
        } else {
          setMessage("")
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
          "Failed to load complaints"
        )
      }
    }

    fetchComplaints()
  }, [])

  return (
    <main>
      <h1>My Complaints</h1>

      {message && <p>{message}</p>}

      {complaints.map((complaint) => (
        <div key={complaint._id}>
          <h3>{complaint.category}</h3>

          <p>{complaint.description}</p>

          <p>
            Location: {complaint.location}
          </p>

          <p>
            Priority: {complaint.priority}
          </p>

          <p>
            Status: {complaint.status}
          </p>

          <hr />
        </div>
      ))}
    </main>
  )
}

export default MyComplaints