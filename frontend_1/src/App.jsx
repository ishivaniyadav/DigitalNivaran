import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import AuthorityRoute from "./components/AuthorityRoute"

import { AuthProvider } from "./context/AuthContext"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ReportIssue from "./pages/ReportIssue"
import MyComplaints from "./pages/MyComplaints"
import AuthorityDashboard from "./pages/AuthorityDashboard"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportIssue />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            }
          />

          <Route
            path="/authority"
            element={
              <AuthorityRoute>
                <AuthorityDashboard />
              </AuthorityRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App