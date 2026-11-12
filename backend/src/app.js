
const express = require("express")
const cors = require("cors")

const connectDB = require("./config/db")

const authRoutes = require("./routes/authRoutes")
const complaintRoutes = require("./routes/complaintRoutes")
const analyticsRoutes = require("./routes/analyticsRoutes")

const app = express()

app.use(cors())

app.use(express.json({ limit: "1mb" }))

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Digital Nivaran backend is running"
  })
})

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    console.error("Database connection error:", error.message)

    res.status(503).json({
      success: false,
      message: "Database connection unavailable"
    })
  }
})

app.use("/api/auth", authRoutes)
app.use("/api/complaints", complaintRoutes)
app.use("/api/analytics", analyticsRoutes)

app.use((error, req, res, next) => {
  console.error("Backend error:", error.message)

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body"
    })
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  })
})

module.exports = app
