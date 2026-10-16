import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"


function AuthorityRoute({ children }) {
  const { user } = useAuth()


  if (!user) {
    return <Navigate to="/login" />
  }


  if (user.role !== "authority") {
    return <Navigate to="/" />
  }


  return children
}


export default AuthorityRoute