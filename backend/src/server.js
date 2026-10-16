
const express = require("express")
const cors = require("cors")
require("dotenv").config()

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
    message: "Smart Community backend is running"
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/complaints", complaintRoutes)
app.use("/api/analytics", analyticsRoutes)

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body"
    })
  }

  next(error)
})

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start backend:", error.message)
    process.exit(1)
  }
}

startServer()